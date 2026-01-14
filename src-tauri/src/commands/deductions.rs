//! Deduction management commands

use crate::AppState;
use crate::db::models::{Deduction, DeductionCategory};
use tauri::State;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::Utc;

#[derive(Debug, Deserialize)]
pub struct AddDeductionRequest {
    pub tax_return_id: String,
    pub category: String,
    pub description: String,
    pub amount: f64,
    pub date: Option<String>,
    pub receipt_id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateDeductionRequest {
    pub id: String,
    pub category: Option<String>,
    pub description: Option<String>,
    pub amount: Option<f64>,
    pub date: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct DeductionResponse {
    pub id: String,
    pub tax_return_id: String,
    pub category: String,
    pub category_display: String,
    pub description: String,
    pub amount: f64,
    pub date: Option<String>,
    pub receipt_id: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize)]
pub struct DeductionCategoryInfo {
    pub id: String,
    pub name: String,
    pub description: String,
    pub schedule: String,
    pub examples: Vec<String>,
}

/// Add a new deduction
#[tauri::command]
pub async fn add_deduction(
    state: State<'_, AppState>,
    request: AddDeductionRequest,
) -> Result<DeductionResponse, String> {
    let db_guard = state.db.read().await;
    let db = db_guard.as_ref().ok_or("Database not initialized")?;
    
    let id = Uuid::new_v4().to_string();
    let now = Utc::now();
    
    let category = DeductionCategory::from_str(&request.category)
        .map_err(|e| e.to_string())?;
    
    let deduction = Deduction {
        id: id.clone(),
        tax_return_id: request.tax_return_id.clone(),
        category: category.clone(),
        description: request.description.clone(),
        amount: request.amount,
        date: request.date.clone(),
        receipt_id: request.receipt_id.clone(),
        created_at: now,
    };
    
    db.insert_deduction(&deduction)
        .map_err(|e| format!("Failed to add deduction: {}", e))?;
    
    Ok(DeductionResponse {
        id: deduction.id,
        tax_return_id: deduction.tax_return_id,
        category: format!("{:?}", category).to_lowercase(),
        category_display: category.display_name(),
        description: deduction.description,
        amount: deduction.amount,
        date: deduction.date,
        receipt_id: deduction.receipt_id,
        created_at: now.to_rfc3339(),
    })
}

/// Update a deduction
#[tauri::command]
pub async fn update_deduction(
    state: State<'_, AppState>,
    request: UpdateDeductionRequest,
) -> Result<DeductionResponse, String> {
    let db_guard = state.db.read().await;
    let db = db_guard.as_ref().ok_or("Database not initialized")?;
    
    let mut deduction = db.get_deduction(&request.id)
        .map_err(|e| format!("Failed to get deduction: {}", e))?
        .ok_or("Deduction not found")?;
    
    if let Some(cat) = request.category {
        deduction.category = DeductionCategory::from_str(&cat)
            .map_err(|e| e.to_string())?;
    }
    if let Some(desc) = request.description {
        deduction.description = desc;
    }
    if let Some(amt) = request.amount {
        deduction.amount = amt;
    }
    if let Some(date) = request.date {
        deduction.date = Some(date);
    }
    
    db.update_deduction(&deduction)
        .map_err(|e| format!("Failed to update deduction: {}", e))?;
    
    Ok(DeductionResponse {
        id: deduction.id,
        tax_return_id: deduction.tax_return_id,
        category: format!("{:?}", deduction.category).to_lowercase(),
        category_display: deduction.category.display_name(),
        description: deduction.description,
        amount: deduction.amount,
        date: deduction.date,
        receipt_id: deduction.receipt_id,
        created_at: deduction.created_at.to_rfc3339(),
    })
}

/// Delete a deduction
#[tauri::command]
pub async fn delete_deduction(
    state: State<'_, AppState>,
    id: String,
) -> Result<bool, String> {
    let db_guard = state.db.read().await;
    let db = db_guard.as_ref().ok_or("Database not initialized")?;
    
    db.delete_deduction(&id)
        .map_err(|e| format!("Failed to delete deduction: {}", e))?;
    
    Ok(true)
}

/// List deductions for a tax return
#[tauri::command]
pub async fn list_deductions(
    state: State<'_, AppState>,
    tax_return_id: String,
) -> Result<Vec<DeductionResponse>, String> {
    let db_guard = state.db.read().await;
    let db = db_guard.as_ref().ok_or("Database not initialized")?;
    
    let deductions = db.list_deductions(&tax_return_id)
        .map_err(|e| format!("Failed to list deductions: {}", e))?;
    
    Ok(deductions.into_iter().map(|d| DeductionResponse {
        id: d.id,
        tax_return_id: d.tax_return_id,
        category: format!("{:?}", d.category).to_lowercase(),
        category_display: d.category.display_name(),
        description: d.description,
        amount: d.amount,
        date: d.date,
        receipt_id: d.receipt_id,
        created_at: d.created_at.to_rfc3339(),
    }).collect())
}

/// Get available deduction categories
#[tauri::command]
pub async fn get_deduction_categories() -> Result<Vec<DeductionCategoryInfo>, String> {
    Ok(vec![
        DeductionCategoryInfo {
            id: "medical".to_string(),
            name: "Medical & Dental".to_string(),
            description: "Medical and dental expenses exceeding 7.5% of AGI".to_string(),
            schedule: "Schedule A".to_string(),
            examples: vec![
                "Doctor visits".to_string(),
                "Prescription medications".to_string(),
                "Health insurance premiums".to_string(),
                "Medical equipment".to_string(),
            ],
        },
        DeductionCategoryInfo {
            id: "state_local_taxes".to_string(),
            name: "State & Local Taxes (SALT)".to_string(),
            description: "State income/sales tax and property taxes (max $10,000)".to_string(),
            schedule: "Schedule A".to_string(),
            examples: vec![
                "State income tax".to_string(),
                "Property tax".to_string(),
                "Vehicle registration fees".to_string(),
            ],
        },
        DeductionCategoryInfo {
            id: "mortgage_interest".to_string(),
            name: "Mortgage Interest".to_string(),
            description: "Interest on mortgage for primary residence".to_string(),
            schedule: "Schedule A".to_string(),
            examples: vec![
                "Home mortgage interest".to_string(),
                "Points paid on home purchase".to_string(),
            ],
        },
        DeductionCategoryInfo {
            id: "charitable".to_string(),
            name: "Charitable Contributions".to_string(),
            description: "Donations to qualified charitable organizations".to_string(),
            schedule: "Schedule A".to_string(),
            examples: vec![
                "Cash donations".to_string(),
                "Non-cash donations".to_string(),
                "Volunteer mileage".to_string(),
            ],
        },
        DeductionCategoryInfo {
            id: "business".to_string(),
            name: "Business Expenses".to_string(),
            description: "Ordinary and necessary business expenses".to_string(),
            schedule: "Schedule C".to_string(),
            examples: vec![
                "Office supplies".to_string(),
                "Business travel".to_string(),
                "Professional services".to_string(),
                "Equipment".to_string(),
            ],
        },
        DeductionCategoryInfo {
            id: "home_office".to_string(),
            name: "Home Office".to_string(),
            description: "Expenses for regular and exclusive business use of home".to_string(),
            schedule: "Schedule C / Form 8829".to_string(),
            examples: vec![
                "Utilities".to_string(),
                "Rent/mortgage".to_string(),
                "Internet".to_string(),
                "Office furniture".to_string(),
            ],
        },
        DeductionCategoryInfo {
            id: "education".to_string(),
            name: "Education".to_string(),
            description: "Work-related education expenses".to_string(),
            schedule: "Various".to_string(),
            examples: vec![
                "Tuition".to_string(),
                "Books and supplies".to_string(),
                "Professional certifications".to_string(),
            ],
        },
        DeductionCategoryInfo {
            id: "retirement".to_string(),
            name: "Retirement Contributions".to_string(),
            description: "Contributions to qualified retirement accounts".to_string(),
            schedule: "Form 1040".to_string(),
            examples: vec![
                "Traditional IRA".to_string(),
                "SEP IRA".to_string(),
                "Solo 401(k)".to_string(),
            ],
        },
        DeductionCategoryInfo {
            id: "health_savings".to_string(),
            name: "Health Savings Account (HSA)".to_string(),
            description: "Contributions to HSA accounts".to_string(),
            schedule: "Form 8889".to_string(),
            examples: vec![
                "HSA contributions".to_string(),
            ],
        },
        DeductionCategoryInfo {
            id: "other".to_string(),
            name: "Other Deductions".to_string(),
            description: "Other allowable deductions".to_string(),
            schedule: "Various".to_string(),
            examples: vec![
                "Student loan interest".to_string(),
                "Self-employment tax".to_string(),
                "Alimony (pre-2019)".to_string(),
            ],
        },
    ])
}
