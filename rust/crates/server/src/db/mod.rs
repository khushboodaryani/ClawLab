use mongodb::{Client, Database};
use std::env;

pub mod chat;

pub async fn init_db() -> Database {
    let uri = env::var("MONGODB_URI").unwrap_or_else(|_| "mongodb://localhost:27017".to_string());
    let db_name = env::var("MONGODB_DB").unwrap_or_else(|_| "clawlab".to_string());
    
    let client = Client::with_uri_str(&uri).await.expect("Failed to connect to MongoDB");
    client.database(&db_name)
}
