'use client'

import { useState, useEffect, useRef } from 'react'

export default function VoiceCallPage() {
  const [callActive, setCallActive] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [userInput, setUserInput] = useState('')

  const startCall = () => {
    setCallActive(true)
    setMessages([{
      role: 'system',
      content: 'Call started. You are the IRS agent. The AI CPA will respond.',
      timestamp: new Date()
    }])
  }

  const sendMessage = () => {
    if (!userInput.trim()) return
    setMessages(prev => [...prev, {
      role: 'irs',
      content: userInput,
      timestamp: new Date()
    }])
    
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'cpa',
        content: 'Thank you for bringing that up. Let me explain the situation...',
        timestamp: new Date()
      }])
    }, 1000)
    
    setUserInput('')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-6">AI CPA Voice Call Simulator</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <button
          onClick={startCall}
          className="bg-green-600 text-white px-6 py-2 rounded mb-4"
          disabled={callActive}
        >
          Start Call
        </button>
        
        <div className="h-96 overflow-y-auto mb-4 space-y-3">
          {messages.map((msg, idx) => (
            <div key={idx} className="p-3 bg-gray-100 rounded">
              <strong>{msg.role}:</strong> {msg.content}
            </div>
          ))}
        </div>
        
        <div className="flex space-x-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1 p-2 border rounded"
            placeholder="Type your message as IRS agent..."
            disabled={!callActive}
          />
          <button
            onClick={sendMessage}
            disabled={!callActive}
            className="bg-indigo-600 text-white px-4 py-2 rounded"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
