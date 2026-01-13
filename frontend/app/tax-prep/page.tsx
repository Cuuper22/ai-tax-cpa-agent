'use client'

import { useState } from 'react'

export default function TaxPrepPage() {
  const [income, setIncome] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const calculateTax = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8000/api/tax/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_type: '1040',
          gross_income: parseFloat(income),
          filing_status: 'single'
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
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">AI Tax Preparation</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Form 1040</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Gross Income</label>
              <input
                type="number"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                className="w-full p-3 border rounded-lg"
              />
            </div>
            
            <button
              onClick={calculateTax}
              disabled={loading || !income}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg"
            >
              {loading ? 'Calculating...' : 'Calculate Tax'}
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-2xl font-semibold mb-4">Results</h3>
            <p>Tax calculated: ${result.tax}</p>
          </div>
        )}
      </div>
    </div>
  )
}
