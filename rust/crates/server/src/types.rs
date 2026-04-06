use serde::{Deserialize, Serialize};
use axum::{http::StatusCode, Json};
use runtime::{ConversationMessage, Session as RuntimeSession};
use crate::SessionId;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum CommandRisk { Low, Medium, High, Blocked }

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum LogStream { Stdout, Stderr, System }

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum SessionEvent {
    Snapshot {
        session_id: SessionId,
        session: RuntimeSession,
        working_dir: String,
    },
    Message {
        session_id: SessionId,
        message: ConversationMessage,
    },
    PartialMessage {
        session_id: SessionId,
        delta: String,
    },
    RequiresApproval {
        session_id: SessionId,
        command: String,
        risk: CommandRisk,
        blocked: bool,
    },
    Log {
        content: String,
        stream: LogStream,
    },
    Done { exit_code: i32 },
    Error { content: String },
}

use axum::response::sse::Event;
use std::time::{SystemTime, UNIX_EPOCH};

impl SessionEvent {
    pub fn event_name(&self) -> &'static str {
        match self {
            Self::Snapshot { .. } => "snapshot",
            Self::Message { .. } => "message",
            Self::PartialMessage { .. } => "partial_message",
            Self::RequiresApproval { .. } => "requires_approval",
            Self::Log { .. } => "log",
            Self::Done { .. } => "done",
            Self::Error { .. } => "error",
        }
    }

    pub fn to_sse_event(&self) -> Result<Event, serde_json::Error> {
        Ok(Event::default()
            .event(self.event_name())
            .data(serde_json::to_string(self)?))
    }
}

pub fn to_sse_event(event: &SessionEvent) -> Result<Event, serde_json::Error> {
    event.to_sse_event()
}

pub fn unix_timestamp_millis() -> u64 {
    SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis() as u64
}

#[derive(Debug, Serialize)]
pub struct ErrorResponse { pub error: String }

pub type ApiError = (StatusCode, Json<ErrorResponse>);
pub type ApiResult<T> = Result<T, ApiError>;

pub fn not_found(msg: String) -> ApiError {
    (StatusCode::NOT_FOUND, Json(ErrorResponse { error: msg }))
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImagePayload {
    pub media_type: String,
    pub data: String, // base64
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SendMessageRequest {
    pub message: String,
    pub images: Option<Vec<ImagePayload>>,
    pub model: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateSessionRequest {
    pub working_dir: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct CreateSessionResponse {
    pub session_id: String,
    pub working_dir: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApproveCommandRequest {
    pub approved: bool,
}
