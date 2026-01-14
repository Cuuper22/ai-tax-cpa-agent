//! Tax return management commands

use crate::AppState;
use crate::db::models::{TaxReturn, TaxReturnStatus};
use tauri::State;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Deserialize)]
pub struct CreateTaxReturnRequest {
    pub tax_year: i32,
    pub filing_status: String,
    pub first_name: String,
    pub last_name: String,
    pub ssn: Option<String>,
    pub spouse_first_name: Option<String>,
    pub spouse_last_name: Option<String>,
    pub spouse_ssn: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTaxReturnRequest {
    pub id: String,
    pub gross_income: Option<f64>,
    pub wages: Option<f64>,
    pub interest_income: Option<f64>,
    pub dividend_income: Option<f64>,
    pub capital_gains: Option<f64>,
    pub business_income: Option<f64>,
    pub other_income: Option<f64>,
    pub adjustments: Option<f64>,
    pub itemized_deductions: Option<f64>,
    pub use_standard_deduction: Option<bool>,
    pub federal_tax_withheld: Option<f64>,
    pub state_tax_withheld: Option<f64>,
    pub estimated_payments: Option<f64>,
}

#[derive(Debug, Serialize)]
pub struct TaxReturnSummary {
    pub id: String,
    pub tax_year: i32,
    pub filing_status: String,
    pub name: String,
    pub status: String,
    pub gross_income: f64,
    pub total_tax: f64,
    pub refund_or_owed: f64,
    pub created_at: String,
    pub updated_at: String,
}

/// Create a new tax return
#[tauri::command]
pub async fn create_tax_return(
    state: State<'_, AppState>,
    request: CreateTaxReturnRequest,
) -> Result<TaxReturnSummary, String> {
    let db_guard = state.db.read().await;
    let db = db_guard.as_ref().ok_or("Database not initialized")?;
    
    let id = Uuid::new_v4().to_string();
    let now = Utc::now();
    
    let tax_return = TaxReturn {
        id: id.clone(),
        tax_year: request.tax_year,
        filing_status: request.filing_status.clone(),
        first_name: request.first_name.clone(),
        last_name: request.last_name.clone(),
        ssn_encrypted: request.ssn.map(|s| s.into_bytes()),
        spouse_first_name: request.spouse_first_name,
        spouse_last_name: request.spouse_last_name,
        spouse_ssn_encrypted: request.spouse_ssn.map(|s| s.into_bytes()),
        wages: 0.0,
        interest_income: 0.0,
        dividend_income: 0.0,
        capital_gains: 0.0,
        business_income: 0.0,
        other_income: 0.0,
        gross_income: 0.0,
        adjustments: 0.0,
        itemized_deductions: 0.0,
        use_standard_deduction: true,
        federal_tax_withheld: 0.0,
        state_tax_withheld: 0.0,
        estimated_payments: 0.0,
        calculated_tax: 0.0,
        refund_or_owed: 0.0,
        status: TaxReturnStatus::Draft,
        created_at: now,
        updated_at: now,
    };
    
    db.insert_tax_return(&tax_return)
        .map_err(|e| format!("Failed to create tax return: {}", e))?;
    
    Ok(TaxReturnSummary {
        id: tax_return.id,
        tax_year: tax_return.tax_year,
        filing_status: tax_return.filing_status,
        name: format!("{} {}", tax_return.first_name, tax_return.last_name),
        status: "draft".to_string(),
        gross_income: 0.0,
        total_tax: 0.0,
        refund_or_owed: 0.0,
        created_at: now.to_rfc3339(),
        updated_at: now.to_rfc3339(),
    })
}

/// Get a specific tax return
#[tauri::command]
pub async fn get_tax_return(
    state: State<'_, AppState>,
    id: String,
) -> Result<TaxReturn, String> {
    let db_guard = state.db.read().await;
    let db = db_guard.as_ref().ok_or("Database not initialized")?;
    
    db.get_tax_return(&id)
        .map_err(|e| format!("Failed to get tax return: {}", e))?
        .ok_or("Tax return not found".to_string())
}

/// Update a tax return
#[tauri::command]
pub async fn update_tax_return(
    state: State<'_, AppState>,
    request: UpdateTaxReturnRequest,
) -> Result<TaxReturn, String> {
    let db_guard = state.db.read().await;
    let db = db_guard.as_ref().ok_or("Database not initialized")?;
    
    // Get existing return
    let mut tax_return = db.get_tax_return(&request.id)
        .map_err(|e| format!("Failed to get tax return: {}", e))?
        .ok_or("Tax return not found")?;
    
    // Update fields
    if let Some(v) = request.wages { tax_return.wages = v; }
    if let Some(v) = request.interest_income { tax_return.interest_income = v; }
    if let Some(v) = request.dividend_income { tax_return.dividend_income = v; }
    if let Some(v) = request.capital_gains { tax_return.capital_gains = v; }
    if let Some(v) = request.business_income { tax_return.business_income = v; }
    if let Some(v) = request.other_income { tax_return.other_income = v; }
    if let Some(v) = request.adjustments { tax_return.adjustments = v; }
    if let Some(v) = request.itemized_deductions { tax_return.itemized_deductions = v; }
    if let Some(v) = request.use_standard_deduction { tax_return.use_standard_deduction = v; }
    if let Some(v) = request.federal_tax_withheld { tax_return.federal_tax_withheld = v; }
    if let Some(v) = request.state_tax_withheld { tax_return.state_tax_withheld = v; }
    if let Some(v) = request.estimated_payments { tax_return.estimated_payments = v; }
    
    // Recalculate gross income
    tax_return.gross_income = tax_return.wages
        + tax_return.interest_income
        + tax_return.dividend_income
        + tax_return.capital_gains
        + tax_return.business_income
        + tax_return.other_income;
    
    // Update timestamp
    tax_return.updated_at = Utc::now();
    
    // Save
    db.update_tax_return(&tax_return)
        .map_err(|e| format!("Failed to update tax return: {}", e))?;
    
    Ok(tax_return)
}

/// Delete a tax return
#[tauri::command]
pub async fn delete_tax_return(
    state: State<'_, AppState>,
    id: String,
) -> Result<bool, String> {
    let db_guard = state.db.read().await;
    let db = db_guard.as_ref().ok_or("Database not initialized")?;
    
    db.delete_tax_return(&id)
        .map_err(|e| format!("Failed to delete tax return: {}", e))?;
    
    Ok(true)
}

/// List all tax returns
#[tauri::command]
pub async fn list_tax_returns(
    state: State<'_, AppState>,
    tax_year: Option<i32>,
) -> Result<Vec<TaxReturnSummary>, String> {
    let db_guard = state.db.read().await;
    let db = db_guard.as_ref().ok_or("Database not initialized")?;
    
    let returns = db.list_tax_returns(tax_year)
        .map_err(|e| format!("Failed to list tax returns: {}", e))?;
    
    Ok(returns.into_iter().map(|r| TaxReturnSummary {
        id: r.id,
        tax_year: r.tax_year,
        filing_status: r.filing_status,
        name: format!("{} {}", r.first_name, r.last_name),
        status: format!("{:?}", r.status).to_lowercase(),
        gross_income: r.gross_income,
        total_tax: r.calculated_tax,
        refund_or_owed: r.refund_or_owed,
        created_at: r.created_at.to_rfc3339(),
        updated_at: r.updated_at.to_rfc3339(),
    }).collect())
}

/// Export tax return as JSON
#[tauri::command]
pub async fn export_tax_return(
    state: State<'_, AppState>,
    id: String,
) -> Result<String, String> {
    let db_guard = state.db.read().await;
    let db = db_guard.as_ref().ok_or("Database not initialized")?;
    
    let tax_return = db.get_tax_return(&id)
        .map_err(|e| format!("Failed to get tax return: {}", e))?
        .ok_or("Tax return not found")?;
    
    serde_json::to_string_pretty(&tax_return)
        .map_err(|e| format!("Failed to export: {}", e))
}
