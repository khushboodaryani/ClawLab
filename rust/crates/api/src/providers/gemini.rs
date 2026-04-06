use std::collections::VecDeque;
use std::pin::Pin;

use futures_util::Stream;
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::error::ApiError;
use crate::types::*;

use super::{Provider, ProviderFuture};

#[derive(Debug, Clone)]
pub struct GeminiClient {
    http: reqwest::Client,
    api_key: String,
    model: String,
}

impl GeminiClient {
    pub fn new(api_key: impl Into<String>, model: String) -> Self {
        Self {
            http: reqwest::Client::new(),
            api_key: api_key.into(),
            model,
        }
    }

    pub fn from_env(api_key_env: &'static str, model: String) -> Result<Self, ApiError> {
        let api_key = std::env::var(api_key_env).map_err(|_| {
            ApiError::missing_credentials("Gemini", &["GEMINI_API_KEY"])
        })?;
        Ok(Self::new(api_key, model))
    }
}

#[derive(Serialize)]
struct GeminiRequest {
    contents: Vec<GeminiContent>,
}

#[derive(Serialize, Deserialize)]
struct GeminiContent {
    role: String,
    parts: Vec<GeminiPart>,
}

#[derive(Serialize, Deserialize)]
#[serde(untagged)]
enum GeminiPart {
    Text { 
        text: String 
    },
    InlineData {
        #[serde(rename = "inline_data")]
        inline_data: GeminiInlineData 
    },
}

#[derive(Serialize, Deserialize)]
struct GeminiInlineData {
    mime_type: String,
    data: String,
}

#[derive(Deserialize)]
struct GeminiResponseChunk {
    candidates: Option<Vec<GeminiCandidate>>,
    #[serde(rename = "usageMetadata")]
    #[allow(dead_code)]
    usage_metadata: Option<Value>,
}

#[derive(Deserialize)]
struct GeminiCandidate {
    content: Option<GeminiContent>,
    #[serde(rename = "finishReason")]
    finish_reason: Option<String>,
}

impl Provider for GeminiClient {
    type Stream = MessageStream;

    fn send_message<'a>(
        &'a self,
        _request: &'a MessageRequest,
    ) -> ProviderFuture<'a, MessageResponse> {
        Box::pin(async move {
            Err(ApiError::Auth("Direct send_message not implemented for Gemini yet".to_string()))
        })
    }

    fn stream_message<'a>(
        &'a self,
        request: &'a MessageRequest,
    ) -> ProviderFuture<'a, Self::Stream> {
        let api_key = self.api_key.clone();
        let model = self.model.clone();
        let http = self.http.clone();
        
        let mut contents = Vec::new();
        for msg in &request.messages {
            let role = match msg.role.as_str() {
                "assistant" => "model",
                _ => "user",
            };
            
            let mut parts = Vec::new();
            for block in &msg.content {
                match block {
                    crate::types::InputContentBlock::Text { text } => {
                        parts.push(GeminiPart::Text { text: text.clone() });
                    }
                    crate::types::InputContentBlock::Image { source } => {
                        parts.push(GeminiPart::InlineData {
                            inline_data: GeminiInlineData {
                                mime_type: source.media_type.clone(),
                                data: source.data.clone(),
                            },
                        });
                    }
                    _ => {} // Other blocks not supported by Gemini simplified mapper yet
                }
            }
            
            contents.push(GeminiContent {
                role: role.to_string(),
                parts,
            });
        }

        Box::pin(async move {
            let gemini_req = GeminiRequest { contents };
            let url = format!(
                "https://generativelanguage.googleapis.com/v1beta/models/{}:streamGenerateContent?key={}",
                model, api_key
            );

            let response = http
                .post(&url)
                .json(&gemini_req)
                .send()
                .await
                .map_err(ApiError::from)?;

            if !response.status().is_success() {
                let status = response.status();
                let body = response.text().await.unwrap_or_default();
                return Err(ApiError::ProviderError {
                    provider: "Gemini".to_string(),
                    message: format!("{} - {}", status, body),
                });
            }

            Ok(MessageStream {
                response: Box::pin(response.bytes_stream()),
                buffer: Vec::new(),
                pending: VecDeque::new(),
                done: false,
            })
        })
    }
}

pub struct MessageStream {
    response: Pin<Box<dyn Stream<Item = Result<bytes::Bytes, reqwest::Error>> + Send>>,
    buffer: Vec<u8>,
    pending: VecDeque<StreamEvent>,
    done: bool,
}

impl std::fmt::Debug for MessageStream {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("MessageStream")
            .field("done", &self.done)
            .field("pending_count", &self.pending.len())
            .finish()
    }
}

impl MessageStream {
    #[must_use]
    pub fn request_id(&self) -> Option<&str> {
        None
    }

    pub async fn next_event(&mut self) -> Result<Option<StreamEvent>, ApiError> {
        use tokio_stream::StreamExt;
        loop {
            if let Some(event) = self.pending.pop_front() {
                return Ok(Some(event));
            }

            if self.done {
                return Ok(None);
            }

            match self.response.next().await {
                Some(chunk) => {
                    let chunk = chunk.map_err(ApiError::from)?;
                    self.buffer.extend_from_slice(&chunk);

                    // Robustly find JSON objects in the buffer
                    let mut bytes_to_drain = 0;
                    while let Some(&b) = self.buffer.get(bytes_to_drain) {
                        if b == b'[' || b == b',' || b.is_ascii_whitespace() || b == b']' {
                            bytes_to_drain += 1;
                        } else {
                            break;
                        }
                    }
                    self.buffer.drain(..bytes_to_drain);

                    // Attempt to parse a single JSON object
                    let mut stream = serde_json::Deserializer::from_slice(&self.buffer).into_iter::<GeminiResponseChunk>();
                    if let Some(Ok(res)) = stream.next() {
                        let consumed = stream.byte_offset();
                        self.buffer.drain(..consumed);
                        
                        if let Some(candidates) = res.candidates {
                            for cand in candidates {
                                if let Some(content) = cand.content {
                                    for part in content.parts {
                                        if let GeminiPart::Text { text } = part {
                                            self.pending.push_back(StreamEvent::ContentBlockDelta(ContentBlockDeltaEvent {
                                                index: 0,
                                                delta: ContentBlockDelta::TextDelta { text },
                                            }));
                                        }
                                    }
                                }
                                if let Some(reason) = cand.finish_reason {
                                    if reason == "STOP" {
                                        self.pending.push_back(StreamEvent::MessageStop(MessageStopEvent {}));
                                    }
                                }
                            }
                        }
                    }
                }
                None => {
                    self.done = true;
                    // Ensure the stream ends cleanly
                    if !self.pending.iter().any(|e| matches!(e, StreamEvent::MessageStop(_))) {
                        self.pending.push_back(StreamEvent::MessageStop(MessageStopEvent {}));
                    }
                }
            }
        }
    }
}
