//! Database query implementations

use rusqlite::{Connection, params, Row};
use chrono::{DateTime, Utc};
use super::models::*;

// === Tax Returns ===

pub fn insert_tax_return(conn: &Connection, tr: &TaxReturn) -> Result<(), String> {
    conn.execute(
        r#"
        INSERT INTO tax_returns (
            id, tax_year, filing_status, first_name, last_name, ssn_encrypted,
            spouse_first_name, spouse_last_name, spouse_ssn_encrypted,
            wages, interest_income, dividend_income, capital_gains, business_income, other_income,
            gross_income, adjustments, itemized_deductions, use_standard_deduction,
            federal_tax_withheld, state_tax_withheld, estimated_payments,
            calculated_tax, refund_or_owed, status, created_at, updated_at
        ) VALUES (
            ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15,
            ?16, ?17, ?18, ?19, ?20, ?21, ?22, ?23, ?24, ?25, ?26, ?27
        )
        "#,
        params![
            tr.id, tr.tax_year, tr.filing_status, tr.first_name, tr.last_name, tr.ssn_encrypted,
            tr.spouse_first_name, tr.spouse_last_name, tr.spouse_ssn_encrypted,
            tr.wages, tr.interest_income, tr.dividend_income, tr.capital_gains, tr.business_income, tr.other_income,
            tr.gross_income, tr.adjustments, tr.itemized_deductions, tr.use_standard_deduction as i32,
            tr.federal_tax_withheld, tr.state_tax_withheld, tr.estimated_payments,
            tr.calculated_tax, tr.refund_or_owed, tr.status.as_str(),
            tr.created_at.to_rfc3339(), tr.updated_at.to_rfc3339()
        ],
    ).map_err(|e| format!("Failed to insert tax return: {}", e))?;
    Ok(())
}

pub fn get_tax_return(conn: &Connection, id: &str) -> Result<Option<TaxReturn>, String> {
    let mut stmt = conn.prepare(
        "SELECT * FROM tax_returns WHERE id = ?1"
    ).map_err(|e| format!("Failed to prepare statement: {}", e))?;
    
    let mut rows = stmt.query(params![id])
        .map_err(|e| format!("Failed to execute query: {}", e))?;
    
    match rows.next().map_err(|e| format!("Failed to fetch row: {}", e))? {
        Some(row) => Ok(Some(row_to_tax_return(row)?)),
        None => Ok(None),
    }
}

pub fn update_tax_return(conn: &Connection, tr: &TaxReturn) -> Result<(), String> {
    conn.execute(
        r#"
        UPDATE tax_returns SET
            tax_year = ?2, filing_status = ?3, first_name = ?4, last_name = ?5,
            wages = ?6, interest_income = ?7, dividend_income = ?8, capital_gains = ?9,
            business_income = ?10, other_income = ?11, gross_income = ?12,
            adjustments = ?13, itemized_deductions = ?14, use_standard_deduction = ?15,
            federal_tax_withheld = ?16, state_tax_withheld = ?17, estimated_payments = ?18,
            calculated_tax = ?19, refund_or_owed = ?20, status = ?21, updated_at = ?22
        WHERE id = ?1
        "#,
        params![
            tr.id, tr.tax_year, tr.filing_status, tr.first_name, tr.last_name,
            tr.wages, tr.interest_income, tr.dividend_income, tr.capital_gains,
            tr.business_income, tr.other_income, tr.gross_income,
            tr.adjustments, tr.itemized_deductions, tr.use_standard_deduction as i32,
            tr.federal_tax_withheld, tr.state_tax_withheld, tr.estimated_payments,
            tr.calculated_tax, tr.refund_or_owed, tr.status.as_str(), tr.updated_at.to_rfc3339()
        ],
    ).map_err(|e| format!("Failed to update tax return: {}", e))?;
    Ok(())
}

pub fn delete_tax_return(conn: &Connection, id: &str) -> Result<(), String> {
    conn.execute("DELETE FROM tax_returns WHERE id = ?1", params![id])
        .map_err(|e| format!("Failed to delete tax return: {}", e))?;
    Ok(())
}

pub fn list_tax_returns(conn: &Connection, tax_year: Option<i32>) -> Result<Vec<TaxReturn>, String> {
    let mut results = Vec::new();
    
    match tax_year {
        Some(year) => {
            let mut stmt = conn.prepare("SELECT * FROM tax_returns WHERE tax_year = ?1 ORDER BY updated_at DESC")
                .map_err(|e| format!("Failed to prepare statement: {}", e))?;
            let mut rows = stmt.query(params![year])
                .map_err(|e| format!("Failed to execute query: {}", e))?;
            while let Some(row) = rows.next().map_err(|e| format!("Failed to fetch row: {}", e))? {
                results.push(row_to_tax_return(row)?);
            }
        }
        None => {
            let mut stmt = conn.prepare("SELECT * FROM tax_returns ORDER BY updated_at DESC")
                .map_err(|e| format!("Failed to prepare statement: {}", e))?;
            let mut rows = stmt.query([])
                .map_err(|e| format!("Failed to execute query: {}", e))?;
            while let Some(row) = rows.next().map_err(|e| format!("Failed to fetch row: {}", e))? {
                results.push(row_to_tax_return(row)?);
            }
        }
    }
    
    Ok(results)
}

fn row_to_tax_return(row: &Row) -> Result<TaxReturn, String> {
    Ok(TaxReturn {
        id: row.get(0).map_err(|e| e.to_string())?,
        tax_year: row.get(1).map_err(|e| e.to_string())?,
        filing_status: row.get(2).map_err(|e| e.to_string())?,
        first_name: row.get(3).map_err(|e| e.to_string())?,
        last_name: row.get(4).map_err(|e| e.to_string())?,
        ssn_encrypted: row.get(5).ok(),
        spouse_first_name: row.get(6).ok(),
        spouse_last_name: row.get(7).ok(),
        spouse_ssn_encrypted: row.get(8).ok(),
        wages: row.get(9).map_err(|e| e.to_string())?,
        interest_income: row.get(10).map_err(|e| e.to_string())?,
        dividend_income: row.get(11).map_err(|e| e.to_string())?,
        capital_gains: row.get(12).map_err(|e| e.to_string())?,
        business_income: row.get(13).map_err(|e| e.to_string())?,
        other_income: row.get(14).map_err(|e| e.to_string())?,
        gross_income: row.get(15).map_err(|e| e.to_string())?,
        adjustments: row.get(16).map_err(|e| e.to_string())?,
        itemized_deductions: row.get(17).map_err(|e| e.to_string())?,
        use_standard_deduction: row.get::<_, i32>(18).map_err(|e| e.to_string())? != 0,
        federal_tax_withheld: row.get(19).map_err(|e| e.to_string())?,
        state_tax_withheld: row.get(20).map_err(|e| e.to_string())?,
        estimated_payments: row.get(21).map_err(|e| e.to_string())?,
        calculated_tax: row.get(22).map_err(|e| e.to_string())?,
        refund_or_owed: row.get(23).map_err(|e| e.to_string())?,
        status: TaxReturnStatus::from_str(&row.get::<_, String>(24).map_err(|e| e.to_string())?)?,
        created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(25).map_err(|e| e.to_string())?)
            .map_err(|e| e.to_string())?.with_timezone(&Utc),
        updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(26).map_err(|e| e.to_string())?)
            .map_err(|e| e.to_string())?.with_timezone(&Utc),
    })
}

// === Deductions ===

pub fn insert_deduction(conn: &Connection, d: &Deduction) -> Result<(), String> {
    conn.execute(
        r#"
        INSERT INTO deductions (id, tax_return_id, category, description, amount, date, receipt_id, created_at)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
        "#,
        params![d.id, d.tax_return_id, d.category.as_str(), d.description, d.amount, d.date, d.receipt_id, d.created_at.to_rfc3339()],
    ).map_err(|e| format!("Failed to insert deduction: {}", e))?;
    Ok(())
}

pub fn get_deduction(conn: &Connection, id: &str) -> Result<Option<Deduction>, String> {
    let mut stmt = conn.prepare("SELECT * FROM deductions WHERE id = ?1")
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;
    
    let mut rows = stmt.query(params![id])
        .map_err(|e| format!("Failed to execute query: {}", e))?;
    
    match rows.next().map_err(|e| format!("Failed to fetch row: {}", e))? {
        Some(row) => Ok(Some(row_to_deduction(row)?)),
        None => Ok(None),
    }
}

pub fn update_deduction(conn: &Connection, d: &Deduction) -> Result<(), String> {
    conn.execute(
        r#"
        UPDATE deductions SET category = ?2, description = ?3, amount = ?4, date = ?5
        WHERE id = ?1
        "#,
        params![d.id, d.category.as_str(), d.description, d.amount, d.date],
    ).map_err(|e| format!("Failed to update deduction: {}", e))?;
    Ok(())
}

pub fn delete_deduction(conn: &Connection, id: &str) -> Result<(), String> {
    conn.execute("DELETE FROM deductions WHERE id = ?1", params![id])
        .map_err(|e| format!("Failed to delete deduction: {}", e))?;
    Ok(())
}

pub fn list_deductions(conn: &Connection, tax_return_id: &str) -> Result<Vec<Deduction>, String> {
    let mut stmt = conn.prepare("SELECT * FROM deductions WHERE tax_return_id = ?1 ORDER BY created_at DESC")
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;
    
    let rows = stmt.query_map(params![tax_return_id], |row| Ok(row_to_deduction(row)))
        .map_err(|e| format!("Failed to execute query: {}", e))?;
    
    rows.filter_map(|r| r.ok())
        .map(|r| r)
        .collect::<Result<Vec<_>, _>>()
}

fn row_to_deduction(row: &Row) -> Result<Deduction, String> {
    Ok(Deduction {
        id: row.get(0).map_err(|e| e.to_string())?,
        tax_return_id: row.get(1).map_err(|e| e.to_string())?,
        category: DeductionCategory::from_str(&row.get::<_, String>(2).map_err(|e| e.to_string())?)?,
        description: row.get(3).map_err(|e| e.to_string())?,
        amount: row.get(4).map_err(|e| e.to_string())?,
        date: row.get(5).ok(),
        receipt_id: row.get(6).ok(),
        created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(7).map_err(|e| e.to_string())?)
            .map_err(|e| e.to_string())?.with_timezone(&Utc),
    })
}

// === Documents ===

pub fn insert_document(conn: &Connection, d: &Document) -> Result<(), String> {
    conn.execute(
        r#"
        INSERT INTO documents (id, tax_return_id, doc_type, original_name, file_path, file_size, ocr_text, extracted_data, created_at)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
        "#,
        params![d.id, d.tax_return_id, d.doc_type.as_str(), d.original_name, d.file_path, d.file_size as i64, d.ocr_text, d.extracted_data, d.created_at.to_rfc3339()],
    ).map_err(|e| format!("Failed to insert document: {}", e))?;
    Ok(())
}

pub fn get_document(conn: &Connection, id: &str) -> Result<Option<Document>, String> {
    let mut stmt = conn.prepare("SELECT * FROM documents WHERE id = ?1")
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;
    
    let mut rows = stmt.query(params![id])
        .map_err(|e| format!("Failed to execute query: {}", e))?;
    
    match rows.next().map_err(|e| format!("Failed to fetch row: {}", e))? {
        Some(row) => Ok(Some(row_to_document(row)?)),
        None => Ok(None),
    }
}

pub fn delete_document(conn: &Connection, id: &str) -> Result<(), String> {
    conn.execute("DELETE FROM documents WHERE id = ?1", params![id])
        .map_err(|e| format!("Failed to delete document: {}", e))?;
    Ok(())
}

pub fn list_documents(conn: &Connection, tax_return_id: Option<&str>) -> Result<Vec<Document>, String> {
    let mut results = Vec::new();
    
    match tax_return_id {
        Some(id) => {
            let mut stmt = conn.prepare("SELECT * FROM documents WHERE tax_return_id = ?1 ORDER BY created_at DESC")
                .map_err(|e| format!("Failed to prepare statement: {}", e))?;
            let mut rows = stmt.query(params![id])
                .map_err(|e| format!("Failed to execute query: {}", e))?;
            while let Some(row) = rows.next().map_err(|e| format!("Failed to fetch row: {}", e))? {
                results.push(row_to_document(row)?);
            }
        }
        None => {
            let mut stmt = conn.prepare("SELECT * FROM documents ORDER BY created_at DESC")
                .map_err(|e| format!("Failed to prepare statement: {}", e))?;
            let mut rows = stmt.query([])
                .map_err(|e| format!("Failed to execute query: {}", e))?;
            while let Some(row) = rows.next().map_err(|e| format!("Failed to fetch row: {}", e))? {
                results.push(row_to_document(row)?);
            }
        }
    }
    
    Ok(results)
}

pub fn update_document_extraction(conn: &Connection, id: &str, extracted_data: &str) -> Result<(), String> {
    conn.execute(
        "UPDATE documents SET extracted_data = ?2 WHERE id = ?1",
        params![id, extracted_data],
    ).map_err(|e| format!("Failed to update document: {}", e))?;
    Ok(())
}

fn row_to_document(row: &Row) -> Result<Document, String> {
    Ok(Document {
        id: row.get(0).map_err(|e| e.to_string())?,
        tax_return_id: row.get(1).ok(),
        doc_type: DocumentType::from_str(&row.get::<_, String>(2).map_err(|e| e.to_string())?)?,
        original_name: row.get(3).map_err(|e| e.to_string())?,
        file_path: row.get(4).map_err(|e| e.to_string())?,
        file_size: row.get::<_, i64>(5).map_err(|e| e.to_string())? as u64,
        ocr_text: row.get(6).ok(),
        extracted_data: row.get(7).ok(),
        created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(8).map_err(|e| e.to_string())?)
            .map_err(|e| e.to_string())?.with_timezone(&Utc),
    })
}

// === Chat Messages ===

pub fn save_chat_message(conn: &Connection, id: &str, role: &str, content: &str, created_at: DateTime<Utc>) -> Result<(), String> {
    conn.execute(
        "INSERT INTO chat_messages (id, role, content, created_at) VALUES (?1, ?2, ?3, ?4)",
        params![id, role, content, created_at.to_rfc3339()],
    ).map_err(|e| format!("Failed to save chat message: {}", e))?;
    Ok(())
}

pub fn get_recent_chat_messages(conn: &Connection, limit: usize) -> Result<Vec<ChatMessage>, String> {
    let mut stmt = conn.prepare(
        "SELECT * FROM chat_messages ORDER BY created_at DESC LIMIT ?1"
    ).map_err(|e| format!("Failed to prepare statement: {}", e))?;
    
    let rows = stmt.query_map(params![limit as i64], |row| {
        Ok(ChatMessage {
            id: row.get(0)?,
            role: row.get(1)?,
            content: row.get(2)?,
            created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(3)?)
                .map(|dt| dt.with_timezone(&Utc))
                .unwrap_or_else(|_| Utc::now()),
        })
    }).map_err(|e| format!("Failed to execute query: {}", e))?;
    
    let mut messages: Vec<ChatMessage> = rows.filter_map(|r| r.ok()).collect();
    messages.reverse(); // Return in chronological order
    Ok(messages)
}

pub fn clear_chat_history(conn: &Connection) -> Result<(), String> {
    conn.execute("DELETE FROM chat_messages", [])
        .map_err(|e| format!("Failed to clear chat history: {}", e))?;
    Ok(())
}

// === Settings ===

pub fn get_setting(conn: &Connection, key: &str) -> Result<Option<String>, String> {
    let mut stmt = conn.prepare("SELECT value FROM settings WHERE key = ?1")
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;
    
    let mut rows = stmt.query(params![key])
        .map_err(|e| format!("Failed to execute query: {}", e))?;
    
    match rows.next().map_err(|e| format!("Failed to fetch row: {}", e))? {
        Some(row) => Ok(Some(row.get(0).map_err(|e| e.to_string())?)),
        None => Ok(None),
    }
}

pub fn set_setting(conn: &Connection, key: &str, value: &str) -> Result<(), String> {
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?1, ?2, ?3)",
        params![key, value, Utc::now().to_rfc3339()],
    ).map_err(|e| format!("Failed to save setting: {}", e))?;
    Ok(())
}

pub fn delete_setting(conn: &Connection, key: &str) -> Result<(), String> {
    conn.execute("DELETE FROM settings WHERE key = ?1", params![key])
        .map_err(|e| format!("Failed to delete setting: {}", e))?;
    Ok(())
}
