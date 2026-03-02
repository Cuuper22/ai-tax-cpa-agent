'use client'

import { useState } from 'react'
import Link from 'next/link'

type FilingStatus = 'single' | 'married_joint' | 'married_separate' | 'head_of_household'

interface BracketDetail {
  rate: number
  income_in_bracket: number
  tax_in_bracket: number
}

interface TaxResult {
  entity_type: string
  tax_year: number
  filing_status: string
  gross_income: number
  deduction_type: string
  deduction_amount: number
  taxable_income: number
  tax_liability: number
  effective_tax_rate: number
  bracket_breakdown: BracketDetail[]
  disclaimer: string
}

const FILING_STATUSES: { value: FilingStatus; label: string }[] = [
  { value: 'single', label: 'Single' },
  { value: 'married_joint', label: 'Married Filing Jointly' },
  { value: 'married_separate', label: 'Married Filing Separately' },
  { value: 'head_of_household', label: 'Head of Household' },
]

const ENTITY_TYPES = [
  { value: '1040', label: 'Individual (Form 1040)' },
  { value: '1120', label: 'Corporate (Form 1120)' },
]

function formatCurrency(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
}

export default function TaxPrepPage() {
  const [entityType, setEntityType] = useState('1040')
  const [filingStatus, setFilingStatus] = useState<FilingStatus>('single')
  const [income, setIncome] = useState('')
  const [itemized, setItemized] = useState('')
  const [result, setResult] = useState<TaxResult | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const calculateTax = async () => {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const body: Record<string, unknown> = {
        entity_type: entityType,
        gross_income: parseFloat(income),
        filing_status: filingStatus,
      }
      if (itemized.trim()) {
        body.itemized_deductions = parseFloat(itemized)
      }
      const res = await fetch('http://localhost:8000/api/tax/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.detail || 'Calculation failed')
      } else {
        setResult(json.data)
      }
    } catch {
      setError('Could not reach the backend. Is it running on :8000?')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
      {/* Nav */}
      <nav style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="max-w-5xl mx-auto px-6 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <span className="font-mono text-sm font-semibold" style={{ color: 'var(--color-accent)' }}>
              {'>'}_
            </span>
            <span className="font-semibold" style={{ color: 'var(--color-text-heading)' }}>
              AI Tax CPA Agent
            </span>
          </Link>
          <div className="flex gap-6 text-sm">
            <span className="font-medium" style={{ color: 'var(--color-text-heading)' }}>Tax Prep</span>
            <Link href="/audit-defense" style={{ color: 'var(--color-text-secondary)' }}>Audit Defense</Link>
            <Link href="/voice-call" style={{ color: 'var(--color-text-secondary)' }}>Voice</Link>
            <Link href="/benchmark" style={{ color: 'var(--color-text-secondary)' }}>Benchmark</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="label">Tax Engine</span>
            <span className="badge badge-real">Real</span>
          </div>
          <h1 className="text-3xl font-semibold" style={{ color: 'var(--color-text-heading)' }}>
            Federal Tax Calculator
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
            2024 IRS brackets &middot; Decimal precision &middot; No AI in the loop
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Input */}
          <div className="card p-5">
            <h2 className="label mb-4">Input</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Entity Type</label>
                <select
                  value={entityType}
                  onChange={e => setEntityType(e.target.value)}
                  className="input w-full text-sm"
                >
                  {ENTITY_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {entityType === '1040' && (
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Filing Status</label>
                  <select
                    value={filingStatus}
                    onChange={e => setFilingStatus(e.target.value as FilingStatus)}
                    className="input w-full text-sm"
                  >
                    {FILING_STATUSES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Gross Income</label>
                <input
                  type="number"
                  min="0"
                  value={income}
                  onChange={e => setIncome(e.target.value)}
                  placeholder="75000"
                  className="input w-full text-sm font-mono"
                />
              </div>

              {entityType === '1040' && (
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                    Itemized Deductions <span style={{ color: 'var(--color-text-secondary)', opacity: 0.6 }}>(optional)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={itemized}
                    onChange={e => setItemized(e.target.value)}
                    placeholder="Leave blank for standard deduction"
                    className="input w-full text-sm font-mono"
                  />
                </div>
              )}

              <button
                onClick={calculateTax}
                disabled={loading || !income}
                className="btn-primary w-full text-sm mt-2"
              >
                {loading ? 'Calculating...' : 'Calculate'}
              </button>

              {error && (
                <p className="text-xs font-mono" style={{ color: 'var(--color-error)' }}>{error}</p>
              )}
            </div>
          </div>

          {/* Result */}
          <div className="card p-5">
            <h2 className="label mb-4">Result</h2>

            {!result && !loading && (
              <div className="flex items-center justify-center h-48">
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)', opacity: 0.5 }}>
                  Enter income and click Calculate
                </p>
              </div>
            )}

            {loading && (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-4 rounded" style={{ background: 'var(--color-bg-elevated)', width: `${80 - i * 15}%` }} />
                ))}
              </div>
            )}

            {result && (
              <div className="space-y-4">
                {/* Summary row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3" style={{ background: 'var(--color-bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Tax Liability</p>
                    <p className="text-lg font-mono font-semibold" style={{ color: 'var(--color-text-heading)' }}>
                      {formatCurrency(result.tax_liability)}
                    </p>
                  </div>
                  <div className="p-3" style={{ background: 'var(--color-bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Effective Rate</p>
                    <p className="text-lg font-mono font-semibold" style={{ color: 'var(--color-accent-secondary)' }}>
                      {result.effective_tax_rate}%
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-sm font-mono">
                  <div className="flex justify-between" style={{ color: 'var(--color-text-secondary)' }}>
                    <span>Gross Income</span>
                    <span style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(result.gross_income)}</span>
                  </div>
                  <div className="flex justify-between" style={{ color: 'var(--color-text-secondary)' }}>
                    <span>{result.deduction_type} Deduction</span>
                    <span style={{ color: 'var(--color-text-primary)' }}>-{formatCurrency(result.deduction_amount)}</span>
                  </div>
                  <div className="h-px my-1" style={{ background: 'var(--color-border)' }} />
                  <div className="flex justify-between" style={{ color: 'var(--color-text-secondary)' }}>
                    <span>Taxable Income</span>
                    <span style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(result.taxable_income)}</span>
                  </div>
                </div>

                {/* Bracket breakdown */}
                {result.bracket_breakdown && result.bracket_breakdown.length > 0 && (
                  <div>
                    <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>BRACKET BREAKDOWN</p>
                    <div className="space-y-1">
                      {result.bracket_breakdown.map((b, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs font-mono">
                          <span className="w-10 text-right" style={{ color: 'var(--color-accent)' }}>{b.rate}%</span>
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-bg-primary)' }}>
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(100, (b.income_in_bracket / result.taxable_income) * 100)}%`,
                                background: 'var(--color-accent)',
                                opacity: 0.3 + (i * 0.15),
                              }}
                            />
                          </div>
                          <span className="w-24 text-right" style={{ color: 'var(--color-text-primary)' }}>
                            {formatCurrency(b.tax_in_bracket)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Filing info */}
                <div className="flex gap-2 flex-wrap text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  <span className="font-mono">{result.entity_type}</span>
                  <span style={{ color: 'var(--color-border)' }}>|</span>
                  <span>{result.tax_year}</span>
                  <span style={{ color: 'var(--color-border)' }}>|</span>
                  <span>{result.filing_status.replace('_', ' ')}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="text-xs mt-8 pb-6" style={{ color: 'var(--color-text-secondary)' }}>
          Not tax advice. Deterministic engine — no AI in this calculation. IRS 2024 brackets.
        </footer>
      </div>
    </div>
  )
}
