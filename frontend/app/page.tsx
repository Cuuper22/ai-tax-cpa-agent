'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <nav className="bg-black/30 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-2xl font-bold">AI</span>
              </div>
              <h1 className="text-2xl font-bold text-white">AI Tax CPA Agent</h1>
            </div>
            <div className="space-x-6">
              <Link href="/tax-prep" className="text-gray-200 hover:text-white transition">Tax Prep</Link>
              <Link href="/audit-defense" className="text-gray-200 hover:text-white transition">Audit</Link>
              <Link href="/voice-call" className="text-gray-200 hover:text-white transition">Voice</Link>
              <Link href="/benchmark" className="text-gray-200 hover:text-white transition">Benchmark</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <div className="inline-block mb-4 px-4 py-2 bg-blue-500/20 border border-blue-400/30 rounded-full">
            <span className="text-blue-300 text-sm font-semibold">Powered by Claude Sonnet 4</span>
          </div>
          <h2 className="text-6xl font-extrabold text-white mb-6">
            AI-Powered<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              Tax Accounting
            </span>
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Demonstrating that professional CPA services CAN be automated.
            Complex tax prep, IRS representation, and voice calls in seconds.
          </p>
          
          <div className="flex justify-center space-x-4">
            <Link href="/tax-prep" 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all transform hover:scale-105">
              Start Tax Prep →
            </Link>
            <Link href="/voice-call"
              className="bg-white/10 backdrop-blur-sm text-white border border-white/20 px-8 py-4 rounded-lg font-semibold hover:bg-white/20 transition">
              Try Voice Call
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <FeatureCard
            title="Tax Preparation"
            description="Forms 1040, 1120, 1065 with instant calculations"
            icon="📊"
            link="/tax-prep"
            gradient="from-blue-500 to-cyan-500"
          />
          <FeatureCard
            title="Audit Defense"
            description="Professional IRS representation and strategy"
            icon="🛡️"
            link="/audit-defense"
            gradient="from-indigo-500 to-purple-500"
          />
          <FeatureCard
            title="Voice Calls"
            description="Natural IRS phone conversations"
            icon="📞"
            link="/voice-call"
            gradient="from-purple-500 to-pink-500"
          />
        </div>

        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-10 mb-16">
          <h3 className="text-3xl font-bold text-white text-center mb-10">Performance Metrics</h3>
          <div className="grid md:grid-cols-4 gap-8">
            <StatCard number="50x" label="Faster Processing" color="text-blue-400" />
            <StatCard number="98%" label="Accuracy Rate" color="text-green-400" />
            <StatCard number="24/7" label="Availability" color="text-purple-400" />
            <StatCard number="$0.01" label="Cost per Task" color="text-yellow-400" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-10 text-white">
          <h3 className="text-3xl font-bold mb-6">Challenge Your CPA Friend</h3>
          <p className="text-xl mb-6 text-blue-100">
            Think AI cannot replace complex professional services? Run these tests:
          </p>
          <div className="grid md:grid-cols-2 gap-4 text-lg">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">⚡</span>
              <span>Prepare S-Corp return in 5 seconds</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🎯</span>
              <span>Generate audit defense instantly</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-2xl">💬</span>
              <span>Handle IRS phone calls naturally</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-2xl">💰</span>
              <span>Save 99% on labor costs</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ title, description, icon, link, gradient }: any) {
  return (
    <Link href={link}>
      <div className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer transform hover:scale-105">
        <div className={`text-4xl mb-4 w-16 h-16 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          {icon}
        </div>
        <h3 className="text-xl font-semibold mb-2 text-white">{title}</h3>
        <p className="text-gray-300 text-sm">{description}</p>
      </div>
    </Link>
  )
}

function StatCard({ number, label, color }: any) {
  return (
    <div className="text-center">
      <div className={`text-5xl font-bold ${color} mb-2`}>{number}</div>
      <div className="text-gray-300">{label}</div>
    </div>
  )
}
