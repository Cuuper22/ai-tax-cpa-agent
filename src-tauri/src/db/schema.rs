//! Database schema creation

use rusqlite::Connection;

pub fn create_tables(conn: &Connection) -> Result<(), String> {
    // Tax returns table
    conn.execute(
        r#"
        CREATE TABLE IF NOT EXISTS tax_returns (
            id TEXT PRIMARY KEY,
            tax_year INTEGER NOT NULL,
            filing_status TEXT NOT NULL,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            ssn_encrypted BLOB,
            spouse_first_name TEXT,
            spouse_last_name TEXT,
            spouse_ssn_encrypted BLOB,
            wages REAL DEFAULT 0,
            interest_income REAL DEFAULT 0,
            dividend_income REAL DEFAULT 0,
            capital_gains REAL DEFAULT 0,
            business_income REAL DEFAULT 0,
            other_income REAL DEFAULT 0,
            gross_income REAL DEFAULT 0,
            adjustments REAL DEFAULT 0,
            itemized_deductions REAL DEFAULT 0,
            use_standard_deduction INTEGER DEFAULT 1,
            federal_tax_withheld REAL DEFAULT 0,
            state_tax_withheld REAL DEFAULT 0,
            estimated_payments REAL DEFAULT 0,
            calculated_tax REAL DEFAULT 0,
            refund_or_owed REAL DEFAULT 0,
            status TEXT DEFAULT 'draft',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        "#,
        [],
    ).map_err(|e| format!("Failed to create tax_returns table: {}", e))?;
    
    // Deductions table
    conn.execute(
        r#"
        CREATE TABLE IF NOT EXISTS deductions (
            id TEXT PRIMARY KEY,
            tax_return_id TEXT NOT NULL,
            category TEXT NOT NULL,
            description TEXT NOT NULL,
            amount REAL NOT NULL,
            date TEXT,
            receipt_id TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (tax_return_id) REFERENCES tax_returns(id) ON DELETE CASCADE
        )
        "#,
        [],
    ).map_err(|e| format!("Failed to create deductions table: {}", e))?;
    
    // Documents table
    conn.execute(
        r#"
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            tax_return_id TEXT,
            doc_type TEXT NOT NULL,
            original_name TEXT NOT NULL,
            file_path TEXT NOT NULL,
            file_size INTEGER DEFAULT 0,
            ocr_text TEXT,
            extracted_data TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (tax_return_id) REFERENCES tax_returns(id) ON DELETE SET NULL
        )
        "#,
        [],
    ).map_err(|e| format!("Failed to create documents table: {}", e))?;
    
    // Chat messages table
    conn.execute(
        r#"
        CREATE TABLE IF NOT EXISTS chat_messages (
            id TEXT PRIMARY KEY,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        "#,
        [],
    ).map_err(|e| format!("Failed to create chat_messages table: {}", e))?;
    
    // Settings table
    conn.execute(
        r#"
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        "#,
        [],
    ).map_err(|e| format!("Failed to create settings table: {}", e))?;
    
    // Create indices for performance
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_tax_returns_year ON tax_returns(tax_year)",
        [],
    ).map_err(|e| format!("Failed to create index: {}", e))?;
    
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_deductions_return ON deductions(tax_return_id)",
        [],
    ).map_err(|e| format!("Failed to create index: {}", e))?;
    
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_documents_return ON documents(tax_return_id)",
        [],
    ).map_err(|e| format!("Failed to create index: {}", e))?;
    
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_chat_created ON chat_messages(created_at)",
        [],
    ).map_err(|e| format!("Failed to create index: {}", e))?;
    
    Ok(())
}
