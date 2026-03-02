'use client'

import { useState } from 'react'
import Link from 'next/link'

interface AuditResult {
  strategy?: string
  risk_level?: string
  risk_assessment?: string
  recommended_actions?: string[]
  irc_citations?: string[]
  response_letter?: string
  [key: string]: unknown
}

export default function AuditDefensePage() {
  const [notice, setNotice] = useState('')
  const [result, setResult] = useState<AuditResult | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const analyzeAudit = async () => {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('http://localhost:8000/api/audit/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notice_text: notice,
          client_documents: {},
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.detail || 'Analysis failed')
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
            <Link href="/tax-prep" style={{ color: 'var(--color-text-secondary)' }}>Tax Prep</Link>
            <span className="font-medium" style={{ color: 'var(--color-text-heading)' }}>Audit Defense</span>
            <Link href="/voice-call" style={{ color: 'var(--color-text-secondary)' }}>Voice</Link>
            <Link href="/benchmark" style={{ color: 'var(--color-text-secondary)' }}>Benchmark</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="label">Claude</span>
            <span className="badge badge-ai">AI</span>
          </div>
          <h1 className="text-3xl font-semibold" style={{ color: 'var(--color-text-heading)' }}>
            Audit Defense
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
            Paste an IRS notice. Claude analyzes the issue, researches IRC sections, and drafts a response strategy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Input */}
          <div className="card p-5">
            <h2 className="label mb-4">Audit Notice</h2>
            <textarea
              value={notice}
              onChange={e => setNotice(e.target.value)}
              className="input w-full text-sm"
              style={{ minHeight: '240px', resize: 'vertical' }}
              placeholder="The IRS is questioning the home office deduction claimed on your 2023 return. Notice CP2000 indicates a discrepancy between reported income and..."
            />
            <button
              onClick={analyzeAudit}
              disabled={loading || notice.length < 10}
              className="btn-primary w-full text-sm mt-3"
            >
              {loading ? 'Analyzing...' : 'Analyze Notice'}
            </button>
            {error && (
              <p className="text-xs font-mono mt-2" style={{ color: 'var(--color-error)' }}>{error}</p>
            )}

            {/* Requires API key notice */}
            <p className="text-xs mt-3" style={{ color: 'var(--color-text-secondary)', opacity: 0.6 }}>
              Requires ANTHROPIC_API_KEY on the backend
            </p>
          </div>

          {/* Result */}
          <div className="card p-5">
            <h2 className="label mb-4">Analysis</h2>

            {!result && !loading && (
              <div className="flex items-center justify-center" style={{ minHeight: '240px' }}>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)', opacity: 0.5 }}>
                  Paste a notice and click Analyze
                </p>
              </div>
            )}

            {loading && (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-3 rounded" style={{ background: 'var(--color-bg-elevated)', width: `${90 - i * 10}%` }} />
                ))}
                <p className="text-xs mt-4" style={{ color: 'var(--color-text-secondary)' }}>
                  Claude is analyzing the notice and researching relevant tax law...
                </p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                {/* Strategy */}
                {result.strategy && (
                  <div className="p-3" style={{ background: 'var(--color-bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                    <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--color-accent)' }}>STRATEGY</p>
                    <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{result.strategy}</p>
                  </div>
                )}

                {/* Risk */}
                {(result.risk_level || result.risk_assessment) && (
                  <div className="p-3" style={{ background: 'var(--color-bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                    <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--color-warning)' }}>RISK ASSESSMENT</p>
                    <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                      {result.risk_level && <span className="font-mono font-medium">{result.risk_level}</span>}
                      {result.risk_assessment && <span> — {result.risk_assessment}</span>}
                    </p>
                  </div>
                )}

                {/* IRC Citations */}
                {result.irc_citations && result.irc_citations.length > 0 && (
                  <div className="p-3" style={{ background: 'var(--color-bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                    <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--color-accent-secondary)' }}>IRC CITATIONS</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.irc_citations.map((cite, i) => (
                        <span key={i} className="text-xs font-mono px-2 py-0.5" style={{
                          background: 'var(--color-bg-elevated)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--color-accent-secondary)',
                        }}>
                          {cite}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended Actions */}
                {result.recommended_actions && result.recommended_actions.length > 0 && (
                  <div className="p-3" style={{ background: 'var(--color-bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                    <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--color-success)' }}>RECOMMENDED ACTIONS</p>
                    <ul className="space-y-1">
                      {result.recommended_actions.map((action, i) => (
                        <li key={i} className="text-sm flex gap-2" style={{ color: 'var(--color-text-primary)' }}>
                          <span className="font-mono text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{i + 1}.</span>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Response Letter */}
                {result.response_letter && (
                  <div className="p-3" style={{ background: 'var(--color-bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                    <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>DRAFT RESPONSE</p>
                    <pre className="text-xs font-mono whitespace-pre-wrap" style={{ color: 'var(--color-text-primary)' }}>
                      {result.response_letter}
                    </pre>
                  </div>
                )}

                {/* Raw fallback if structured fields aren't present */}
                {!result.strategy && !result.risk_level && !result.irc_citations && (
                  <pre className="text-xs font-mono whitespace-pre-wrap p-3" style={{
                    background: 'var(--color-bg-primary)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}>
                    {JSON.stringify(result, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>

        <footer className="text-xs mt-8 pb-6" style={{ color: 'var(--color-text-secondary)' }}>
          Not legal or tax advice. AI-generated analysis — consult a licensed CPA for actual audit representation.
        </footer>
      </div>
    </div>
  )
}
