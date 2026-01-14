//! AI chat commands using Anthropic Claude API

use crate::AppState;
use crate::ai::claude::{ClaudeClient, ChatMessage, MessageRole};
use tauri::State;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::Utc;

#[derive(Debug, Deserialize)]
pub struct SendMessageRequest {
    pub message: String,
    pub context: Option<ChatContext>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct ChatContext {
    pub tax_year: Option<i32>,
    pub filing_status: Option<String>,
    pub gross_income: Option<f64>,
    pub topic: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ChatResponse {
    pub id: String,
    pub role: String,
    pub content: String,
    pub timestamp: String,
}

#[derive(Debug, Deserialize)]
pub struct AuditAnalysisRequest {
    pub notice_text: String,
    pub tax_year: i32,
    pub issue_type: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct AuditAnalysisResponse {
    pub summary: String,
    pub risk_level: String,
    pub recommended_actions: Vec<String>,
    pub legal_citations: Vec<String>,
    pub response_deadline: Option<String>,
    pub defense_strategy: String,
}

#[derive(Debug, Serialize)]
pub struct TaxAdviceResponse {
    pub advice: String,
    pub relevant_forms: Vec<String>,
    pub potential_savings: Option<f64>,
    pub warnings: Vec<String>,
}

/// Send a message to the AI assistant
#[tauri::command]
pub async fn send_message(
    state: State<'_, AppState>,
    request: SendMessageRequest,
) -> Result<ChatResponse, String> {
    let db_guard = state.db.read().await;
    let db = db_guard.as_ref().ok_or("Database not initialized")?;
    
    // Get API key from settings
    let api_key = db.get_setting("anthropic_api_key")
        .map_err(|e| format!("Failed to get API key: {}", e))?
        .ok_or("API key not configured. Please add your Anthropic API key in Settings.")?;
    
    // Build context for the AI
    let system_prompt = build_tax_system_prompt(&request.context);
    
    // Get recent chat history
    let history = db.get_recent_chat_messages(10)
        .map_err(|e| format!("Failed to get chat history: {}", e))?;
    
    // Create Claude client and send message
    let client = ClaudeClient::new(&api_key);
    
    let mut messages: Vec<ChatMessage> = history.into_iter().map(|m| ChatMessage {
        role: if m.role == "user" { MessageRole::User } else { MessageRole::Assistant },
        content: m.content,
    }).collect();
    
    messages.push(ChatMessage {
        role: MessageRole::User,
        content: request.message.clone(),
    });
    
    let response = client.send_message(&system_prompt, &messages).await
        .map_err(|e| format!("AI request failed: {}", e))?;
    
    // Save messages to database
    let user_msg_id = Uuid::new_v4().to_string();
    let ai_msg_id = Uuid::new_v4().to_string();
    let now = Utc::now();
    
    db.save_chat_message(&user_msg_id, "user", &request.message, now)
        .map_err(|e| format!("Failed to save message: {}", e))?;
    
    db.save_chat_message(&ai_msg_id, "assistant", &response, now)
        .map_err(|e| format!("Failed to save message: {}", e))?;
    
    Ok(ChatResponse {
        id: ai_msg_id,
        role: "assistant".to_string(),
        content: response,
        timestamp: now.to_rfc3339(),
    })
}

/// Get chat history
#[tauri::command]
pub async fn get_chat_history(
    state: State<'_, AppState>,
    limit: Option<i32>,
) -> Result<Vec<ChatResponse>, String> {
    let db_guard = state.db.read().await;
    let db = db_guard.as_ref().ok_or("Database not initialized")?;
    
    let messages = db.get_recent_chat_messages(limit.unwrap_or(50) as usize)
        .map_err(|e| format!("Failed to get chat history: {}", e))?;
    
    Ok(messages.into_iter().map(|m| ChatResponse {
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.created_at.to_rfc3339(),
    }).collect())
}

/// Clear chat history
#[tauri::command]
pub async fn clear_chat_history(
    state: State<'_, AppState>,
) -> Result<bool, String> {
    let db_guard = state.db.read().await;
    let db = db_guard.as_ref().ok_or("Database not initialized")?;
    
    db.clear_chat_history()
        .map_err(|e| format!("Failed to clear chat history: {}", e))?;
    
    Ok(true)
}

/// Analyze an audit notice
#[tauri::command]
pub async fn analyze_audit_notice(
    state: State<'_, AppState>,
    request: AuditAnalysisRequest,
) -> Result<AuditAnalysisResponse, String> {
    let db_guard = state.db.read().await;
    let db = db_guard.as_ref().ok_or("Database not initialized")?;
    
    let api_key = db.get_setting("anthropic_api_key")
        .map_err(|e| format!("Failed to get API key: {}", e))?
        .ok_or("API key not configured")?;
    
    let client = ClaudeClient::new(&api_key);
    
    let prompt = format!(
        r#"You are an expert CPA and tax attorney specializing in IRS audit defense.

Analyze this IRS audit notice and provide a comprehensive defense strategy:

TAX YEAR: {}
NOTICE TEXT:
{}

Provide your analysis in the following JSON format:
{{
    "summary": "Brief summary of what the IRS is questioning",
    "risk_level": "low|medium|high|critical",
    "recommended_actions": ["action1", "action2", ...],
    "legal_citations": ["IRC Section X", "Treasury Reg Y", ...],
    "response_deadline": "YYYY-MM-DD or null if not specified",
    "defense_strategy": "Detailed defense strategy"
}}

Be specific about IRC sections, Treasury Regulations, and relevant Tax Court cases."#,
        request.tax_year,
        request.notice_text
    );
    
    let messages = vec![ChatMessage {
        role: MessageRole::User,
        content: prompt,
    }];
    
    let response = client.send_message(
        "You are an expert tax attorney. Respond only with valid JSON.",
        &messages
    ).await.map_err(|e| format!("AI request failed: {}", e))?;
    
    // Parse JSON response
    let analysis: serde_json::Value = serde_json::from_str(&response)
        .map_err(|_| "Failed to parse AI response")?;
    
    Ok(AuditAnalysisResponse {
        summary: analysis["summary"].as_str().unwrap_or("").to_string(),
        risk_level: analysis["risk_level"].as_str().unwrap_or("medium").to_string(),
        recommended_actions: analysis["recommended_actions"]
            .as_array()
            .map(|a| a.iter().filter_map(|v| v.as_str().map(String::from)).collect())
            .unwrap_or_default(),
        legal_citations: analysis["legal_citations"]
            .as_array()
            .map(|a| a.iter().filter_map(|v| v.as_str().map(String::from)).collect())
            .unwrap_or_default(),
        response_deadline: analysis["response_deadline"].as_str().map(String::from),
        defense_strategy: analysis["defense_strategy"].as_str().unwrap_or("").to_string(),
    })
}

/// Get general tax advice
#[tauri::command]
pub async fn get_tax_advice(
    state: State<'_, AppState>,
    question: String,
    context: Option<ChatContext>,
) -> Result<TaxAdviceResponse, String> {
    let db_guard = state.db.read().await;
    let db = db_guard.as_ref().ok_or("Database not initialized")?;
    
    let api_key = db.get_setting("anthropic_api_key")
        .map_err(|e| format!("Failed to get API key: {}", e))?
        .ok_or("API key not configured")?;
    
    let client = ClaudeClient::new(&api_key);
    
    let context_str = context.map(|c| format!(
        "Tax Year: {}, Filing Status: {}, Gross Income: ${:.2}",
        c.tax_year.unwrap_or(2024),
        c.filing_status.unwrap_or_default(),
        c.gross_income.unwrap_or(0.0)
    )).unwrap_or_default();
    
    let prompt = format!(
        r#"You are an expert CPA providing tax advice.

Context: {}

Question: {}

Provide your response in JSON format:
{{
    "advice": "Your detailed tax advice",
    "relevant_forms": ["Form 1040", "Schedule A", ...],
    "potential_savings": 1234.56 or null,
    "warnings": ["Any important warnings or disclaimers"]
}}

Be specific and cite relevant tax law where applicable."#,
        context_str,
        question
    );
    
    let messages = vec![ChatMessage {
        role: MessageRole::User,
        content: prompt,
    }];
    
    let response = client.send_message(
        "You are an expert CPA. Respond only with valid JSON.",
        &messages
    ).await.map_err(|e| format!("AI request failed: {}", e))?;
    
    let advice: serde_json::Value = serde_json::from_str(&response)
        .map_err(|_| "Failed to parse AI response")?;
    
    Ok(TaxAdviceResponse {
        advice: advice["advice"].as_str().unwrap_or("").to_string(),
        relevant_forms: advice["relevant_forms"]
            .as_array()
            .map(|a| a.iter().filter_map(|v| v.as_str().map(String::from)).collect())
            .unwrap_or_default(),
        potential_savings: advice["potential_savings"].as_f64(),
        warnings: advice["warnings"]
            .as_array()
            .map(|a| a.iter().filter_map(|v| v.as_str().map(String::from)).collect())
            .unwrap_or_default(),
    })
}

fn build_tax_system_prompt(context: &Option<ChatContext>) -> String {
    let mut prompt = String::from(
        r#"You are an expert AI CPA assistant specializing in U.S. tax law and tax preparation.

Your capabilities include:
- Answering questions about tax deductions, credits, and filing requirements
- Explaining tax forms and schedules
- Providing guidance on tax planning strategies
- Helping with IRS correspondence and audit defense
- Calculating estimated taxes

Important guidelines:
- Always cite relevant IRC sections when discussing tax law
- Recommend professional consultation for complex situations
- Be clear about limitations and when human CPA review is needed
- Use the current tax year (2024) unless otherwise specified
- Provide accurate, up-to-date tax information

"#
    );
    
    if let Some(ctx) = context {
        prompt.push_str("\nUser's current context:\n");
        if let Some(year) = ctx.tax_year {
            prompt.push_str(&format!("- Tax Year: {}\n", year));
        }
        if let Some(ref status) = ctx.filing_status {
            prompt.push_str(&format!("- Filing Status: {}\n", status));
        }
        if let Some(income) = ctx.gross_income {
            prompt.push_str(&format!("- Gross Income: ${:.2}\n", income));
        }
        if let Some(ref topic) = ctx.topic {
            prompt.push_str(&format!("- Topic: {}\n", topic));
        }
    }
    
    prompt
}
