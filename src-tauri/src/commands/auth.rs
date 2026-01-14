//! Authentication commands - PIN-based app unlock

use crate::AppState;
use crate::db::Database;
use crate::crypto::KeyManager;
use super::get_db_path;
use tauri::{AppHandle, State, Manager};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthStatus {
    pub unlocked: bool,
    pub has_pin: bool,
}

/// Check if the app is unlocked
#[tauri::command]
pub async fn is_unlocked(state: State<'_, AppState>) -> Result<AuthStatus, String> {
    let unlocked = *state.unlocked.read().await;
    let has_pin = state.key_manager.read().await.has_stored_key();
    
    Ok(AuthStatus { unlocked, has_pin })
}

/// Setup initial PIN (first-time setup)
#[tauri::command]
pub async fn setup_pin(
    app: AppHandle,
    state: State<'_, AppState>,
    pin: String,
) -> Result<bool, String> {
    // Validate PIN
    if pin.len() < 4 {
        return Err("PIN must be at least 4 characters".to_string());
    }
    
    // Generate encryption key from PIN
    let mut key_manager = state.key_manager.write().await;
    key_manager.setup_from_pin(&pin)
        .map_err(|e| format!("Failed to setup PIN: {}", e))?;
    
    // Initialize database with encryption key
    let db_path = get_db_path(&app)?;
    let encryption_key = key_manager.get_db_key()
        .ok_or("No encryption key available")?;
    
    let db = Database::new(&db_path, &encryption_key)
        .map_err(|e| format!("Failed to create database: {}", e))?;
    
    // Initialize schema
    db.init_schema()
        .map_err(|e| format!("Failed to init schema: {}", e))?;
    
    // Store database handle
    *state.db.write().await = Some(db);
    *state.unlocked.write().await = true;
    
    log::info!("PIN setup complete, app unlocked");
    Ok(true)
}

/// Unlock the app with PIN
#[tauri::command]
pub async fn unlock_app(
    app: AppHandle,
    state: State<'_, AppState>,
    pin: String,
) -> Result<bool, String> {
    // Derive key from PIN
    let mut key_manager = state.key_manager.write().await;
    
    if !key_manager.verify_pin(&pin) {
        return Err("Invalid PIN".to_string());
    }
    
    // Open database with derived key
    let db_path = get_db_path(&app)?;
    let encryption_key = key_manager.get_db_key()
        .ok_or("No encryption key available")?;
    
    let db = Database::new(&db_path, &encryption_key)
        .map_err(|e| format!("Failed to open database: {}", e))?;
    
    // Store database handle
    *state.db.write().await = Some(db);
    *state.unlocked.write().await = true;
    
    log::info!("App unlocked successfully");
    Ok(true)
}

/// Lock the app
#[tauri::command]
pub async fn lock_app(state: State<'_, AppState>) -> Result<bool, String> {
    // Clear database handle
    *state.db.write().await = None;
    *state.unlocked.write().await = false;
    
    // Clear sensitive data from key manager
    state.key_manager.write().await.clear();
    
    log::info!("App locked");
    Ok(true)
}

/// Change PIN
#[tauri::command]
pub async fn change_pin(
    state: State<'_, AppState>,
    current_pin: String,
    new_pin: String,
) -> Result<bool, String> {
    // Validate new PIN
    if new_pin.len() < 4 {
        return Err("New PIN must be at least 4 characters".to_string());
    }
    
    let mut key_manager = state.key_manager.write().await;
    
    // Verify current PIN
    if !key_manager.verify_pin(&current_pin) {
        return Err("Current PIN is incorrect".to_string());
    }
    
    // Update to new PIN
    key_manager.change_pin(&current_pin, &new_pin)
        .map_err(|e| format!("Failed to change PIN: {}", e))?;
    
    log::info!("PIN changed successfully");
    Ok(true)
}
