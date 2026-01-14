//! Library exports for AI Tax CPA

pub mod commands;
pub mod db;
pub mod crypto;
pub mod tax_engine;
pub mod ai;

use std::sync::Arc;
use tokio::sync::RwLock;
use db::Database;
use crypto::KeyManager;
use tauri::Manager;

/// Global application state
pub struct AppState {
    pub db: Arc<RwLock<Option<Database>>>,
    pub key_manager: Arc<RwLock<KeyManager>>,
    pub unlocked: Arc<RwLock<bool>>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            db: Arc::new(RwLock::new(None)),
            key_manager: Arc::new(RwLock::new(KeyManager::new())),
            unlocked: Arc::new(RwLock::new(false)),
        }
    }
}

/// Creates and configures the Tauri application builder
pub fn create_app() -> tauri::Builder<tauri::Wry> {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            // Initialize database on startup
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                if let Err(e) = commands::init_app(&app_handle).await {
                    log::error!("Failed to initialize app: {}", e);
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Authentication
            commands::auth::unlock_app,
            commands::auth::lock_app,
            commands::auth::is_unlocked,
            commands::auth::setup_pin,
            commands::auth::change_pin,
            
            // Tax calculations
            commands::tax::calculate_federal_tax,
            commands::tax::calculate_state_tax,
            commands::tax::get_tax_brackets,
            commands::tax::estimate_quarterly_tax,
            
            // Tax returns
            commands::returns::create_tax_return,
            commands::returns::get_tax_return,
            commands::returns::update_tax_return,
            commands::returns::delete_tax_return,
            commands::returns::list_tax_returns,
            commands::returns::export_tax_return,
            
            // Deductions
            commands::deductions::add_deduction,
            commands::deductions::update_deduction,
            commands::deductions::delete_deduction,
            commands::deductions::list_deductions,
            commands::deductions::get_deduction_categories,
            
            // Documents
            commands::documents::upload_document,
            commands::documents::get_document,
            commands::documents::delete_document,
            commands::documents::list_documents,
            commands::documents::extract_document_data,
            
            // AI Chat
            commands::ai::send_message,
            commands::ai::get_chat_history,
            commands::ai::clear_chat_history,
            commands::ai::analyze_audit_notice,
            commands::ai::get_tax_advice,
            
            // Settings
            commands::settings::get_settings,
            commands::settings::update_settings,
            commands::settings::get_api_key_status,
            commands::settings::set_api_key,
        ])
}

/// Entry point for mobile platforms (Android/iOS)
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();
    create_app()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
