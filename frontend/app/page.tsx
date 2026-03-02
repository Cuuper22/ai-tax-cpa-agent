'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
      {/* Nav */}
      <nav style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-semibold" style={{ color: 'var(--color-accent)' }}>
              {'>'}_
            </span>
            <span className="font-semibold" style={{ color: 'var(--color-text-heading)' }}>
              AI Tax CPA Agent
            </span>
          </div>
          <div className="flex gap-6 text-sm">
            <Link href="/tax-prep" className="transition-colors duration-200" style={{ color: 'var(--color-text-secondary)' }}
              onMouseEnter={e => (e.target as HTMLElement).style.color = 'var(--color-text-heading)'}
              onMouseLeave={e => (e.target as HTMLElement).style.color = 'var(--color-text-secondary)'}>
              Tax Prep
            </Link>
            <Link href="/audit-defense" className="transition-colors duration-200" style={{ color: 'var(--color-text-secondary)' }}
              onMouseEnter={e => (e.target as HTMLElement).style.color = 'var(--color-text-heading)'}
              onMouseLeave={e => (e.target as HTMLElement).style.color = 'var(--color-text-secondary)'}>
              Audit Defense
            </Link>
            <Link href="/voice-call" className="transition-colors duration-200" style={{ color: 'var(--color-text-secondary)' }}
              onMouseEnter={e => (e.target as HTMLElement).style.color = 'var(--color-text-heading)'}
              onMouseLeave={e => (e.target as HTMLElement).style.color = 'var(--color-text-secondary)'}>
              Voice
            </Link>
            <Link href="/benchmark" className="transition-colors duration-200" style={{ color: 'var(--color-text-secondary)' }}
              onMouseEnter={e => (e.target as HTMLElement).style.color = 'var(--color-text-heading)'}
              onMouseLeave={e => (e.target as HTMLElement).style.color = 'var(--color-text-secondary)'}>
              Benchmark
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Header — left-aligned, not centered */}
        <div className="mb-16 max-w-2xl">
          <p className="text-xs font-mono mb-4" style={{ color: 'var(--color-accent)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Deterministic tax math + AI judgment
          </p>
          <h1 className="text-5xl font-semibold mb-6" style={{ color: 'var(--color-text-heading)', letterSpacing: '-0.025em', lineHeight: '1.1' }}>
            The math is the math.<br />
            <span style={{ color: 'var(--color-text-secondary)' }}>The AI handles the rest.</span>
          </h1>
          <p className="text-base leading-relaxed mb-8" style={{ color: 'var(--color-text-secondary)' }}>
            Real 2024 IRS brackets with <code className="font-mono text-sm px-1.5 py-0.5" style={{ background: 'var(--color-bg-elevated)', borderRadius: '4px', color: 'var(--color-accent-secondary)' }}>Decimal</code> precision.
            No language model touches the arithmetic. Claude handles document analysis, audit defense, and the conversations where judgment matters.
          </p>
          <div className="flex gap-3">
            <Link href="/tax-prep" className="btn-primary text-sm">
              Calculate taxes
            </Link>
            <Link href="/audit-defense" className="btn-ghost text-sm">
              Audit defense
            </Link>
          </div>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-3 gap-3 mb-16">
          {/* Feature cards */}
          <Link href="/tax-prep" className="card p-5 group transition-colors duration-200 hover:border-[oklch(0.35_0.012_270)]">
            <div className="flex items-center justify-between mb-3">
              <span className="label">Tax Engine</span>
              <span className="badge badge-real">Real</span>
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-heading)' }}>
              Form 1040 & 1120
            </h3>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Progressive brackets, all 4 filing statuses, standard + itemized deductions, TCJA corporate 21%.
            </p>
          </Link>

          <Link href="/audit-defense" className="card p-5 group transition-colors duration-200 hover:border-[oklch(0.35_0.012_270)]">
            <div className="flex items-center justify-between mb-3">
              <span className="label">Claude</span>
              <span className="badge badge-ai">AI</span>
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-heading)' }}>
              Audit Defense
            </h3>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Response strategies with specific IRC section citations. Analyzes notices, researches tax law, drafts professional letters.
            </p>
          </Link>

          <Link href="/voice-call" className="card p-5 group transition-colors duration-200 hover:border-[oklch(0.35_0.012_270)]">
            <div className="flex items-center justify-between mb-3">
              <span className="label">Claude</span>
              <span className="badge badge-ai">AI</span>
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-heading)' }}>
              CPA Voice Chat
            </h3>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Text-based CPA conversation with persistent session history. Natural back-and-forth about deductions, filing strategies.
            </p>
          </Link>

          {/* Wide card — architecture boundary */}
          <div className="card p-5 col-span-2">
            <span className="label mb-3 block">Architecture</span>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3" style={{ background: 'var(--color-bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                <p className="text-xs font-mono mb-2" style={{ color: 'var(--color-success)' }}>DETERMINISTIC</p>
                <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                  Tax Calculator &middot; Decimal precision &middot; 42 tests &middot; Progressive brackets &middot; No AI in the loop
                </p>
              </div>
              <div className="p-3" style={{ background: 'var(--color-bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                <p className="text-xs font-mono mb-2" style={{ color: 'var(--color-accent)' }}>AI JUDGMENT</p>
                <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                  Document Agent &middot; Audit Agent &middot; Tax Prep Agent &middot; Voice Agent &middot; Claude API
                </p>
              </div>
            </div>
            <p className="text-xs mt-3" style={{ color: 'var(--color-text-secondary)' }}>
              The tax engine never calls Claude. The agents never do arithmetic. The boundary is architectural, not conventional.
            </p>
          </div>

          {/* Document analysis card */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="label">Claude Vision</span>
              <span className="badge badge-ai">AI</span>
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-heading)' }}>
              Document Analysis
            </h3>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              W-2 image reading, 1099 extraction, structured data from scanned tax documents.
            </p>
          </div>
        </div>

        {/* Stack info — compact, monospaced */}
        <div className="card p-5 mb-16">
          <span className="label mb-3 block">Stack</span>
          <div className="font-mono text-sm flex flex-wrap gap-x-6 gap-y-1" style={{ color: 'var(--color-text-secondary)' }}>
            <span>FastAPI + Uvicorn</span>
            <span style={{ color: 'var(--color-border)' }}>|</span>
            <span>Python <span style={{ color: 'var(--color-accent-secondary)' }}>Decimal</span> tax engine</span>
            <span style={{ color: 'var(--color-border)' }}>|</span>
            <span>Anthropic Claude</span>
            <span style={{ color: 'var(--color-border)' }}>|</span>
            <span>Next.js + Tailwind</span>
            <span style={{ color: 'var(--color-border)' }}>|</span>
            <span>IRS 2024 brackets</span>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-xs pb-8" style={{ color: 'var(--color-text-secondary)' }}>
          Not tax advice. 42 tests verify the deterministic engine. MIT License.
        </footer>
      </div>
    </div>
  )
}
