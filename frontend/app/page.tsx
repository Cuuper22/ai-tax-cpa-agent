'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-indigo-600">AI Tax CPA Agent</h1>
            <div className="space-x-4">
              <Link href="/tax-prep" className="text-gray-700 hover:text-indigo-600">Tax Prep</Link>
              <Link href="/audit-defense" className="text-gray-700 hover:text-indigo-600">Audit Defense</Link>
              <Link href="/voice-call" className="text-gray-700 hover:text-indigo-600">Voice Call</Link>
              <Link href="/benchmark" className="text-gray-700 hover:text-indigo-600">Benchmark</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h2 className="text-5xl font-extrabold text-gray-900 mb-6">
            AI-Powered Tax Accounting
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Demonstrating advanced AI capabilities in complex tax preparation, IRS audit defense,
            and professional representation. Everything your CPA friend does, but faster.
          </p>
          
          <div className="flex justify-center space-x-4">
            <Link href="/tax-prep" 
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition">
              Start Tax Preparation
            </Link>
            <Link href="/voice-call"
              className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition">
              Mock IRS Call
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <FeatureCard
            title="Tax Preparation"
            description="Complete Form 1040, 1120, 1065, and more with AI-powered accuracy"
            icon="📊"
            link="/tax-prep"
          />
          <FeatureCard
            title="Audit Defense"
            description="IRS audit representation with strategic response generation"
            icon="🛡️"
            link="/audit-defense"
          />
          <FeatureCard
            title="Voice Calls"
            description="Natural conversation with realistic speech patterns and IRS simulation"
            icon="📞"
            link="/voice-call"
          />
          <FeatureCard
            title="Tax Research"
            description="Instant access to IRC sections, regulations, and case law"
            icon="📚"
            link="/research"
          />
          <FeatureCard
            title="Document Analysis"
            description="Process W-2s, 1099s, receipts with OCR and intelligent extraction"
            icon="📄"
            link="/documents"
          />
          <FeatureCard
            title="Benchmarking"
            description="Compare AI performance vs human CPA side-by-side"
            icon="⚡"
            link="/benchmark"
          />
        </div>

        {/* Stats Section */}
        <div className="mt-20 bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-center mb-8">AI Capabilities</h3>
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <StatCard number="10x" label="Faster Preparation" />
            <StatCard number="98%" label="Accuracy Rate" />
            <StatCard number="24/7" label="Availability" />
            <StatCard number="$0" label="Human Error" />
          </div>
        </div>

        {/* Challenge Section */}
        <div className="mt-16 bg-indigo-600 text-white rounded-xl p-8">
          <h3 className="text-3xl font-bold mb-4">Challenge Your CPA Friend</h3>
          <p className="text-lg mb-6">
            Think AI cannot replace complex professional services? Put it to the test with these challenges:
          </p>
          <ul className="space-y-3 text-lg">
            <li>✓ Prepare a multi-state S-Corp return faster than your friend</li>
            <li>✓ Defend an IRS audit with better legal arguments</li>
            <li>✓ Handle a mock IRS phone call more professionally</li>
            <li>✓ Find more tax optimization opportunities</li>
            <li>✓ Research obscure tax code sections instantly</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ title, description, icon, link }: any) {
  return (
    <Link href={link}>
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition cursor-pointer">
        <div className="text-4xl mb-4">{icon}</div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </Link>
  )
}

function StatCard({ number, label }: any) {
  return (
    <div>
      <div className="text-4xl font-bold text-indigo-600">{number}</div>
      <div className="text-gray-600 mt-2">{label}</div>
    </div>
  )
}
