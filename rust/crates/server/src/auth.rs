use axum::{
    extract::{Path, Query, State},
    response::{IntoResponse, Redirect, Response},
    routing::get,
    body::Body,
    Json, Router,
};
use oauth2::{
    basic::BasicClient, reqwest::async_http_client, AuthUrl, AuthorizationCode, ClientId,
    ClientSecret, CsrfToken, RedirectUrl, Scope, TokenResponse, TokenUrl,
};
use serde::{Deserialize, Serialize};
use std::env;
use crate::AppState;
use jsonwebtoken::{encode, EncodingKey, Header};
const FRONTEND_URL: &str = "http://localhost:3000";

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AuthUser {
    pub id: String,
    pub email: String,
    pub name: String,
    pub picture: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: String,
    email: String,
    name: String,
    picture: Option<String>,
    exp: usize,
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/auth/:provider/login", get(login))
        .route("/auth/:provider/callback", get(callback))
        .route("/auth/me", get(get_me))
        .route("/auth/logout", get(logout_handler))
}

async fn login(
    Path(provider): Path<String>,
) -> impl IntoResponse {
    let client = match get_oauth_client(&provider) {
        Ok(c) => c,
        Err(e) => {
            eprintln!("OAuth client error: {e}");
            return Redirect::to(&format!("{}/?error=oauth_config", FRONTEND_URL)).into_response();
        }
    };

    let (auth_url, _csrf_token) = client
        .authorize_url(CsrfToken::new_random)
        .add_scope(Scope::new("email".to_string()))
        .add_scope(Scope::new("profile".to_string()))
        .url();

    Redirect::to(auth_url.as_str()).into_response()
}

#[derive(Debug, Deserialize)]
struct CallbackParams {
    code: String,
    state: String,
}

async fn callback(
    Path(provider): Path<String>,
    Query(params): Query<CallbackParams>,
) -> impl IntoResponse {
    let client = match get_oauth_client(&provider) {
        Ok(c) => c,
        Err(_) => return Redirect::to(&format!("{}/?error=unknown_provider", FRONTEND_URL)).into_response(),
    };

    let token_result = client
        .exchange_code(AuthorizationCode::new(params.code))
        .request_async(async_http_client)
        .await;

    let token = match token_result {
        Ok(t) => t,
        Err(e) => {
            eprintln!("Token exchange error: {e}");
            return Redirect::to(&format!("{}/?error=auth_failed", FRONTEND_URL)).into_response();
        }
    };

    let access_token = token.access_token().secret();
    
    // Fetch profile
    let user_profile = match provider.as_str() {
        "google" => fetch_google_profile(access_token).await,
        "github" => fetch_github_profile(access_token).await,
        _ => Err("Unsupported provider".into()),
    };

    match user_profile {
        Ok(profile) => {
            // Issue JWT
            let jwt_secret = env::var("JWT_SECRET").unwrap_or_else(|_| "bear_claw_9x_lab_secret_random_102938".to_string());
            let exp = (chrono::Utc::now() + chrono::Duration::days(7)).timestamp() as usize; 
            
            let claims = Claims {
                sub: profile.id,
                email: profile.email,
                name: profile.name,
                picture: profile.picture,
                exp,
            };

            let token = match encode(&Header::default(), &claims, &EncodingKey::from_secret(jwt_secret.as_ref())) {
                Ok(t) => t,
                Err(_) => return Redirect::to(&format!("{}/?error=token_err", FRONTEND_URL)).into_response(),
            };

            // Set cookie and redirect
            Response::builder()
                .status(302)
                .header("Location", format!("{}/agent", FRONTEND_URL))
                .header("Set-Cookie", format!("clawlab_session={}; Path=/; HttpOnly; Max-Age=604800; SameSite=Lax", token))
                .body(Body::empty())
                .unwrap()
                .into_response()
        }
        Err(e) => {
            eprintln!("Profile fetch error: {e}");
            Redirect::to(&format!("{}/?error=profile_fetch", FRONTEND_URL)).into_response()
        }
    }
}

async fn get_me(
    headers: axum::http::HeaderMap,
) -> impl IntoResponse {
    let cookie = headers.get("Cookie")
        .and_then(|c| c.to_str().ok())
        .and_then(|c| c.split_ascii_whitespace().find(|s| s.starts_with("clawlab_session=")))
        .or_else(|| headers.get("Cookie").and_then(|c| c.to_str().ok()).and_then(|c| c.split(';').find(|s| s.trim().starts_with("clawlab_session="))))
        .map(|s| s.trim().trim_start_matches("clawlab_session="));

    if let Some(token) = cookie {
        let jwt_secret = env::var("JWT_SECRET").unwrap_or_else(|_| "bear_claw_9x_lab_secret_random_102938".to_string());
        let decoding_key = jsonwebtoken::DecodingKey::from_secret(jwt_secret.as_ref());
        let validation = jsonwebtoken::Validation::default();
        
        if let Ok(data) = jsonwebtoken::decode::<Claims>(token, &decoding_key, &validation) {
            return Json(Some(AuthUser {
                id: data.claims.sub,
                email: data.claims.email,
                name: data.claims.name,
                picture: data.claims.picture,
            })).into_response();
        }
    }

    Json(None::<AuthUser>).into_response()
}

async fn logout_handler() -> impl IntoResponse {
    Response::builder()
        .status(302)
        .header("Location", FRONTEND_URL)
        .header("Set-Cookie", "clawlab_session=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax")
        .body(Body::empty())
        .unwrap()
        .into_response()
}

fn get_oauth_client(provider: &str) -> Result<BasicClient, Box<dyn std::error::Error>> {
    let (client_id, client_secret, auth_url, token_url) = match provider {
        "google" => (
            env::var("GOOGLE_CLIENT_ID")?,
            env::var("GOOGLE_CLIENT_SECRET")?,
            "https://accounts.google.com/o/oauth2/v2/auth",
            "https://oauth2.googleapis.com/token", // Corrected token URL
        ),
        "github" => (
            env::var("GITHUB_CLIENT_ID")?,
            env::var("GITHUB_CLIENT_SECRET")?,
            "https://github.com/login/oauth/authorize",
            "https://github.com/login/oauth/access_token",
        ),
        _ => return Err("Unsupported provider".into()),
    };

    Ok(BasicClient::new(
        ClientId::new(client_id),
        Some(ClientSecret::new(client_secret)),
        AuthUrl::new(auth_url.to_string())?,
        Some(TokenUrl::new(token_url.to_string())?),
    )
    .set_redirect_uri(RedirectUrl::new(format!(
        "http://localhost:8082/api/auth/{}/callback",
        provider
    ))?))
}

async fn fetch_google_profile(token: &str) -> Result<AuthUser, Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();
    let res = client
        .get("https://www.googleapis.com/oauth2/v3/userinfo")
        .bearer_auth(token)
        .send()
        .await?
        .json::<serde_json::Value>()
        .await?;

    Ok(AuthUser {
        id: res["sub"].as_str().unwrap_or_default().to_string(),
        email: res["email"].as_str().unwrap_or_default().to_string(),
        name: res["name"].as_str().unwrap_or_else(|| res["email"].as_str().unwrap_or("User")).to_string(),
        picture: res["picture"].as_str().map(String::from),
    })
}

async fn fetch_github_profile(token: &str) -> Result<AuthUser, Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();
    let res = client
        .get("https://api.github.com/user")
        .header("User-Agent", "clawlab-auth")
        .bearer_auth(token)
        .send()
        .await?
        .json::<serde_json::Value>()
        .await?;

    // GitHub's email might be private, so handle that if needed or use primary email
    let email = if let Some(e) = res["email"].as_str() {
        e.to_string()
    } else {
        format!("{}@github.com", res["login"].as_str().unwrap_or("user"))
    };

    Ok(AuthUser {
        id: res["id"].to_string(),
        email,
        name: res["name"].as_str().unwrap_or_else(|| res["login"].as_str().unwrap_or("User")).to_string(),
        picture: res["avatar_url"].as_str().map(String::from),
    })
}
