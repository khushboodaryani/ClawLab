use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
    response::sse::{Event, KeepAlive, Sse},
};
use axum::response::IntoResponse;
use async_stream::stream;
use std::convert::Infallible;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::{broadcast, oneshot, RwLock};
use futures_util::StreamExt;

use crate::{AppState, SessionId};
use crate::types::{ApiResult, ApiError, ErrorResponse, not_found, SessionEvent, CommandRisk, LogStream, unix_timestamp_millis};
use runtime::{ContentBlock, ConversationMessage, Session as RuntimeSession};
use api::{InputContentBlock, InputMessage, MessageRequest};

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SendMessageRequest {
    pub message: String,
    pub images: Option<Vec<ImagePayload>>,
    pub model: Option<String>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ImagePayload {
    pub media_type: String,
    pub data: String, // base64
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ApproveCommandRequest { pub approved: bool }

pub async fn send_message(
    State(state): State<AppState>,
    Path(id): Path<SessionId>,
    Json(payload): Json<SendMessageRequest>,
) -> ApiResult<StatusCode> {
    let (broadcaster, working_dir, pending_approval_handle, mut conversation) = {
        let mut sessions = state.sessions.write().await;
        let session = sessions.get_mut(&id).ok_or_else(|| not_found(format!("session `{id}` not found")))?;

        let mut blocks = vec![ContentBlock::Text { text: payload.message.clone() }];
        if let Some(images) = &payload.images {
            for img in images {
                blocks.push(ContentBlock::Text { text: format!("[Attached Image: {}]", img.media_type) });
            }
        }

        let user_msg = ConversationMessage {
            role: runtime::MessageRole::User,
            blocks,
            usage: None,
            timestamp: Some(unix_timestamp_millis()),
        };
        session.conversation.messages.push(user_msg.clone());

        // Persist to MongoDB
        let _ = crate::db::chat::upsert_session(&state.db, &id, &session.conversation.messages).await;

        let _ = session.events.send(SessionEvent::Message { session_id: id.clone(), message: user_msg });

        (session.events.clone(), session.working_dir.clone(), session.pending_approval.clone(), session.conversation.clone())
    };

    let model = payload.model.clone().unwrap_or_else(|| "claude-3-5-sonnet-20241022".to_string());
    let client = api::ProviderClient::from_model(&model).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() })))?;

    let mut api_blocks = vec![InputContentBlock::Text { text: payload.message }];
    if let Some(images) = payload.images {
        for img in images {
            api_blocks.push(InputContentBlock::Image {
                source: api::types::ImageSource {
                    kind: "base64".to_string(),
                    media_type: img.media_type,
                    data: img.data,
                }
            });
        }
    }

    tokio::spawn(async move {
        agent_loop(state, client, conversation, id, broadcaster, working_dir, pending_approval_handle, model, api_blocks).await;
    });

    Ok(StatusCode::NO_CONTENT)
}

pub async fn agent_loop(
    state: AppState,
    client: api::ProviderClient,
    mut conversation: runtime::Session,
    session_id: SessionId,
    broadcaster: broadcast::Sender<SessionEvent>,
    working_dir: PathBuf,
    pending_approval: Arc<RwLock<Option<(String, oneshot::Sender<bool>)>>>,
    model: String,
    new_user_blocks: Vec<InputContentBlock>,
) {
    let mut current_working_dir = working_dir;

    loop {
        let mut system_context = format!(
            "You are a Senior Software Engineer assistant. \
            Be conversational, professional, and natural. \
            Your active project directory is: {}. \
            To perform any filesystem or terminal operations, use: <run>command</run>. \
            CRITICAL: \
            - ONLY use <run> for actual needed operations. \
            - NEVER mention or explain the <run> tags to the user. \
            - Wait for results before taking next steps. \
            - Respond like a human engineer, not a technical manual.",
            current_working_dir.to_string_lossy()
        );

        let mut initial_files = String::new();
        if let Ok(entries) = std::fs::read_dir(&current_working_dir) {
            for entry in entries.flatten().take(50) {
                if let Ok(name) = entry.file_name().into_string() {
                    initial_files.push_str(&name);
                    initial_files.push('\n');
                }
            }
        }
        system_context.push_str(&format!("\n\nCurrent project structure:\n{}\n", initial_files));

        let mut api_messages: Vec<InputMessage> = conversation.messages.iter().map(|m| InputMessage {
            role: match m.role {
                runtime::MessageRole::User => "user".to_string(),
                runtime::MessageRole::Assistant => "assistant".to_string(),
                _ => "user".to_string(),
            },
            content: m.blocks.iter().map(|b| match b {
                ContentBlock::Text { text } => InputContentBlock::Text { text: text.clone() },
                _ => InputContentBlock::Text { text: "[Artifact]".to_string() },
            }).collect(),
        }).collect();

        if !new_user_blocks.is_empty() {
            if let Some(last) = api_messages.iter_mut().rev().find(|m| m.role == "user") {
                last.content = new_user_blocks.clone();
            }
        }

        let _ = broadcaster.send(SessionEvent::Log { content: "🤖 Thinking...".to_string(), stream: LogStream::System });

        let mut stream = match client.stream_message(&MessageRequest {
            model: model.clone(),
            max_tokens: 4096,
            messages: api_messages,
            system: Some(system_context),
            tools: None, tool_choice: None,
            stream: true,
        }).await {
            Ok(s) => s,
            Err(e) => {
                let _ = broadcaster.send(SessionEvent::Error { content: format!("AI Error: {e}") });
                return;
            }
        };

        let mut assistant_text = String::new();
        while let Ok(Some(event)) = stream.next_event().await {
            if let api::types::StreamEvent::ContentBlockDelta(ev) = event {
                if let api::types::ContentBlockDelta::TextDelta { text } = ev.delta {
                    assistant_text.push_str(&text);
                    let _ = broadcaster.send(SessionEvent::PartialMessage { session_id: session_id.clone(), delta: text });
                }
            }
        }

        let assistant_msg = ConversationMessage::assistant(vec![ContentBlock::Text { text: assistant_text.clone() }]);
        conversation.messages.push(assistant_msg.clone());
        
        // Persist to MongoDB
        let _ = crate::db::chat::upsert_session(&state.db, &session_id, &conversation.messages).await;

        let _ = broadcaster.send(SessionEvent::Message { session_id: session_id.clone(), message: assistant_msg });

        if let Some(command) = extract_run_tag(&assistant_text) {
            let risk = classify_command(&command);
            let blocked = risk == CommandRisk::Blocked;
            let _ = broadcaster.send(SessionEvent::RequiresApproval { session_id: session_id.clone(), command: command.clone(), risk, blocked });

            if blocked { return; }

            let (tx, rx) = oneshot::channel::<bool>();
            { let mut lock = pending_approval.write().await; *lock = Some((command.clone(), tx)); }

            match rx.await {
                Ok(true) => {
                    let output = run_command_with_streaming_and_return(&command, &current_working_dir, &session_id, &broadcaster).await;
                    if command.starts_with("cd ") {
                        let new_rel_path = command[3..].trim();
                        let new_path = current_working_dir.join(new_rel_path);
                        if let Ok(abs) = std::fs::canonicalize(&new_path) { current_working_dir = abs; }
                        else { current_working_dir = new_path; }
                    } else if command == "cd .." {
                        if let Some(p) = current_working_dir.parent() { current_working_dir = p.to_path_buf(); }
                    }
                    let res_msg = ConversationMessage::user_text(format!("Command `{command}` finished with output:\n{output}"));
                    conversation.messages.push(res_msg);
                    
                    // Persist to MongoDB
                    let _ = crate::db::chat::upsert_session(&state.db, &session_id, &conversation.messages).await;
                    
                    continue;
                }
                _ => {
                    let _ = broadcaster.send(SessionEvent::Error { content: "Denied.".to_string() });
                    return;
                }
            }
        }
        break;
    }
}

pub async fn approve_command(State(state): State<AppState>, Path(id): Path<SessionId>, Json(payload): Json<ApproveCommandRequest>) -> ApiResult<StatusCode> {
    let sessions = state.sessions.read().await;
    let s = sessions.get(&id).ok_or_else(|| not_found(format!("session `{id}` not found")))?;
    let mut lock = s.pending_approval.write().await;
    if let Some((_, tx)) = lock.take() { let _ = tx.send(payload.approved); Ok(StatusCode::NO_CONTENT) }
    else { Err((StatusCode::CONFLICT, Json(ErrorResponse { error: "No pending command".into() }))) }
}

pub async fn stream_session_events(State(state): State<AppState>, Path(id): Path<SessionId>) -> ApiResult<impl IntoResponse> {
    let sess_guard = state.sessions.read().await;
    let s = sess_guard.get(&id).ok_or_else(|| not_found(format!("session `{id}` not found")))?;
    
    let snapshot = SessionEvent::Snapshot { 
        session_id: s.id.clone(), 
        session: s.conversation.clone(), 
        working_dir: s.working_dir.to_string_lossy().into_owned() 
    };
    let mut receiver = s.subscribe();
    drop(sess_guard);

    let stream = stream! {
        if let Ok(event) = crate::types::to_sse_event(&snapshot) { yield Ok::<Event, Infallible>(event); }
        loop {
            match receiver.recv().await {
                Ok(event) => { if let Ok(sse) = crate::types::to_sse_event(&event) { yield Ok::<Event, Infallible>(sse); } }
                Err(broadcast::error::RecvError::Lagged(_)) => continue,
                _ => break,
            }
        }
    };
    Ok(Sse::new(stream).keep_alive(KeepAlive::new().interval(Duration::from_secs(15))))
}

fn extract_run_tag(text: &str) -> Option<String> {
    if let Some(start) = text.find("<run>") {
        if let Some(end) = text.find("</run>") {
            let cmd = text[start+5..end].trim().to_string();
            if cmd.len() < 2 { return None; }
            return Some(cmd);
        }
    }
    None
}

async fn run_command_with_streaming_and_return(cmd_str: &str, working_dir: &PathBuf, _id: &str, broadcaster: &broadcast::Sender<SessionEvent>) -> String {
    use std::sync::{Arc, Mutex};
    let buffer = Arc::new(Mutex::new(String::new()));
    let mut child = match tokio::process::Command::new("cmd").args(["/C", cmd_str]).current_dir(working_dir).stdout(std::process::Stdio::piped()).stderr(std::process::Stdio::piped()).spawn() {
        Ok(c) => c,
        Err(e) => { let m = format!("Failed: {e}"); let _ = broadcaster.send(SessionEvent::Error { content: m.clone() }); return m; }
    };
    let stdout = child.stdout.take().unwrap();
    let stderr = child.stderr.take().unwrap();
    let b1 = broadcaster.clone();
    let b2 = broadcaster.clone();
    let buf1 = buffer.clone();
    let buf2 = buffer.clone();
    let t1 = tokio::spawn(async move {
        use tokio::io::{AsyncBufReadExt, BufReader};
        let mut r = BufReader::new(stdout).lines();
        while let Ok(Some(line)) = r.next_line().await {
            buf1.lock().unwrap().push_str(&line); buf1.lock().unwrap().push('\n');
            let _ = b1.send(SessionEvent::Log { content: line, stream: LogStream::Stdout });
        }
    });
    let t2 = tokio::spawn(async move {
        use tokio::io::{AsyncBufReadExt, BufReader};
        let mut r = BufReader::new(stderr).lines();
        while let Ok(Some(line)) = r.next_line().await {
            buf2.lock().unwrap().push_str(&line); buf2.lock().unwrap().push('\n');
            let _ = b2.send(SessionEvent::Log { content: line, stream: LogStream::Stderr });
        }
    });
    let _ = tokio::join!(t1, t2);
    let code = child.wait().await.map(|s| s.code().unwrap_or(-1)).unwrap_or(-1);
    let _ = broadcaster.send(SessionEvent::Done { exit_code: code });
    let final_out = buffer.lock().unwrap().clone();
    final_out
}

const BLOCKED_PATTERNS: &[&str] = &[
    "rm -rf /", "rm -rf /*", "mkfs", "dd if=", ":(){ :|: & };:", "> /dev/sda", "chmod -R 777 /", "format c:",
];
const HIGH_RISK_PATTERNS: &[&str] = &["sudo", "chmod 777", "chown", "curl | bash", "wget | sh"];
const MEDIUM_RISK_PATTERNS: &[&str] = &["rm ", "mv /", "pip install", "npm install -g", "npm install --global", "pip3 install"];

fn classify_command(command: &str) -> CommandRisk {
    let lower = command.to_lowercase();
    for pattern in BLOCKED_PATTERNS { if lower.contains(pattern) { return CommandRisk::Blocked; } }
    for pattern in HIGH_RISK_PATTERNS { if lower.contains(pattern) { return CommandRisk::High; } }
    for pattern in MEDIUM_RISK_PATTERNS { if lower.contains(pattern) { return CommandRisk::Medium; } }
    CommandRisk::Low
}
