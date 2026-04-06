use std::net::SocketAddr;
use tokio::net::TcpListener;

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();
    let state = server::AppState::new().await;
    let app = server::app(state);

    // Using Port 8082 to avoid 'address already in use' from previous crashes
    let addr = SocketAddr::from(([0, 0, 0, 0], 8082));
    println!("🚀 Claw Server running on port 8082 (http://localhost:8082)");

    let listener = TcpListener::bind(addr)
        .await
        .expect("Failed to bind address");

    axum::serve(listener, app)
        .await
        .expect("Server failed to start");
}
