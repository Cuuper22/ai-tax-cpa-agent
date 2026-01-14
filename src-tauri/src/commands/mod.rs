//! Command handlers for Tauri IPC

pub mod auth;
pub mod tax;
pub mod returns;
pub mod deductions;
pub mod documents;
pub mod ai;
pub mod settings;

use crate::AppState;
use crate::db::Database;
use tauri::{AppHandle, Manager};
use std::sync::Arc;
use tokio::sync::RwLock;

/// Initialize the application
pub async fn init_app(app: &AppHandle) -> Result<(), String> {
    // Get app data directory
    let app_dir = app.path().app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    
    // Create directory if it doesn't exist
    std::fs::create_dir_all(&app_dir)
        .map_err(|e| format!("Failed to create app dir: {}", e))?;
    
    // Initialize state
    let state = AppState::default();
    app.manage(state);
    
    log::info!("App initialized at {:?}", app_dir);
    Ok(())
}

/// Get database path
pub fn get_db_path(app: &AppHandle) -> Result<std::path::PathBuf, String> {
    let app_dir = app.path().app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    Ok(app_dir.join("tax_data.db"))
}
