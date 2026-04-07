use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use std::path::PathBuf;
use crate::{AppState, SessionId};
use crate::session::Session;
use crate::types::{ApiResult, not_found, CreateSessionRequest, CreateSessionResponse};

pub async fn create_session(
    State(state): State<AppState>,
    payload: Option<Json<CreateSessionRequest>>,
) -> (StatusCode, Json<CreateSessionResponse>) {
    let working_dir = payload
        .as_ref()
        .and_then(|Json(p)| p.working_dir.clone())
        .map(PathBuf::from)
        .unwrap_or_else(|| std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")));

    let session_id = state.allocate_session_id();
    let working_dir_str = working_dir.to_string_lossy().into_owned();
    let session = Session::new(session_id.clone(), working_dir);

    state.sessions.write().await.insert(session_id.clone(), session.clone());

    // Persist session metadata to MongoDB
    if let Err(e) = crate::db::chat::upsert_session(&state.db, &session_id, &[]).await {
        eprintln!("Failed to persist new session to MongoDB: {e}");
    }

    (StatusCode::CREATED, Json(CreateSessionResponse { 
        session_id, 
        working_dir: working_dir_str 
    }))
}

pub async fn list_sessions(State(state): State<AppState>) -> Json<serde_json::Value> {
    // Combine in-memory and DB sessions
    let sessions = state.sessions.read().await;
    let mut summaries = sessions.values().map(|s| serde_json::json!({
        "id": s.id,
        "created_at": s.created_at,
        "message_count": s.conversation.messages.len(),
        "working_dir": s.working_dir.to_string_lossy()
    })).collect::<Vec<_>>();

    // Load additional session IDs from DB if they aren't in memory
    if let Ok(db_ids) = crate::db::chat::list_all_sessions(&state.db).await {
        for id in db_ids {
            if !sessions.contains_key(&id) {
                // For simplicity, just add the ID. In a real app, we'd fetch metadata.
                summaries.push(serde_json::json!({
                    "id": id,
                    "created_at": 0, // Placeholder
                    "message_count": 0, // Placeholder
                    "working_dir": "persisted"
                }));
            }
        }
    }

    Json(serde_json::json!({ "sessions": summaries }))
}

pub async fn get_session(State(state): State<AppState>, Path(id): Path<SessionId>) -> ApiResult<Json<serde_json::Value>> {
    let sessions = state.sessions.read().await;
    
    if let Some(s) = sessions.get(&id) {
        return Ok(Json(serde_json::json!({
            "id": s.id,
            "created_at": s.created_at,
            "working_dir": s.working_dir.to_string_lossy(),
            "session": s.conversation
        })));
    }

    // Attempt to load from MongoDB if not in memory
    match crate::db::chat::find_session(&state.db, &id).await {
        Ok(Some(messages)) => {
            // Reconstruct a session object (or just return the messages)
            Ok(Json(serde_json::json!({
                "id": id,
                "created_at": 0,
                "working_dir": "persisted",
                "session": { "messages": messages }
            })))
        }
        _ => Err(not_found(format!("session `{id}` not found"))),
    }
}
