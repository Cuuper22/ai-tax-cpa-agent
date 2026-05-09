'use client'

import Link from 'next/link'

const SCENARIOS = [
  {
    category: 'Tax Preparation',
    items: [
      { scenario: 'Single filer, $75K income', engine: 'Deterministic', accuracy: 'Exact', notes: 'Progressive brackets, standard deduction' },
      { scenario: 'MFJ, $150K + itemized', engine: 'Deterministic', accuracy: 'Exact', notes: 'Compares standard vs. itemized' },
      { scenario: 'Head of household, $45K', engine: 'Deterministic', accuracy: 'Exact', notes: 'HoH-specific brackets + deduction' },
      { scenario: 'C-Corp, $500K net income', engine: 'Deterministic', accuracy: 'Exact', notes: 'TCJA 21% flat rate' },
    ],
  },
  {
    category: 'Document Analysis',
    items: [
      { scenario: 'W-2 image extraction', engine: 'Claude Vision', accuracy: 'AI', notes: 'Structured data from scanned forms' },
      { scenario: '1099-NEC text extraction', engine: 'Claude', accuracy: 'AI', notes: 'Multi-field extraction' },
    ],
  },
  {
    category: 'Audit Defense',
    items: [
      { scenario: 'CP2000 income mismatch', engine: 'Claude', accuracy: 'AI', notes: 'Generates defense with IRC citations' },
      { scenario: 'Home office deduction challenge', engine: 'Claude', accuracy: 'AI', notes: 'IRC §280A analysis' },
      { scenario: 'Business expense substantiation', engine: 'Claude', accuracy: 'AI', notes: 'Cohan rule + documentation guidance' },
    ],
  },
  {
    category: 'Research & Conversation',
    items: [
      { scenario: 'Filing status comparison', engine: 'Claude', accuracy: 'AI', notes: 'Explains trade-offs, cites code sections' },
      { scenario: 'Deduction eligibility', engine: 'Claude', accuracy: 'AI', notes: 'Tests + schedules + phase-outs' },
    ],
  },
]

export default function BenchmarkPage() {
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
            <Link href="/audit-defense" style={{ color: 'var(--color-text-secondary)' }}>Audit Defense</Link>
            <Link href="/voice-call" style={{ color: 'var(--color-text-secondary)' }}>Voice</Link>
            <span className="font-medium" style={{ color: 'var(--color-text-heading)' }}>Benchmark</span>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <span className="label mb-2 block">Benchmark</span>
          <h1 className="text-3xl font-semibold" style={{ color: 'var(--color-text-heading)' }}>
            Coverage & Scenarios
          </h1>
          <p className="text-sm mt-2 max-w-xl" style={{ color: 'var(--color-text-secondary)' }}>
            What the system handles, and which layer handles it. Deterministic = tested, Decimal, exact.
            AI = Claude API, judgment calls, variable output.
          </p>
        </div>

        <div className="space-y-6">
          {SCENARIOS.map((group, gi) => (
            <div key={gi} className="card overflow-hidden">
              <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <h2 className="label">{group.category}</h2>
              </div>
              <div>
                {group.items.map((item, i) => (
                  <div
                    key={i}
                    className="px-5 py-3 grid grid-cols-12 gap-3 items-center text-sm"
                    style={{
                      borderBottom: i < group.items.length - 1 ? '1px solid var(--color-border)' : undefined,
                    }}
                  >
                    <div className="col-span-4" style={{ color: 'var(--color-text-primary)' }}>
                      {item.scenario}
                    </div>
                    <div className="col-span-2">
                      <span className={`badge ${item.accuracy === 'Exact' ? 'badge-real' : 'badge-ai'}`}>
                        {item.accuracy === 'Exact' ? 'Deterministic' : 'AI'}
                      </span>
                    </div>
                    <div className="col-span-2 font-mono text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      {item.engine}
                    </div>
                    <div className="col-span-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      {item.notes}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Test counts */}
        <div className="card p-5 mt-6">
          <h2 className="label mb-3">Test Coverage</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3" style={{ background: 'var(--color-bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
              <p className="font-mono text-2xl font-semibold" style={{ color: 'var(--color-success)' }}>42</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>Total tests</p>
            </div>
            <div className="p-3" style={{ background: 'var(--color-bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
              <p className="font-mono text-2xl font-semibold" style={{ color: 'var(--color-text-heading)' }}>17</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>Tax engine tests</p>
            </div>
            <div className="p-3" style={{ background: 'var(--color-bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
              <p className="font-mono text-2xl font-semibold" style={{ color: 'var(--color-text-heading)' }}>17</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>API endpoint tests</p>
            </div>
          </div>
          <p className="text-xs mt-3" style={{ color: 'var(--color-text-secondary)' }}>
            Tests cover the deterministic engine and API layer only. AI agent quality is not unit-tested here; the
            benchmarking service is a harness for recording AI and human results side by side.
          </p>
        </div>

        <footer className="text-xs mt-8 pb-6" style={{ color: 'var(--color-text-secondary)' }}>
          Not tax advice. 42 tests verify the deterministic engine. AI outputs are variable by nature.
        </footer>
      </div>
    </div>
  )
}
