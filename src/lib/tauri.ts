/**
 * Tauri command invocation wrappers
 * Type-safe wrappers for all Rust backend commands
 */

import { invoke } from "@tauri-apps/api/core";

// ============================================================================
// Types
// ============================================================================

export interface AuthStatus {
  unlocked: boolean;
  has_pin: boolean;
}

export interface TaxCalculationRequest {
  gross_income: number;
  filing_status: string;
  deductions?: number;
  credits?: number;
  state?: string;
  tax_year?: number;
}

export interface TaxCalculationResponse {
  gross_income: number;
  standard_deduction: number;
  total_deductions: number;
  taxable_income: number;
  federal_tax: number;
  state_tax: number;
  total_tax: number;
  effective_rate: number;
  marginal_rate: number;
  tax_credits: number;
  tax_after_credits: number;
  breakdown: BracketBreakdown[];
}

export interface BracketBreakdown {
  bracket_min: number;
  bracket_max: number;
  rate: number;
  taxable_in_bracket: number;
  tax_from_bracket: number;
}

export interface TaxBracket {
  min: number;
  max: number;
  rate: number;
}

export interface QuarterlyEstimate {
  annual_tax: number;
  withholding: number;
  remaining_tax: number;
  quarterly_payment: number;
  due_dates: string[];
}

export interface TaxReturn {
  id: string;
  tax_year: number;
  filing_status: string;
  gross_income: number;
  total_deductions: number;
  taxable_income: number;
  total_tax: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Deduction {
  id: string;
  tax_return_id?: string;
  category: string;
  description: string;
  amount: number;
  is_itemized: boolean;
  created_at: string;
}

export interface Document {
  id: string;
  name: string;
  document_type: string;
  file_path: string;
  extracted_data?: string;
  tax_year?: number;
  created_at: string;
}

export interface ChatResponse {
  id: string;
  role: string;
  content: string;
  timestamp: string;
}

export interface ChatContext {
  tax_year?: number;
  filing_status?: string;
  gross_income?: number;
  topic?: string;
}

export interface AuditAnalysisResponse {
  summary: string;
  risk_level: string;
  recommended_actions: string[];
  legal_citations: string[];
  response_deadline?: string;
  defense_strategy: string;
}

export interface TaxAdviceResponse {
  advice: string;
  relevant_forms: string[];
  potential_savings?: number;
  warnings: string[];
}

// ============================================================================
// Auth Commands
// ============================================================================

export const auth = {
  /** Check if the app is unlocked */
  isUnlocked: (): Promise<AuthStatus> => invoke("is_unlocked"),
  
  /** Setup initial PIN */
  setupPin: (pin: string): Promise<boolean> => invoke("setup_pin", { pin }),
  
  /** Unlock app with PIN */
  unlock: (pin: string): Promise<boolean> => invoke("unlock_app", { pin }),
  
  /** Lock the app */
  lock: (): Promise<boolean> => invoke("lock_app"),
  
  /** Change PIN */
  changePin: (currentPin: string, newPin: string): Promise<boolean> =>
    invoke("change_pin", { currentPin, newPin }),
};

// ============================================================================
// Tax Calculation Commands
// ============================================================================

export const tax = {
  /** Calculate federal income tax */
  calculateFederal: (request: TaxCalculationRequest): Promise<TaxCalculationResponse> =>
    invoke("calculate_federal_tax", { request }),
  
  /** Calculate state income tax */
  calculateState: (taxableIncome: number, state: string, taxYear?: number): Promise<number> =>
    invoke("calculate_state_tax", { taxableIncome, state, taxYear }),
  
  /** Get tax brackets for filing status */
  getBrackets: (filingStatus: string, taxYear?: number): Promise<TaxBracket[]> =>
    invoke("get_tax_brackets", { filingStatus, taxYear }),
  
  /** Estimate quarterly tax payments */
  estimateQuarterly: (
    annualIncome: number,
    filingStatus: string,
    withholding?: number
  ): Promise<QuarterlyEstimate> =>
    invoke("estimate_quarterly_tax", { annualIncome, filingStatus, withholding }),
};

// ============================================================================
// Tax Return Commands
// ============================================================================

export const returns = {
  /** Create a new tax return */
  create: (taxYear: number, filingStatus: string): Promise<TaxReturn> =>
    invoke("create_tax_return", { taxYear, filingStatus }),
  
  /** Get a tax return by ID */
  get: (id: string): Promise<TaxReturn | null> => invoke("get_tax_return", { id }),
  
  /** List all tax returns */
  list: (): Promise<TaxReturn[]> => invoke("list_tax_returns"),
  
  /** Update a tax return */
  update: (
    id: string,
    grossIncome?: number,
    totalDeductions?: number,
    status?: string
  ): Promise<TaxReturn> =>
    invoke("update_tax_return", { id, grossIncome, totalDeductions, status }),
  
  /** Delete a tax return */
  delete: (id: string): Promise<boolean> => invoke("delete_tax_return", { id }),
};

// ============================================================================
// Deduction Commands
// ============================================================================

export const deductions = {
  /** Add a deduction */
  add: (
    category: string,
    description: string,
    amount: number,
    isItemized: boolean,
    taxReturnId?: string
  ): Promise<Deduction> =>
    invoke("add_deduction", { category, description, amount, isItemized, taxReturnId }),
  
  /** Get deductions for a tax return */
  getForReturn: (taxReturnId: string): Promise<Deduction[]> =>
    invoke("get_deductions_for_return", { taxReturnId }),
  
  /** Get all deductions */
  getAll: (): Promise<Deduction[]> => invoke("get_all_deductions"),
  
  /** Update a deduction */
  update: (
    id: string,
    category?: string,
    description?: string,
    amount?: number
  ): Promise<Deduction> => invoke("update_deduction", { id, category, description, amount }),
  
  /** Delete a deduction */
  delete: (id: string): Promise<boolean> => invoke("delete_deduction", { id }),
  
  /** Get deduction categories */
  getCategories: (): Promise<string[]> => invoke("get_deduction_categories"),
};

// ============================================================================
// Document Commands
// ============================================================================

export const documents = {
  /** Upload a document */
  upload: (name: string, filePath: string, documentType: string, taxYear?: number): Promise<Document> =>
    invoke("upload_document", { name, filePath, documentType, taxYear }),
  
  /** Get a document by ID */
  get: (id: string): Promise<Document | null> => invoke("get_document", { id }),
  
  /** List all documents */
  list: (): Promise<Document[]> => invoke("list_documents"),
  
  /** Delete a document */
  delete: (id: string): Promise<boolean> => invoke("delete_document", { id }),
  
  /** Extract data from document (OCR) */
  extractData: (id: string): Promise<string> => invoke("extract_document_data", { id }),
};

// ============================================================================
// AI Chat Commands
// ============================================================================

export const ai = {
  /** Send a message to the AI assistant */
  sendMessage: (message: string, context?: ChatContext): Promise<ChatResponse> =>
    invoke("send_message", { request: { message, context } }),
  
  /** Get chat history */
  getHistory: (limit?: number): Promise<ChatResponse[]> => invoke("get_chat_history", { limit }),
  
  /** Clear chat history */
  clearHistory: (): Promise<boolean> => invoke("clear_chat_history"),
  
  /** Analyze an IRS audit notice */
  analyzeAudit: (
    noticeText: string,
    taxYear: number,
    issueType?: string
  ): Promise<AuditAnalysisResponse> =>
    invoke("analyze_audit_notice", { request: { noticeText, taxYear, issueType } }),
  
  /** Get general tax advice */
  getTaxAdvice: (question: string, context?: ChatContext): Promise<TaxAdviceResponse> =>
    invoke("get_tax_advice", { question, context }),
};

// ============================================================================
// Settings Commands
// ============================================================================

export const settings = {
  /** Get a setting value */
  get: (key: string): Promise<string | null> => invoke("get_setting", { key }),
  
  /** Set a setting value */
  set: (key: string, value: string): Promise<boolean> => invoke("set_setting", { key, value }),
  
  /** Get all settings */
  getAll: (): Promise<Record<string, string>> => invoke("get_all_settings"),
  
  /** Save API key */
  saveApiKey: (apiKey: string): Promise<boolean> => invoke("save_api_key", { apiKey }),
  
  /** Check if API key is configured */
  hasApiKey: (): Promise<boolean> => invoke("has_api_key"),
};

// ============================================================================
// Utility functions
// ============================================================================

/** Format currency for display */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Format percentage for display */
export function formatPercent(rate: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(rate);
}

/** Format date for display */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export const FILING_STATUSES = [
  { value: "single", label: "Single" },
  { value: "married_filing_jointly", label: "Married Filing Jointly" },
  { value: "married_filing_separately", label: "Married Filing Separately" },
  { value: "head_of_household", label: "Head of Household" },
  { value: "qualifying_widow", label: "Qualifying Widow(er)" },
] as const;

export const TAX_YEARS = [2024, 2023, 2022, 2021, 2020] as const;
