use mongodb::{Database, bson::doc, options::UpdateOptions};
use serde::{Deserialize, Serialize};
use runtime::{ConversationMessage, Session as RuntimeSession};
use crate::SessionId;

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatSessionDoc {
    #[serde(rename = "_id")]
    pub session_id: String,
    pub messages: Vec<ConversationMessage>,
    pub last_updated: i64,
}

pub async fn upsert_session(db: &Database, session_id: &str, messages: &[ConversationMessage]) -> mongodb::error::Result<()> {
    let collection = db.collection::<ChatSessionDoc>("sessions");
    
    let filter = doc! { "_id": session_id };
    let update = doc! {
        "$set": {
            "messages": bson::to_bson(messages).unwrap(),
            "last_updated": chrono::Utc::now().timestamp(),
        }
    };
    let options = UpdateOptions::builder().upsert(true).build();
    
    collection.update_one(filter, update, options).await?;
    Ok(())
}

pub async fn find_session(db: &Database, session_id: &str) -> mongodb::error::Result<Option<Vec<ConversationMessage>>> {
    let collection = db.collection::<ChatSessionDoc>("sessions");
    let filter = doc! { "_id": session_id };
    
    let doc = collection.find_one(filter, None).await?;
    Ok(doc.map(|d| d.messages))
}

pub async fn list_all_sessions(db: &Database) -> mongodb::error::Result<Vec<String>> {
    let collection = db.collection::<ChatSessionDoc>("sessions");
    let mut cursor = collection.find(None, None).await?;
    let mut session_ids = Vec::new();
    
    while let Some(doc) = futures_util::stream::StreamExt::next(&mut cursor).await {
        if let Ok(d) = doc {
            session_ids.push(d.session_id);
        }
    }
    Ok(session_ids)
}
