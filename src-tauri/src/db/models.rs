//! Database models

use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

/// Tax return status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TaxReturnStatus {
    Draft,
    InProgress,
    Review,
    Filed,
    Amended,
}

impl TaxReturnStatus {
    pub fn from_str(s: &str) -> Result<Self, String> {
        match s.to_lowercase().as_str() {
            "draft" => Ok(Self::Draft),
            "in_progress" | "inprogress" => Ok(Self::InProgress),
            "review" => Ok(Self::Review),
            "filed" => Ok(Self::Filed),
            "amended" => Ok(Self::Amended),
            _ => Err(format!("Unknown status: {}", s)),
        }
    }
    
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Draft => "draft",
            Self::InProgress => "in_progress",
            Self::Review => "review",
            Self::Filed => "filed",
            Self::Amended => "amended",
        }
    }
}

/// Tax return record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaxReturn {
    pub id: String,
    pub tax_year: i32,
    pub filing_status: String,
    pub first_name: String,
    pub last_name: String,
    #[serde(skip_serializing)]
    pub ssn_encrypted: Option<Vec<u8>>,
    pub spouse_first_name: Option<String>,
    pub spouse_last_name: Option<String>,
    #[serde(skip_serializing)]
    pub spouse_ssn_encrypted: Option<Vec<u8>>,
    pub wages: f64,
    pub interest_income: f64,
    pub dividend_income: f64,
    pub capital_gains: f64,
    pub business_income: f64,
    pub other_income: f64,
    pub gross_income: f64,
    pub adjustments: f64,
    pub itemized_deductions: f64,
    pub use_standard_deduction: bool,
    pub federal_tax_withheld: f64,
    pub state_tax_withheld: f64,
    pub estimated_payments: f64,
    pub calculated_tax: f64,
    pub refund_or_owed: f64,
    pub status: TaxReturnStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Deduction category
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DeductionCategory {
    Medical,
    StateLocalTaxes,
    MortgageInterest,
    Charitable,
    Business,
    HomeOffice,
    Education,
    Retirement,
    HealthSavings,
    Other,
}

impl DeductionCategory {
    pub fn from_str(s: &str) -> Result<Self, String> {
        match s.to_lowercase().as_str() {
            "medical" => Ok(Self::Medical),
            "state_local_taxes" | "statelocaltaxes" | "salt" => Ok(Self::StateLocalTaxes),
            "mortgage_interest" | "mortgageinterest" | "mortgage" => Ok(Self::MortgageInterest),
            "charitable" | "charity" | "donation" => Ok(Self::Charitable),
            "business" => Ok(Self::Business),
            "home_office" | "homeoffice" => Ok(Self::HomeOffice),
            "education" => Ok(Self::Education),
            "retirement" => Ok(Self::Retirement),
            "health_savings" | "healthsavings" | "hsa" => Ok(Self::HealthSavings),
            "other" => Ok(Self::Other),
            _ => Err(format!("Unknown category: {}", s)),
        }
    }
    
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Medical => "medical",
            Self::StateLocalTaxes => "state_local_taxes",
            Self::MortgageInterest => "mortgage_interest",
            Self::Charitable => "charitable",
            Self::Business => "business",
            Self::HomeOffice => "home_office",
            Self::Education => "education",
            Self::Retirement => "retirement",
            Self::HealthSavings => "health_savings",
            Self::Other => "other",
        }
    }
    
    pub fn display_name(&self) -> String {
        match self {
            Self::Medical => "Medical & Dental".to_string(),
            Self::StateLocalTaxes => "State & Local Taxes".to_string(),
            Self::MortgageInterest => "Mortgage Interest".to_string(),
            Self::Charitable => "Charitable Contributions".to_string(),
            Self::Business => "Business Expenses".to_string(),
            Self::HomeOffice => "Home Office".to_string(),
            Self::Education => "Education".to_string(),
            Self::Retirement => "Retirement Contributions".to_string(),
            Self::HealthSavings => "Health Savings Account".to_string(),
            Self::Other => "Other".to_string(),
        }
    }
}

/// Deduction record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Deduction {
    pub id: String,
    pub tax_return_id: String,
    pub category: DeductionCategory,
    pub description: String,
    pub amount: f64,
    pub date: Option<String>,
    pub receipt_id: Option<String>,
    pub created_at: DateTime<Utc>,
}

/// Document type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DocumentType {
    W2,
    Form1099Int,
    Form1099Div,
    Form1099Misc,
    Form1099Nec,
    Form1099B,
    FormK1,
    Receipt,
    BankStatement,
    Other,
}

impl DocumentType {
    pub fn from_str(s: &str) -> Result<Self, String> {
        match s.to_lowercase().as_str() {
            "w2" | "w-2" => Ok(Self::W2),
            "1099-int" | "1099int" | "form1099int" => Ok(Self::Form1099Int),
            "1099-div" | "1099div" | "form1099div" => Ok(Self::Form1099Div),
            "1099-misc" | "1099misc" | "form1099misc" => Ok(Self::Form1099Misc),
            "1099-nec" | "1099nec" | "form1099nec" => Ok(Self::Form1099Nec),
            "1099-b" | "1099b" | "form1099b" => Ok(Self::Form1099B),
            "k-1" | "k1" | "formk1" => Ok(Self::FormK1),
            "receipt" => Ok(Self::Receipt),
            "bank_statement" | "bankstatement" | "bank" => Ok(Self::BankStatement),
            "other" => Ok(Self::Other),
            _ => Err(format!("Unknown document type: {}", s)),
        }
    }
    
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::W2 => "w2",
            Self::Form1099Int => "1099-int",
            Self::Form1099Div => "1099-div",
            Self::Form1099Misc => "1099-misc",
            Self::Form1099Nec => "1099-nec",
            Self::Form1099B => "1099-b",
            Self::FormK1 => "k-1",
            Self::Receipt => "receipt",
            Self::BankStatement => "bank_statement",
            Self::Other => "other",
        }
    }
    
    pub fn display_name(&self) -> String {
        match self {
            Self::W2 => "W-2 (Wages)".to_string(),
            Self::Form1099Int => "1099-INT (Interest)".to_string(),
            Self::Form1099Div => "1099-DIV (Dividends)".to_string(),
            Self::Form1099Misc => "1099-MISC (Miscellaneous)".to_string(),
            Self::Form1099Nec => "1099-NEC (Non-Employee Compensation)".to_string(),
            Self::Form1099B => "1099-B (Broker Sales)".to_string(),
            Self::FormK1 => "K-1 (Partnership/S-Corp)".to_string(),
            Self::Receipt => "Receipt".to_string(),
            Self::BankStatement => "Bank Statement".to_string(),
            Self::Other => "Other Document".to_string(),
        }
    }
}

/// Document record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Document {
    pub id: String,
    pub tax_return_id: Option<String>,
    pub doc_type: DocumentType,
    pub original_name: String,
    pub file_path: String,
    pub file_size: u64,
    pub ocr_text: Option<String>,
    pub extracted_data: Option<String>,
    pub created_at: DateTime<Utc>,
}

/// Chat message record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub id: String,
    pub role: String,
    pub content: String,
    pub created_at: DateTime<Utc>,
}
