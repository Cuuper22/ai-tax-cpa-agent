'use client'

import { useState } from 'react'

export default function AuditDefensePage() {
  const [notice, setNotice] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const analyzeAudit = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8000/api/audit/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notice_text: notice,
          client_documents: {
            w2_forms: [],
            bank_statements: [],
            receipts: []
          },
          client_id: 'demo_client'
        })
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Error:', error)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">IRS Audit Defense</h1>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Audit Notice</h2>
            <p className="text-sm text-gray-600 mb-4">
              Paste the IRS audit notice or describe the audit issue
            </p>
            <textarea
              value={notice}
              onChange={(e) => setNotice(e.target.value)}
              className="w-full h-64 p-3 border rounded-lg"
              placeholder="Example: The IRS is questioning the home office deduction claimed on your 2023 return..."
            />
            <button
              onClick={analyzeAudit}
              disabled={loading || !notice}
              className="w-full mt-4 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Analyzing...' : 'Analyze & Generate Strategy'}
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">AI Analysis</h2>
            {loading && (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            )}
            {result && !loading && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold mb-2">Defense Strategy</h3>
                  <p className="text-sm">{result.analysis?.strategy || 'Strategy generated'}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold mb-2">Risk Assessment</h3>
                  <p className="text-sm">Risk Level: {result.analysis?.risk_level || 'Medium'}</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h3 className="font-semibold mb-2">Recommended Actions</h3>
                  <ul className="text-sm list-disc list-inside">
                    <li>Gather supporting documentation</li>
                    <li>Prepare response letter</li>
                    <li>Schedule consultation with IRS</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-indigo-600 text-white rounded-lg p-6">
          <h3 className="text-2xl font-bold mb-4">How AI Handles Audits</h3>
          <ul className="space-y-2">
            <li>✓ Analyzes IRS notice in seconds</li>
            <li>✓ Identifies key issues and exposure</li>
            <li>✓ Researches relevant tax code and case law</li>
            <li>✓ Generates professional response letters</li>
            <li>✓ Prepares defense strategy with legal citations</li>
            <li>✓ Available 24/7 for client representation</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
