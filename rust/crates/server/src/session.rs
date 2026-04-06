use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::{broadcast, RwLock, oneshot};
use runtime::Session as RuntimeSession;
use crate::{SessionId, BROADCAST_CAPACITY};
use crate::types::{SessionEvent, unix_timestamp_millis};

#[derive(Clone)]
pub struct Session {
    pub id: SessionId,
    pub created_at: u64,
    pub working_dir: PathBuf,
    pub conversation: RuntimeSession,
    pub events: broadcast::Sender<SessionEvent>,
    pub pending_approval: Arc<RwLock<Option<(String, oneshot::Sender<bool>)>>>,
}

impl Session {
    pub fn new(id: SessionId, working_dir: PathBuf) -> Self {
        let (events, _) = broadcast::channel(BROADCAST_CAPACITY);
        Self {
            id,
            created_at: unix_timestamp_millis(),
            working_dir,
            conversation: RuntimeSession::new(),
            events,
            pending_approval: Arc::new(RwLock::new(None)),
        }
    }

    pub fn subscribe(&self) -> broadcast::Receiver<SessionEvent> {
        self.events.subscribe()
    }
}
