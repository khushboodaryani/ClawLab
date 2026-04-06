use axum::routing::{get, post};
use axum::{Router, Json};
use axum::http::{HeaderValue, Method, header};
use tower_http::cors::CorsLayer;
use mongodb::Database;

pub mod auth;
pub mod types;
pub mod session;
pub mod session_handler;
pub mod chat;
pub mod terminal;
pub mod db;

use crate::session::Session;

pub type SessionId = String;
pub type SessionStore = Arc<RwLock<HashMap<SessionId, Session>>>;

pub const BROADCAST_CAPACITY: usize = 256;

#[derive(Clone)]
pub struct AppState {
    pub sessions: SessionStore,
    pub next_session_id: Arc<AtomicU64>,
    pub db: Database,
}

impl AppState {
    pub async fn new() -> Self {
        let db = db::init_db().await;
        Self {
            sessions: Arc::new(RwLock::new(HashMap::new())),
            next_session_id: Arc::new(AtomicU64::new(1)),
            db,
        }
    }

    pub fn allocate_session_id(&self) -> SessionId {
        let id = self.next_session_id.fetch_add(1, Ordering::Relaxed);
        format!("session-{id}")
    }
}

// Re-exporting for compatibility or internal use
pub use types::{SendMessageRequest, CreateSessionRequest, CreateSessionResponse};

pub fn app(state: AppState) -> Router {
    let cors = CorsLayer::new()
        .allow_origin("http://localhost:3000".parse::<HeaderValue>().unwrap())
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        .allow_headers([header::CONTENT_TYPE, header::AUTHORIZATION, header::COOKIE])
        .allow_credentials(true);

    Router::new()
        .route("/sessions", post(session_handler::create_session).get(session_handler::list_sessions))
        .route("/browse", get(terminal::browse))
        .route("/sessions/:id", get(session_handler::get_session))
        .route("/sessions/:id/events", get(chat::stream_session_events))
        .route("/sessions/:id/message", post(chat::send_message))
        .route("/sessions/:id/approve", post(chat::approve_command))
        .nest("/api", auth::router())
        .with_state(state)
        .layer(cors)
}
