//! Tax calculation commands

use crate::AppState;
use crate::tax_engine::{self, FilingStatus, TaxBracket, TaxCalculation};
use tauri::State;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct TaxCalculationRequest {
    pub gross_income: f64,
    pub filing_status: String,
    pub deductions: Option<f64>,
    pub credits: Option<f64>,
    pub state: Option<String>,
    pub tax_year: Option<i32>,
}

#[derive(Debug, Serialize)]
pub struct TaxCalculationResponse {
    pub gross_income: f64,
    pub standard_deduction: f64,
    pub total_deductions: f64,
    pub taxable_income: f64,
    pub federal_tax: f64,
    pub state_tax: f64,
    pub total_tax: f64,
    pub effective_rate: f64,
    pub marginal_rate: f64,
    pub tax_credits: f64,
    pub tax_after_credits: f64,
    pub breakdown: Vec<BracketBreakdown>,
}

#[derive(Debug, Serialize)]
pub struct BracketBreakdown {
    pub bracket_min: f64,
    pub bracket_max: f64,
    pub rate: f64,
    pub taxable_in_bracket: f64,
    pub tax_from_bracket: f64,
}

/// Calculate federal income tax
#[tauri::command]
pub async fn calculate_federal_tax(
    request: TaxCalculationRequest,
) -> Result<TaxCalculationResponse, String> {
    let filing_status = FilingStatus::from_str(&request.filing_status)
        .map_err(|e| e.to_string())?;
    
    let tax_year = request.tax_year.unwrap_or(2024);
    let gross_income = request.gross_income;
    
    // Get standard deduction for filing status
    let standard_deduction = tax_engine::get_standard_deduction(filing_status, tax_year);
    
    // Use itemized deductions if provided and greater than standard
    let total_deductions = request.deductions
        .map(|d| d.max(standard_deduction))
        .unwrap_or(standard_deduction);
    
    // Calculate taxable income
    let taxable_income = (gross_income - total_deductions).max(0.0);
    
    // Calculate federal tax
    let calculation = tax_engine::calculate_tax(taxable_income, filing_status, tax_year);
    
    // Apply credits
    let tax_credits = request.credits.unwrap_or(0.0);
    let tax_after_credits = (calculation.total_tax - tax_credits).max(0.0);
    
    // Calculate state tax if requested
    let state_tax = match &request.state {
        Some(state) => tax_engine::calculate_state_tax(taxable_income, state, tax_year)
            .unwrap_or(0.0),
        None => 0.0,
    };
    
    // Build bracket breakdown
    let breakdown: Vec<BracketBreakdown> = calculation.bracket_details
        .iter()
        .map(|b| BracketBreakdown {
            bracket_min: b.min,
            bracket_max: b.max,
            rate: b.rate,
            taxable_in_bracket: b.taxable_amount,
            tax_from_bracket: b.tax_amount,
        })
        .collect();
    
    Ok(TaxCalculationResponse {
        gross_income,
        standard_deduction,
        total_deductions,
        taxable_income,
        federal_tax: calculation.total_tax,
        state_tax,
        total_tax: tax_after_credits + state_tax,
        effective_rate: if taxable_income > 0.0 { 
            tax_after_credits / taxable_income 
        } else { 
            0.0 
        },
        marginal_rate: calculation.marginal_rate,
        tax_credits,
        tax_after_credits,
        breakdown,
    })
}

/// Calculate state income tax
#[tauri::command]
pub async fn calculate_state_tax(
    taxable_income: f64,
    state: String,
    tax_year: Option<i32>,
) -> Result<f64, String> {
    let year = tax_year.unwrap_or(2024);
    tax_engine::calculate_state_tax(taxable_income, &state, year)
        .map_err(|e| e.to_string())
}

/// Get tax brackets for a filing status
#[tauri::command]
pub async fn get_tax_brackets(
    filing_status: String,
    tax_year: Option<i32>,
) -> Result<Vec<TaxBracket>, String> {
    let status = FilingStatus::from_str(&filing_status)
        .map_err(|e| e.to_string())?;
    let year = tax_year.unwrap_or(2024);
    
    Ok(tax_engine::get_brackets(status, year))
}

/// Estimate quarterly tax payments
#[tauri::command]
pub async fn estimate_quarterly_tax(
    annual_income: f64,
    filing_status: String,
    withholding: Option<f64>,
) -> Result<QuarterlyEstimate, String> {
    let status = FilingStatus::from_str(&filing_status)
        .map_err(|e| e.to_string())?;
    
    let standard_deduction = tax_engine::get_standard_deduction(status, 2024);
    let taxable_income = (annual_income - standard_deduction).max(0.0);
    let calculation = tax_engine::calculate_tax(taxable_income, status, 2024);
    
    let annual_tax = calculation.total_tax;
    let already_withheld = withholding.unwrap_or(0.0);
    let remaining_tax = (annual_tax - already_withheld).max(0.0);
    let quarterly_payment = remaining_tax / 4.0;
    
    Ok(QuarterlyEstimate {
        annual_tax,
        withholding: already_withheld,
        remaining_tax,
        quarterly_payment,
        due_dates: vec![
            "April 15, 2024".to_string(),
            "June 17, 2024".to_string(),
            "September 16, 2024".to_string(),
            "January 15, 2025".to_string(),
        ],
    })
}

#[derive(Debug, Serialize)]
pub struct QuarterlyEstimate {
    pub annual_tax: f64,
    pub withholding: f64,
    pub remaining_tax: f64,
    pub quarterly_payment: f64,
    pub due_dates: Vec<String>,
}
