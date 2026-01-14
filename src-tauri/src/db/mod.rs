//! Database module for SQLite with encryption

pub mod models;
mod schema;
mod queries;

use rusqlite::{Connection, params};
use std::path::Path;
use std::sync::Mutex;
use chrono::{DateTime, Utc};

pub use models::*;

/// Encrypted SQLite database wrapper
pub struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    /// Create a new encrypted database connection
    pub fn new(path: &Path, encryption_key: &str) -> Result<Self, String> {
        let conn = Connection::open(path)
            .map_err(|e| format!("Failed to open database: {}", e))?;
        
        // Set encryption key using SQLCipher
        conn.execute(&format!("PRAGMA key = '{}'", encryption_key), [])
            .map_err(|e| format!("Failed to set encryption key: {}", e))?;
        
        // Configure SQLCipher settings for security
        conn.execute("PRAGMA cipher_page_size = 4096", [])
            .map_err(|e| format!("Failed to set cipher page size: {}", e))?;
        
        conn.execute("PRAGMA kdf_iter = 256000", [])
            .map_err(|e| format!("Failed to set KDF iterations: {}", e))?;
        
        conn.execute("PRAGMA cipher_memory_security = ON", [])
            .map_err(|e| format!("Failed to enable memory security: {}", e))?;
        
        // Enable foreign keys
        conn.execute("PRAGMA foreign_keys = ON", [])
            .map_err(|e| format!("Failed to enable foreign keys: {}", e))?;
        
        Ok(Self {
            conn: Mutex::new(conn),
        })
    }
    
    /// Initialize database schema
    pub fn init_schema(&self) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        schema::create_tables(&conn)
    }
    
    // === Tax Returns ===
    
    pub fn insert_tax_return(&self, tax_return: &TaxReturn) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        queries::insert_tax_return(&conn, tax_return)
    }
    
    pub fn get_tax_return(&self, id: &str) -> Result<Option<TaxReturn>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        queries::get_tax_return(&conn, id)
    }
    
    pub fn update_tax_return(&self, tax_return: &TaxReturn) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        queries::update_tax_return(&conn, tax_return)
    }
    
    pub fn delete_tax_return(&self, id: &str) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        queries::delete_tax_return(&conn, id)
    }
    
    pub fn list_tax_returns(&self, tax_year: Option<i32>) -> Result<Vec<TaxReturn>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        queries::list_tax_returns(&conn, tax_year)
    }
    
    // === Deductions ===
    
    pub fn insert_deduction(&self, deduction: &Deduction) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        queries::insert_deduction(&conn, deduction)
    }
    
    pub fn get_deduction(&self, id: &str) -> Result<Option<Deduction>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        queries::get_deduction(&conn, id)
    }
    
    pub fn update_deduction(&self, deduction: &Deduction) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        queries::update_deduction(&conn, deduction)
    }
    
    pub fn delete_deduction(&self, id: &str) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        queries::delete_deduction(&conn, id)
    }
    
    pub fn list_deductions(&self, tax_return_id: &str) -> Result<Vec<Deduction>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        queries::list_deductions(&conn, tax_return_id)
    }
    
    // === Documents ===
    
    pub fn insert_document(&self, document: &Document) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        queries::insert_document(&conn, document)
    }
    
    pub fn get_document(&self, id: &str) -> Result<Option<Document>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        queries::get_document(&conn, id)
    }
    
    pub fn delete_document(&self, id: &str) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        queries::delete_document(&conn, id)
    }
    
    pub fn list_documents(&self, tax_return_id: Option<&str>) -> Result<Vec<Document>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        queries::list_documents(&conn, tax_return_id)
    }
    
    pub fn update_document_extraction(&self, id: &str, extracted_data: &str) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        queries::update_document_extraction(&conn, id, extracted_data)
    }
    
    // === Chat Messages ===
    
    pub fn save_chat_message(&self, id: &str, role: &str, content: &str, created_at: DateTime<Utc>) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        queries::save_chat_message(&conn, id, role, content, created_at)
    }
    
    pub fn get_recent_chat_messages(&self, limit: usize) -> Result<Vec<ChatMessage>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        queries::get_recent_chat_messages(&conn, limit)
    }
    
    pub fn clear_chat_history(&self) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        queries::clear_chat_history(&conn)
    }
    
    // === Settings ===
    
    pub fn get_setting(&self, key: &str) -> Result<Option<String>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        queries::get_setting(&conn, key)
    }
    
    pub fn set_setting(&self, key: &str, value: &str) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        queries::set_setting(&conn, key, value)
    }
    
    pub fn delete_setting(&self, key: &str) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        queries::delete_setting(&conn, key)
    }
}
