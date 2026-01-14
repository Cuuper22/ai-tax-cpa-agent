import { useState } from "react";
import { motion } from "framer-motion";
import { Calculator, DollarSign } from "lucide-react";
import {
  tax,
  formatCurrency,
  formatPercent,
  FILING_STATUSES,
  TAX_YEARS,
  type TaxCalculationResponse,
} from "@/lib/tauri";

export default function TaxCalculator() {
  const [grossIncome, setGrossIncome] = useState("");
  const [filingStatus, setFilingStatus] = useState("single");
  const [deductions, setDeductions] = useState("");
  const [credits, setCredits] = useState("");
  const [state, setState] = useState("");
  const [taxYear, setTaxYear] = useState(2024);
  const [result, setResult] = useState<TaxCalculationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = async () => {
    if (!grossIncome) {
      setError("Please enter your gross income");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await tax.calculateFederal({
        gross_income: parseFloat(grossIncome),
        filing_status: filingStatus,
        deductions: deductions ? parseFloat(deductions) : undefined,
        credits: credits ? parseFloat(credits) : undefined,
        state: state || undefined,
        tax_year: taxYear,
      });
      setResult(response);
    } catch (e) {
      setError(String(e));
    } finally {
      setIsLoading(false);
    }
  };

  const states = [
    "", "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC"
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tax Calculator</h1>
        <p className="text-gray-500 mt-1">Estimate your federal and state income taxes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Income Information</h2>

          <div className="space-y-4">
            {/* Tax Year */}
            <div>
              <label className="label">Tax Year</label>
              <select
                value={taxYear}
                onChange={(e) => setTaxYear(parseInt(e.target.value))}
                className="input"
              >
                {TAX_YEARS.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Gross Income */}
            <div>
              <label className="label">Gross Income</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  value={grossIncome}
                  onChange={(e) => setGrossIncome(e.target.value)}
                  placeholder="0.00"
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Filing Status */}
            <div>
              <label className="label">Filing Status</label>
              <select
                value={filingStatus}
                onChange={(e) => setFilingStatus(e.target.value)}
                className="input"
              >
                {FILING_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Itemized Deductions */}
            <div>
              <label className="label">Itemized Deductions (optional)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  value={deductions}
                  onChange={(e) => setDeductions(e.target.value)}
                  placeholder="Leave blank to use standard deduction"
                  className="input pl-10"
                />
              </div>
              <p className="helper-text">
                Standard deduction will be used if this is lower or blank
              </p>
            </div>

            {/* Tax Credits */}
            <div>
              <label className="label">Tax Credits (optional)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  value={credits}
                  onChange={(e) => setCredits(e.target.value)}
                  placeholder="0.00"
                  className="input pl-10"
                />
              </div>
            </div>

            {/* State */}
            <div>
              <label className="label">State (optional)</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="input"
              >
                <option value="">No state tax</option>
                {states.filter(s => s).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Calculate Button */}
            <button
              onClick={handleCalculate}
              disabled={isLoading}
              className="btn btn-primary w-full"
            >
              {isLoading ? (
                <div className="spinner spinner-sm" />
              ) : (
                <>
                  <Calculator className="w-5 h-5" />
                  Calculate Tax
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Results */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          {result ? (
            <>
              {/* Summary Card */}
              <div className="card p-6 bg-gradient-to-br from-primary-600 to-primary-700 text-white">
                <h3 className="text-lg font-medium opacity-90">Total Tax Liability</h3>
                <p className="text-4xl font-bold mt-2">{formatCurrency(result.total_tax)}</p>
                <div className="flex gap-6 mt-4">
                  <div>
                    <p className="text-sm opacity-75">Effective Rate</p>
                    <p className="text-lg font-semibold">{formatPercent(result.effective_rate)}</p>
                  </div>
                  <div>
                    <p className="text-sm opacity-75">Marginal Rate</p>
                    <p className="text-lg font-semibold">{formatPercent(result.marginal_rate)}</p>
                  </div>
                </div>
              </div>

              {/* Breakdown */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tax Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Gross Income</span>
                    <span className="font-medium">{formatCurrency(result.gross_income)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Standard Deduction</span>
                    <span className="font-medium text-success-600">
                      -{formatCurrency(result.standard_deduction)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Total Deductions Used</span>
                    <span className="font-medium text-success-600">
                      -{formatCurrency(result.total_deductions)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Taxable Income</span>
                    <span className="font-bold">{formatCurrency(result.taxable_income)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Federal Tax</span>
                    <span className="font-medium">{formatCurrency(result.federal_tax)}</span>
                  </div>
                  {result.state_tax > 0 && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">State Tax</span>
                      <span className="font-medium">{formatCurrency(result.state_tax)}</span>
                    </div>
                  )}
                  {result.tax_credits > 0 && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Tax Credits</span>
                      <span className="font-medium text-success-600">
                        -{formatCurrency(result.tax_credits)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 font-bold text-lg">
                    <span>Total Tax</span>
                    <span>{formatCurrency(result.total_tax)}</span>
                  </div>
                </div>
              </div>

              {/* Bracket Breakdown */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tax Brackets Applied</h3>
                <div className="space-y-2">
                  {result.breakdown.map((bracket, index) => (
                    <div key={index} className="flex items-center gap-4 py-2">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">
                            {formatPercent(bracket.rate)} bracket
                          </span>
                          <span className="font-medium">
                            {formatCurrency(bracket.tax_from_bracket)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((bracket.taxable_in_bracket / result.taxable_income) * 100, 100)}%` }}
                            className="bg-primary-600 h-2 rounded-full"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatCurrency(bracket.taxable_in_bracket)} taxed at {formatPercent(bracket.rate)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="card p-12 text-center">
              <Calculator className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                Enter your income information and click Calculate to see your tax breakdown
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
