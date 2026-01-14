//! Document management commands

use crate::AppState;
use crate::db::models::{Document, DocumentType};
use tauri::State;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::Utc;
use std::path::PathBuf;

#[derive(Debug, Deserialize)]
pub struct UploadDocumentRequest {
    pub tax_return_id: Option<String>,
    pub doc_type: String,
    pub file_path: String,
    pub original_name: String,
}

#[derive(Debug, Serialize)]
pub struct DocumentResponse {
    pub id: String,
    pub tax_return_id: Option<String>,
    pub doc_type: String,
    pub doc_type_display: String,
    pub original_name: String,
    pub file_path: String,
    pub file_size: u64,
    pub ocr_text: Option<String>,
    pub extracted_data: Option<ExtractedDocumentData>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ExtractedDocumentData {
    pub document_type: String,
    pub employer_name: Option<String>,
    pub employer_ein: Option<String>,
    pub wages: Option<f64>,
    pub federal_tax_withheld: Option<f64>,
    pub state_tax_withheld: Option<f64>,
    pub social_security_wages: Option<f64>,
    pub medicare_wages: Option<f64>,
    pub vendor_name: Option<String>,
    pub amount: Option<f64>,
    pub date: Option<String>,
    pub category: Option<String>,
    pub confidence: f64,
}

/// Upload a document
#[tauri::command]
pub async fn upload_document(
    state: State<'_, AppState>,
    request: UploadDocumentRequest,
) -> Result<DocumentResponse, String> {
    let db_guard = state.db.read().await;
    let db = db_guard.as_ref().ok_or("Database not initialized")?;
    
    let id = Uuid::new_v4().to_string();
    let now = Utc::now();
    
    let doc_type = DocumentType::from_str(&request.doc_type)
        .map_err(|e| e.to_string())?;
    
    // Get file size
    let file_size = std::fs::metadata(&request.file_path)
        .map(|m| m.len())
        .unwrap_or(0);
    
    let document = Document {
        id: id.clone(),
        tax_return_id: request.tax_return_id.clone(),
        doc_type: doc_type.clone(),
        original_name: request.original_name.clone(),
        file_path: request.file_path.clone(),
        file_size,
        ocr_text: None,
        extracted_data: None,
        created_at: now,
    };
    
    db.insert_document(&document)
        .map_err(|e| format!("Failed to upload document: {}", e))?;
    
    Ok(DocumentResponse {
        id: document.id,
        tax_return_id: document.tax_return_id,
        doc_type: format!("{:?}", doc_type).to_lowercase(),
        doc_type_display: doc_type.display_name(),
        original_name: document.original_name,
        file_path: document.file_path,
        file_size: document.file_size,
        ocr_text: None,
        extracted_data: None,
        created_at: now.to_rfc3339(),
    })
}

/// Get a document
#[tauri::command]
pub async fn get_document(
    state: State<'_, AppState>,
    id: String,
) -> Result<DocumentResponse, String> {
    let db_guard = state.db.read().await;
    let db = db_guard.as_ref().ok_or("Database not initialized")?;
    
    let document = db.get_document(&id)
        .map_err(|e| format!("Failed to get document: {}", e))?
        .ok_or("Document not found")?;
    
    let extracted: Option<ExtractedDocumentData> = document.extracted_data
        .as_ref()
        .and_then(|s| serde_json::from_str(s).ok());
    
    Ok(DocumentResponse {
        id: document.id,
        tax_return_id: document.tax_return_id,
        doc_type: format!("{:?}", document.doc_type).to_lowercase(),
        doc_type_display: document.doc_type.display_name(),
        original_name: document.original_name,
        file_path: document.file_path,
        file_size: document.file_size,
        ocr_text: document.ocr_text,
        extracted_data: extracted,
        created_at: document.created_at.to_rfc3339(),
    })
}

/// Delete a document
#[tauri::command]
pub async fn delete_document(
    state: State<'_, AppState>,
    id: String,
) -> Result<bool, String> {
    let db_guard = state.db.read().await;
    let db = db_guard.as_ref().ok_or("Database not initialized")?;
    
    // Get document to find file path
    if let Ok(Some(doc)) = db.get_document(&id) {
        // Delete the actual file
        let _ = std::fs::remove_file(&doc.file_path);
    }
    
    db.delete_document(&id)
        .map_err(|e| format!("Failed to delete document: {}", e))?;
    
    Ok(true)
}

/// List documents
#[tauri::command]
pub async fn list_documents(
    state: State<'_, AppState>,
    tax_return_id: Option<String>,
) -> Result<Vec<DocumentResponse>, String> {
    let db_guard = state.db.read().await;
    let db = db_guard.as_ref().ok_or("Database not initialized")?;
    
    let documents = db.list_documents(tax_return_id.as_deref())
        .map_err(|e| format!("Failed to list documents: {}", e))?;
    
    Ok(documents.into_iter().map(|d| {
        let extracted: Option<ExtractedDocumentData> = d.extracted_data
            .as_ref()
            .and_then(|s| serde_json::from_str(s).ok());
        
        DocumentResponse {
            id: d.id,
            tax_return_id: d.tax_return_id,
            doc_type: format!("{:?}", d.doc_type).to_lowercase(),
            doc_type_display: d.doc_type.display_name(),
            original_name: d.original_name,
            file_path: d.file_path,
            file_size: d.file_size,
            ocr_text: d.ocr_text,
            extracted_data: extracted,
            created_at: d.created_at.to_rfc3339(),
        }
    }).collect())
}

/// Extract data from a document using OCR and pattern matching
#[tauri::command]
pub async fn extract_document_data(
    state: State<'_, AppState>,
    id: String,
) -> Result<ExtractedDocumentData, String> {
    let db_guard = state.db.read().await;
    let db = db_guard.as_ref().ok_or("Database not initialized")?;
    
    let document = db.get_document(&id)
        .map_err(|e| format!("Failed to get document: {}", e))?
        .ok_or("Document not found")?;
    
    // For now, return mock extraction based on document type
    // In production, this would use Tesseract OCR or similar
    let extracted = match document.doc_type {
        DocumentType::W2 => ExtractedDocumentData {
            document_type: "W-2".to_string(),
            employer_name: Some("Sample Employer Inc.".to_string()),
            employer_ein: Some("12-3456789".to_string()),
            wages: Some(75000.0),
            federal_tax_withheld: Some(12000.0),
            state_tax_withheld: Some(4500.0),
            social_security_wages: Some(75000.0),
            medicare_wages: Some(75000.0),
            vendor_name: None,
            amount: None,
            date: None,
            category: None,
            confidence: 0.85,
        },
        DocumentType::Form1099Int | DocumentType::Form1099Div | DocumentType::Form1099Misc => ExtractedDocumentData {
            document_type: "1099".to_string(),
            employer_name: None,
            employer_ein: None,
            wages: None,
            federal_tax_withheld: Some(0.0),
            state_tax_withheld: None,
            social_security_wages: None,
            medicare_wages: None,
            vendor_name: Some("Investment Company".to_string()),
            amount: Some(1500.0),
            date: Some("2024-12-31".to_string()),
            category: Some("interest".to_string()),
            confidence: 0.80,
        },
        DocumentType::Receipt => ExtractedDocumentData {
            document_type: "Receipt".to_string(),
            employer_name: None,
            employer_ein: None,
            wages: None,
            federal_tax_withheld: None,
            state_tax_withheld: None,
            social_security_wages: None,
            medicare_wages: None,
            vendor_name: Some("Office Supply Store".to_string()),
            amount: Some(125.50),
            date: Some("2024-03-15".to_string()),
            category: Some("business".to_string()),
            confidence: 0.75,
        },
        _ => ExtractedDocumentData {
            document_type: "Unknown".to_string(),
            employer_name: None,
            employer_ein: None,
            wages: None,
            federal_tax_withheld: None,
            state_tax_withheld: None,
            social_security_wages: None,
            medicare_wages: None,
            vendor_name: None,
            amount: None,
            date: None,
            category: None,
            confidence: 0.0,
        },
    };
    
    // Save extracted data
    drop(db_guard);
    let db_guard = state.db.read().await;
    let db = db_guard.as_ref().ok_or("Database not initialized")?;
    
    let extracted_json = serde_json::to_string(&extracted)
        .map_err(|e| format!("Failed to serialize: {}", e))?;
    
    db.update_document_extraction(&id, &extracted_json)
        .map_err(|e| format!("Failed to save extraction: {}", e))?;
    
    Ok(extracted)
}
