'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export default function VoiceCallPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMsg = input.trim()
    setInput('')
    setError('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    try {
      const res = await fetch('http://localhost:8000/api/voice/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          session_id: sessionId,
          context: {},
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.detail || 'Request failed')
      } else {
        if (json.session_id) setSessionId(json.session_id)
        const reply = json.data?.response || json.data?.message || JSON.stringify(json.data)
        setMessages(prev => [...prev, { role: 'assistant', content: reply }])
      }
    } catch {
      setError('Could not reach the backend. Is it running on :8000?')
    }
    setLoading(false)
  }

  const clearSession = () => {
    setMessages([])
    setSessionId(null)
    setError('')
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg-primary)' }}>
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
            <span className="font-medium" style={{ color: 'var(--color-text-heading)' }}>Voice</span>
            <Link href="/benchmark" style={{ color: 'var(--color-text-secondary)' }}>Benchmark</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10 flex-1 flex flex-col w-full">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="label">Claude</span>
                <span className="badge badge-ai">AI</span>
              </div>
              <h1 className="text-3xl font-semibold" style={{ color: 'var(--color-text-heading)' }}>
                CPA Chat
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                Text-based conversation with persistent session history
              </p>
            </div>
            {messages.length > 0 && (
              <button onClick={clearSession} className="btn-ghost text-xs">
                Clear session
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto mb-4 space-y-3"
          style={{ minHeight: '300px', maxHeight: 'calc(100vh - 320px)' }}
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-16">
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)', opacity: 0.5 }}>
                Ask about deductions, filing strategies, or tax law
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  'Can I deduct my home office?',
                  'What\'s the difference between 1040 and 1120?',
                  'How do quarterly estimates work?',
                ].map((q, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(q) }}
                    className="text-xs px-3 py-1.5"
                    style={{
                      background: 'var(--color-bg-secondary)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--color-text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex-shrink-0 w-6 text-right">
                <span className="text-xs font-mono" style={{
                  color: msg.role === 'user' ? 'var(--color-text-secondary)' : 'var(--color-accent)',
                }}>
                  {msg.role === 'user' ? 'you' : 'cpa'}
                </span>
              </div>
              <div className="flex-1 text-sm" style={{ color: 'var(--color-text-primary)' }}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 text-right">
                <span className="text-xs font-mono" style={{ color: 'var(--color-accent)' }}>cpa</span>
              </div>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-accent)', opacity: 0.4 }} />
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-accent)', opacity: 0.3 }} />
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-accent)', opacity: 0.2 }} />
              </div>
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs font-mono mb-2" style={{ color: 'var(--color-error)' }}>{error}</p>
        )}

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            className="input flex-1 text-sm"
            placeholder="Ask a tax question..."
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="btn-primary text-sm px-5"
          >
            Send
          </button>
        </div>

        <div className="flex justify-between items-center mt-3">
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)', opacity: 0.5 }}>
            Requires ANTHROPIC_API_KEY
          </p>
          {sessionId && (
            <p className="text-xs font-mono" style={{ color: 'var(--color-text-secondary)', opacity: 0.4 }}>
              session: {sessionId.slice(0, 8)}...
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
