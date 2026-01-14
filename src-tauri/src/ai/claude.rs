//! Claude API client for Anthropic's Claude models
//!
//! Provides async API calls to Claude for tax-related AI assistance.

use reqwest::Client;
use serde::{Deserialize, Serialize};
use thiserror::Error;

/// Claude API base URL
const CLAUDE_API_URL: &str = "https://api.anthropic.com/v1/messages";

/// Claude model to use
const CLAUDE_MODEL: &str = "claude-sonnet-4-20250514";

/// API version header
const ANTHROPIC_VERSION: &str = "2023-06-01";

/// Maximum tokens for responses
const MAX_TOKENS: u32 = 4096;

#[derive(Debug, Error)]
pub enum ClaudeError {
    #[error("HTTP request failed: {0}")]
    RequestFailed(#[from] reqwest::Error),
    
    #[error("API error: {0}")]
    ApiError(String),
    
    #[error("Failed to parse response: {0}")]
    ParseError(String),
    
    #[error("Rate limited. Please try again later.")]
    RateLimited,
    
    #[error("Invalid API key")]
    InvalidApiKey,
    
    #[error("Model overloaded. Please try again.")]
    Overloaded,
}

/// Message role in conversation
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum MessageRole {
    User,
    Assistant,
}

/// A chat message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: MessageRole,
    pub content: String,
}

/// Claude API request body
#[derive(Debug, Serialize)]
struct ClaudeRequest {
    model: String,
    max_tokens: u32,
    system: String,
    messages: Vec<ApiMessage>,
}

#[derive(Debug, Serialize)]
struct ApiMessage {
    role: String,
    content: String,
}

/// Claude API response
#[derive(Debug, Deserialize)]
struct ClaudeResponse {
    content: Vec<ContentBlock>,
    #[serde(default)]
    stop_reason: Option<String>,
    #[serde(default)]
    usage: Option<Usage>,
}

#[derive(Debug, Deserialize)]
struct ContentBlock {
    #[serde(rename = "type")]
    content_type: String,
    text: Option<String>,
}

#[derive(Debug, Deserialize)]
struct Usage {
    input_tokens: u32,
    output_tokens: u32,
}

/// Claude API error response
#[derive(Debug, Deserialize)]
struct ErrorResponse {
    error: ApiErrorDetail,
}

#[derive(Debug, Deserialize)]
struct ApiErrorDetail {
    #[serde(rename = "type")]
    error_type: String,
    message: String,
}

/// Claude API client
pub struct ClaudeClient {
    client: Client,
    api_key: String,
}

impl ClaudeClient {
    /// Create a new Claude client with the given API key
    pub fn new(api_key: &str) -> Self {
        Self {
            client: Client::new(),
            api_key: api_key.to_string(),
        }
    }
    
    /// Send a message to Claude and get a response
    pub async fn send_message(
        &self,
        system_prompt: &str,
        messages: &[ChatMessage],
    ) -> Result<String, ClaudeError> {
        let api_messages: Vec<ApiMessage> = messages
            .iter()
            .map(|m| ApiMessage {
                role: match m.role {
                    MessageRole::User => "user".to_string(),
                    MessageRole::Assistant => "assistant".to_string(),
                },
                content: m.content.clone(),
            })
            .collect();
        
        let request_body = ClaudeRequest {
            model: CLAUDE_MODEL.to_string(),
            max_tokens: MAX_TOKENS,
            system: system_prompt.to_string(),
            messages: api_messages,
        };
        
        let response = self.client
            .post(CLAUDE_API_URL)
            .header("x-api-key", &self.api_key)
            .header("anthropic-version", ANTHROPIC_VERSION)
            .header("content-type", "application/json")
            .json(&request_body)
            .send()
            .await?;
        
        let status = response.status();
        
        if status.is_success() {
            let claude_response: ClaudeResponse = response.json().await
                .map_err(|e| ClaudeError::ParseError(e.to_string()))?;
            
            // Extract text from response
            let text = claude_response.content
                .iter()
                .filter_map(|block| {
                    if block.content_type == "text" {
                        block.text.clone()
                    } else {
                        None
                    }
                })
                .collect::<Vec<_>>()
                .join("");
            
            if let Some(usage) = claude_response.usage {
                log::debug!(
                    "Claude API usage: {} input tokens, {} output tokens",
                    usage.input_tokens,
                    usage.output_tokens
                );
            }
            
            Ok(text)
        } else {
            // Parse error response
            let error_text = response.text().await.unwrap_or_default();
            
            match status.as_u16() {
                401 => Err(ClaudeError::InvalidApiKey),
                429 => Err(ClaudeError::RateLimited),
                529 => Err(ClaudeError::Overloaded),
                _ => {
                    // Try to parse structured error
                    if let Ok(error_response) = serde_json::from_str::<ErrorResponse>(&error_text) {
                        Err(ClaudeError::ApiError(format!(
                            "{}: {}",
                            error_response.error.error_type,
                            error_response.error.message
                        )))
                    } else {
                        Err(ClaudeError::ApiError(format!(
                            "HTTP {}: {}",
                            status,
                            error_text
                        )))
                    }
                }
            }
        }
    }
    
    /// Send a simple question to Claude (convenience method)
    pub async fn ask(&self, question: &str) -> Result<String, ClaudeError> {
        let system = "You are a helpful assistant specializing in U.S. tax law and financial advice.";
        let messages = vec![ChatMessage {
            role: MessageRole::User,
            content: question.to_string(),
        }];
        
        self.send_message(system, &messages).await
    }
    
    /// Send a tax-specific question with context
    pub async fn ask_tax_question(
        &self,
        question: &str,
        tax_year: Option<i32>,
        filing_status: Option<&str>,
    ) -> Result<String, ClaudeError> {
        let mut system = String::from(
            "You are an expert CPA assistant specializing in U.S. federal and state tax law. \
             Provide accurate, helpful information about tax deductions, credits, filing requirements, \
             and tax planning strategies. Always cite relevant IRC sections when applicable. \
             Be clear about limitations and recommend professional consultation for complex situations."
        );
        
        if let Some(year) = tax_year {
            system.push_str(&format!("\n\nThe user is asking about tax year {}.", year));
        }
        if let Some(status) = filing_status {
            system.push_str(&format!("\nFiling status: {}", status));
        }
        
        let messages = vec![ChatMessage {
            role: MessageRole::User,
            content: question.to_string(),
        }];
        
        self.send_message(&system, &messages).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_message_serialization() {
        let msg = ChatMessage {
            role: MessageRole::User,
            content: "Hello".to_string(),
        };
        
        let json = serde_json::to_string(&msg).unwrap();
        assert!(json.contains("\"role\":\"user\""));
        assert!(json.contains("\"content\":\"Hello\""));
    }
    
    #[test]
    fn test_api_message_conversion() {
        let chat_msg = ChatMessage {
            role: MessageRole::Assistant,
            content: "Hi there".to_string(),
        };
        
        let api_msg = ApiMessage {
            role: match chat_msg.role {
                MessageRole::User => "user".to_string(),
                MessageRole::Assistant => "assistant".to_string(),
            },
            content: chat_msg.content.clone(),
        };
        
        assert_eq!(api_msg.role, "assistant");
        assert_eq!(api_msg.content, "Hi there");
    }
}
