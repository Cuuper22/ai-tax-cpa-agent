//! Tax calculation engine with 2024 federal tax brackets
//!
//! Supports federal income tax calculations for all filing statuses
//! and basic state tax calculations.

use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum TaxError {
    #[error("Invalid filing status: {0}")]
    InvalidFilingStatus(String),
    
    #[error("Unsupported state: {0}")]
    UnsupportedState(String),
    
    #[error("Invalid tax year: {0}")]
    InvalidTaxYear(i32),
}

/// Filing status for federal taxes
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum FilingStatus {
    Single,
    MarriedFilingJointly,
    MarriedFilingSeparately,
    HeadOfHousehold,
    QualifyingWidow,
}

impl FilingStatus {
    pub fn from_str(s: &str) -> Result<Self, TaxError> {
        match s.to_lowercase().as_str() {
            "single" => Ok(Self::Single),
            "married_filing_jointly" | "married filing jointly" | "mfj" => Ok(Self::MarriedFilingJointly),
            "married_filing_separately" | "married filing separately" | "mfs" => Ok(Self::MarriedFilingSeparately),
            "head_of_household" | "head of household" | "hoh" => Ok(Self::HeadOfHousehold),
            "qualifying_widow" | "qualifying widow" | "qw" => Ok(Self::QualifyingWidow),
            _ => Err(TaxError::InvalidFilingStatus(s.to_string())),
        }
    }
    
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Single => "Single",
            Self::MarriedFilingJointly => "Married Filing Jointly",
            Self::MarriedFilingSeparately => "Married Filing Separately",
            Self::HeadOfHousehold => "Head of Household",
            Self::QualifyingWidow => "Qualifying Widow(er)",
        }
    }
}

/// Tax bracket definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaxBracket {
    pub min: f64,
    pub max: f64,
    pub rate: f64, // As decimal (0.10 for 10%)
}

/// Details for a single bracket in a calculation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BracketDetail {
    pub min: f64,
    pub max: f64,
    pub rate: f64,
    pub taxable_amount: f64,
    pub tax_amount: f64,
}

/// Result of a tax calculation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaxCalculation {
    pub total_tax: f64,
    pub effective_rate: f64,
    pub marginal_rate: f64,
    pub bracket_details: Vec<BracketDetail>,
}

/// 2024 Federal Tax Brackets
/// Source: IRS Revenue Procedure 2023-34
mod brackets_2024 {
    use super::TaxBracket;
    
    pub const SINGLE: &[TaxBracket] = &[
        TaxBracket { min: 0.0, max: 11_600.0, rate: 0.10 },
        TaxBracket { min: 11_600.0, max: 47_150.0, rate: 0.12 },
        TaxBracket { min: 47_150.0, max: 100_525.0, rate: 0.22 },
        TaxBracket { min: 100_525.0, max: 191_950.0, rate: 0.24 },
        TaxBracket { min: 191_950.0, max: 243_725.0, rate: 0.32 },
        TaxBracket { min: 243_725.0, max: 609_350.0, rate: 0.35 },
        TaxBracket { min: 609_350.0, max: f64::INFINITY, rate: 0.37 },
    ];
    
    pub const MARRIED_FILING_JOINTLY: &[TaxBracket] = &[
        TaxBracket { min: 0.0, max: 23_200.0, rate: 0.10 },
        TaxBracket { min: 23_200.0, max: 94_300.0, rate: 0.12 },
        TaxBracket { min: 94_300.0, max: 201_050.0, rate: 0.22 },
        TaxBracket { min: 201_050.0, max: 383_900.0, rate: 0.24 },
        TaxBracket { min: 383_900.0, max: 487_450.0, rate: 0.32 },
        TaxBracket { min: 487_450.0, max: 731_200.0, rate: 0.35 },
        TaxBracket { min: 731_200.0, max: f64::INFINITY, rate: 0.37 },
    ];
    
    pub const MARRIED_FILING_SEPARATELY: &[TaxBracket] = &[
        TaxBracket { min: 0.0, max: 11_600.0, rate: 0.10 },
        TaxBracket { min: 11_600.0, max: 47_150.0, rate: 0.12 },
        TaxBracket { min: 47_150.0, max: 100_525.0, rate: 0.22 },
        TaxBracket { min: 100_525.0, max: 191_950.0, rate: 0.24 },
        TaxBracket { min: 191_950.0, max: 243_725.0, rate: 0.32 },
        TaxBracket { min: 243_725.0, max: 365_600.0, rate: 0.35 },
        TaxBracket { min: 365_600.0, max: f64::INFINITY, rate: 0.37 },
    ];
    
    pub const HEAD_OF_HOUSEHOLD: &[TaxBracket] = &[
        TaxBracket { min: 0.0, max: 16_550.0, rate: 0.10 },
        TaxBracket { min: 16_550.0, max: 63_100.0, rate: 0.12 },
        TaxBracket { min: 63_100.0, max: 100_500.0, rate: 0.22 },
        TaxBracket { min: 100_500.0, max: 191_950.0, rate: 0.24 },
        TaxBracket { min: 191_950.0, max: 243_700.0, rate: 0.32 },
        TaxBracket { min: 243_700.0, max: 609_350.0, rate: 0.35 },
        TaxBracket { min: 609_350.0, max: f64::INFINITY, rate: 0.37 },
    ];
    
    // Qualifying Widow(er) uses same brackets as MFJ
    pub const QUALIFYING_WIDOW: &[TaxBracket] = MARRIED_FILING_JOINTLY;
    
    // 2024 Standard Deductions
    pub const STANDARD_DEDUCTION_SINGLE: f64 = 14_600.0;
    pub const STANDARD_DEDUCTION_MFJ: f64 = 29_200.0;
    pub const STANDARD_DEDUCTION_MFS: f64 = 14_600.0;
    pub const STANDARD_DEDUCTION_HOH: f64 = 21_900.0;
    pub const STANDARD_DEDUCTION_QW: f64 = 29_200.0;
}

/// Get the 2024 tax brackets for a filing status
pub fn get_brackets(status: FilingStatus, _tax_year: i32) -> Vec<TaxBracket> {
    // Currently only supporting 2024
    match status {
        FilingStatus::Single => brackets_2024::SINGLE.to_vec(),
        FilingStatus::MarriedFilingJointly => brackets_2024::MARRIED_FILING_JOINTLY.to_vec(),
        FilingStatus::MarriedFilingSeparately => brackets_2024::MARRIED_FILING_SEPARATELY.to_vec(),
        FilingStatus::HeadOfHousehold => brackets_2024::HEAD_OF_HOUSEHOLD.to_vec(),
        FilingStatus::QualifyingWidow => brackets_2024::QUALIFYING_WIDOW.to_vec(),
    }
}

/// Get the standard deduction for a filing status
pub fn get_standard_deduction(status: FilingStatus, _tax_year: i32) -> f64 {
    // Currently only supporting 2024
    match status {
        FilingStatus::Single => brackets_2024::STANDARD_DEDUCTION_SINGLE,
        FilingStatus::MarriedFilingJointly => brackets_2024::STANDARD_DEDUCTION_MFJ,
        FilingStatus::MarriedFilingSeparately => brackets_2024::STANDARD_DEDUCTION_MFS,
        FilingStatus::HeadOfHousehold => brackets_2024::STANDARD_DEDUCTION_HOH,
        FilingStatus::QualifyingWidow => brackets_2024::STANDARD_DEDUCTION_QW,
    }
}

/// Calculate federal income tax
pub fn calculate_tax(taxable_income: f64, status: FilingStatus, tax_year: i32) -> TaxCalculation {
    let brackets = get_brackets(status, tax_year);
    
    let mut total_tax = 0.0;
    let mut marginal_rate = 0.0;
    let mut bracket_details = Vec::new();
    let mut remaining_income = taxable_income;
    
    for bracket in &brackets {
        if remaining_income <= 0.0 {
            break;
        }
        
        let bracket_size = bracket.max - bracket.min;
        let taxable_in_bracket = remaining_income.min(bracket_size);
        let tax_from_bracket = taxable_in_bracket * bracket.rate;
        
        if taxable_in_bracket > 0.0 {
            bracket_details.push(BracketDetail {
                min: bracket.min,
                max: bracket.max,
                rate: bracket.rate,
                taxable_amount: taxable_in_bracket,
                tax_amount: tax_from_bracket,
            });
            
            total_tax += tax_from_bracket;
            marginal_rate = bracket.rate;
        }
        
        remaining_income -= bracket_size;
    }
    
    let effective_rate = if taxable_income > 0.0 {
        total_tax / taxable_income
    } else {
        0.0
    };
    
    TaxCalculation {
        total_tax,
        effective_rate,
        marginal_rate,
        bracket_details,
    }
}

/// State tax rates (simplified - flat rate approximations)
mod state_taxes {
    use std::collections::HashMap;
    use once_cell::sync::Lazy;
    
    // State tax rates (approximations for 2024)
    // Note: Many states have progressive brackets - these are simplified effective rates
    pub static STATE_RATES: Lazy<HashMap<&'static str, f64>> = Lazy::new(|| {
        let mut m = HashMap::new();
        
        // No income tax states
        m.insert("AK", 0.0);  // Alaska
        m.insert("FL", 0.0);  // Florida
        m.insert("NV", 0.0);  // Nevada
        m.insert("NH", 0.0);  // New Hampshire (interest/dividends only)
        m.insert("SD", 0.0);  // South Dakota
        m.insert("TN", 0.0);  // Tennessee
        m.insert("TX", 0.0);  // Texas
        m.insert("WA", 0.0);  // Washington
        m.insert("WY", 0.0);  // Wyoming
        
        // Flat tax states
        m.insert("CO", 0.044);   // Colorado
        m.insert("IL", 0.0495);  // Illinois
        m.insert("IN", 0.0305);  // Indiana
        m.insert("KY", 0.04);    // Kentucky
        m.insert("MA", 0.05);    // Massachusetts
        m.insert("MI", 0.0405);  // Michigan
        m.insert("NC", 0.0475);  // North Carolina
        m.insert("PA", 0.0307);  // Pennsylvania
        m.insert("UT", 0.0465);  // Utah
        
        // Progressive tax states (using approximate effective rates)
        m.insert("AL", 0.05);
        m.insert("AZ", 0.025);
        m.insert("AR", 0.047);
        m.insert("CA", 0.0725);  // High earner rate
        m.insert("CT", 0.05);
        m.insert("DE", 0.055);
        m.insert("GA", 0.0549);
        m.insert("HI", 0.0725);
        m.insert("ID", 0.058);
        m.insert("IA", 0.057);
        m.insert("KS", 0.057);
        m.insert("LA", 0.0425);
        m.insert("ME", 0.0715);
        m.insert("MD", 0.0575);
        m.insert("MN", 0.0785);
        m.insert("MS", 0.05);
        m.insert("MO", 0.0495);
        m.insert("MT", 0.059);
        m.insert("NE", 0.0584);
        m.insert("NJ", 0.0637);
        m.insert("NM", 0.049);
        m.insert("NY", 0.0685);
        m.insert("ND", 0.0219);
        m.insert("OH", 0.0399);
        m.insert("OK", 0.0475);
        m.insert("OR", 0.099);
        m.insert("RI", 0.0599);
        m.insert("SC", 0.064);
        m.insert("VT", 0.0875);
        m.insert("VA", 0.0575);
        m.insert("WV", 0.052);
        m.insert("WI", 0.0765);
        m.insert("DC", 0.0895);
        
        m
    });
}

/// Calculate state income tax (simplified flat-rate calculation)
pub fn calculate_state_tax(taxable_income: f64, state: &str, _tax_year: i32) -> Result<f64, TaxError> {
    let state_upper = state.to_uppercase();
    let state_code = state_upper.as_str();
    
    match state_taxes::STATE_RATES.get(state_code) {
        Some(&rate) => Ok(taxable_income * rate),
        None => Err(TaxError::UnsupportedState(state.to_string())),
    }
}

/// FICA (Social Security + Medicare) calculation
pub mod fica {
    // 2024 FICA rates
    pub const SOCIAL_SECURITY_RATE: f64 = 0.062;
    pub const MEDICARE_RATE: f64 = 0.0145;
    pub const SOCIAL_SECURITY_WAGE_BASE: f64 = 168_600.0;
    pub const MEDICARE_ADDITIONAL_THRESHOLD: f64 = 200_000.0;
    pub const MEDICARE_ADDITIONAL_RATE: f64 = 0.009;
    
    /// Calculate employee FICA taxes
    pub fn calculate_fica(gross_wages: f64) -> FicaResult {
        // Social Security (capped at wage base)
        let ss_wages = gross_wages.min(SOCIAL_SECURITY_WAGE_BASE);
        let social_security_tax = ss_wages * SOCIAL_SECURITY_RATE;
        
        // Medicare (no cap, but additional tax over threshold)
        let medicare_base = gross_wages * MEDICARE_RATE;
        let medicare_additional = if gross_wages > MEDICARE_ADDITIONAL_THRESHOLD {
            (gross_wages - MEDICARE_ADDITIONAL_THRESHOLD) * MEDICARE_ADDITIONAL_RATE
        } else {
            0.0
        };
        let medicare_tax = medicare_base + medicare_additional;
        
        FicaResult {
            social_security_tax,
            medicare_tax,
            total_fica: social_security_tax + medicare_tax,
        }
    }
    
    #[derive(Debug, Clone)]
    pub struct FicaResult {
        pub social_security_tax: f64,
        pub medicare_tax: f64,
        pub total_fica: f64,
    }
}

/// Self-employment tax calculation
pub mod self_employment {
    pub const SE_TAX_RATE: f64 = 0.153; // 12.4% SS + 2.9% Medicare
    pub const SE_DEDUCTION_RATE: f64 = 0.9235; // Can only deduct 92.35% of net earnings
    
    pub fn calculate_se_tax(net_self_employment_income: f64) -> SeResult {
        let taxable_se_income = net_self_employment_income * SE_DEDUCTION_RATE;
        
        // Cap Social Security portion at wage base
        let ss_portion = taxable_se_income.min(super::fica::SOCIAL_SECURITY_WAGE_BASE);
        let ss_tax = ss_portion * 0.124;
        
        // Medicare has no cap
        let medicare_tax = taxable_se_income * 0.029;
        
        // Additional Medicare tax for high earners
        let additional_medicare = if taxable_se_income > super::fica::MEDICARE_ADDITIONAL_THRESHOLD {
            (taxable_se_income - super::fica::MEDICARE_ADDITIONAL_THRESHOLD) * 0.009
        } else {
            0.0
        };
        
        let total_se_tax = ss_tax + medicare_tax + additional_medicare;
        
        // Deductible portion (half of SE tax)
        let deductible_amount = total_se_tax / 2.0;
        
        SeResult {
            social_security_tax: ss_tax,
            medicare_tax: medicare_tax + additional_medicare,
            total_se_tax,
            deductible_amount,
        }
    }
    
    #[derive(Debug, Clone)]
    pub struct SeResult {
        pub social_security_tax: f64,
        pub medicare_tax: f64,
        pub total_se_tax: f64,
        pub deductible_amount: f64,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_single_filer_basic() {
        // $50,000 income - $14,600 standard deduction = $35,400 taxable
        let result = calculate_tax(35_400.0, FilingStatus::Single, 2024);
        
        // 10% on first $11,600 = $1,160
        // 12% on remaining $23,800 = $2,856
        // Total = $4,016
        assert!((result.total_tax - 4_016.0).abs() < 1.0);
        assert_eq!(result.marginal_rate, 0.12);
    }
    
    #[test]
    fn test_married_filing_jointly() {
        // $150,000 income - $29,200 standard deduction = $120,800 taxable
        let result = calculate_tax(120_800.0, FilingStatus::MarriedFilingJointly, 2024);
        
        // 10% on $23,200 = $2,320
        // 12% on $71,100 ($94,300 - $23,200) = $8,532
        // 22% on $26,500 ($120,800 - $94,300) = $5,830
        // Total = $16,682
        assert!((result.total_tax - 16_682.0).abs() < 1.0);
        assert_eq!(result.marginal_rate, 0.22);
    }
    
    #[test]
    fn test_standard_deductions() {
        assert_eq!(get_standard_deduction(FilingStatus::Single, 2024), 14_600.0);
        assert_eq!(get_standard_deduction(FilingStatus::MarriedFilingJointly, 2024), 29_200.0);
        assert_eq!(get_standard_deduction(FilingStatus::HeadOfHousehold, 2024), 21_900.0);
    }
    
    #[test]
    fn test_state_tax() {
        // Texas - no income tax
        assert_eq!(calculate_state_tax(100_000.0, "TX", 2024).unwrap(), 0.0);
        
        // California - ~7.25%
        let ca_tax = calculate_state_tax(100_000.0, "CA", 2024).unwrap();
        assert!((ca_tax - 7_250.0).abs() < 1.0);
    }
    
    #[test]
    fn test_fica() {
        let result = fica::calculate_fica(100_000.0);
        
        // 6.2% SS + 1.45% Medicare = 7.65%
        assert!((result.total_fica - 7_650.0).abs() < 1.0);
    }
}
