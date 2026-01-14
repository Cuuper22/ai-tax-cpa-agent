//! Settings commands

use crate::AppState;
use tauri::State;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct AppSettings {
    pub theme: String,
    pub default_tax_year: i32,
    pub default_filing_status: String,
    pub default_state: Option<String>,
    pub auto_save: bool,
    pub show_tooltips: bool,
    pub currency_format: String,
    pub date_format: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            theme: "dark".to_string(),
            default_tax_year: 2024,
            default_filing_status: "single".to_string(),
            default_state: None,
            auto_save: true,
            show_tooltips: true,
            currency_format: "USD".to_string(),
            date_format: "MM/DD/YYYY".to_string(),
        }
    }
}

#[derive(Debug, Serialize)]
pub struct ApiKeyStatus {
    pub configured: bool,
    pub masked_key: Option<String>,
}

/// Get application settings
#[tauri::command]
pub async fn get_settings(
    state: State<'_, AppState>,
) -> Result<AppSettings, String> {
    let db_guard = state.db.read().await;
    let db = db_guard.as_ref().ok_or("Database not initialized")?;
    
    // Try to load settings from database
    let settings_json = db.get_setting("app_settings")
        .map_err(|e| format!("Failed to get settings: {}", e))?;
    
    match settings_json {
        Some(json) => serde_json::from_str(&json)
            .map_err(|e| format!("Failed to parse settings: {}", e)),
        None => Ok(AppSettings::default()),
    }
}

/// Update application settings
#[tauri::command]
pub async fn update_settings(
    state: State<'_, AppState>,
    settings: AppSettings,
) -> Result<bool, String> {
    let db_guard = state.db.read().await;
    let db = db_guard.as_ref().ok_or("Database not initialized")?;
    
    let json = serde_json::to_string(&settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;
    
    db.set_setting("app_settings", &json)
        .map_err(|e| format!("Failed to save settings: {}", e))?;
    
    Ok(true)
}

/// Get API key configuration status (without revealing the key)
#[tauri::command]
pub async fn get_api_key_status(
    state: State<'_, AppState>,
) -> Result<ApiKeyStatus, String> {
    let db_guard = state.db.read().await;
    let db = db_guard.as_ref().ok_or("Database not initialized")?;
    
    let api_key = db.get_setting("anthropic_api_key")
        .map_err(|e| format!("Failed to get API key: {}", e))?;
    
    Ok(match api_key {
        Some(key) if key.len() > 8 => ApiKeyStatus {
            configured: true,
            masked_key: Some(format!("{}...{}", &key[..4], &key[key.len()-4..])),
        },
        Some(_) => ApiKeyStatus {
            configured: true,
            masked_key: Some("****".to_string()),
        },
        None => ApiKeyStatus {
            configured: false,
            masked_key: None,
        },
    })
}

/// Set the Anthropic API key
#[tauri::command]
pub async fn set_api_key(
    state: State<'_, AppState>,
    api_key: String,
) -> Result<bool, String> {
    // Validate API key format
    if !api_key.starts_with("sk-ant-") && !api_key.is_empty() {
        return Err("Invalid API key format. Anthropic keys start with 'sk-ant-'".to_string());
    }
    
    let db_guard = state.db.read().await;
    let db = db_guard.as_ref().ok_or("Database not initialized")?;
    
    if api_key.is_empty() {
        db.delete_setting("anthropic_api_key")
            .map_err(|e| format!("Failed to remove API key: {}", e))?;
    } else {
        db.set_setting("anthropic_api_key", &api_key)
            .map_err(|e| format!("Failed to save API key: {}", e))?;
    }
    
    Ok(true)
}
