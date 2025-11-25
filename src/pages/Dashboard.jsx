import React, { useState, useEffect } from 'react'

function Dashboard() {
  const [recentAnalyses, setRecentAnalyses] = useState([])
  
  useEffect(() => {
    const stored = localStorage.getItem('recentAnalyses')
    if (stored) {
      setRecentAnalyses(JSON.parse(stored))
    }
  }, [])
  
  const stats = [
    {
      title: 'Total Inspections',
      value: recentAnalyses.length,
      label: 'Assets',
      color: 'from-primary-700 to-primary-800'
    },
    {
      title: 'Rust & Wear Scans',
      value: recentAnalyses.filter(a => a.type === 'crack').length,
      label: 'Locomotives',
      color: 'from-danger/80 to-danger'
    },
    {
      title: 'Bridge Analytics',
      value: recentAnalyses.filter(a => a.type === 'beam').length,
      label: 'Structures',
      color: 'from-accent/80 to-accent'
    },
    {
      title: 'Rolling Stock Checks',
      value: recentAnalyses.filter(a => a.type === 'ergonomics').length,
      label: 'Assessments',
      color: 'from-warning/80 to-warning'
    }
  ]
  
  return (
    <div className="min-h-screen bg-primary-950">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Rail Operations Command Center</h1>
          <p className="text-secondary-300">AI-powered monitoring for Indian Railway infrastructure and rolling stock</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className={`bg-gradient-to-br ${stat.color} rounded-lg shadow-lg p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-xl`}
            >
              <div className="flex flex-col">
                <span className="text-white/80 text-sm font-medium uppercase tracking-wide mb-2">{stat.title}</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-5xl font-bold text-white">{stat.value}</span>
                  <span className="text-white/70 text-sm">{stat.label}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-primary-900 rounded-lg shadow-lg border border-primary-800">
            <div className="px-6 py-4 border-b border-primary-800">
              <h2 className="text-xl font-bold text-white">Recent Analysis History</h2>
            </div>
            <div className="p-6">
              {recentAnalyses.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto mb-4 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-secondary-400">No inspection records. Begin by launching Rust Scanner, Bridge Analysis, or Track Designer modules.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {recentAnalyses.slice(0, 10).map((analysis, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-4 bg-primary-800/50 rounded border-l-4 border-accent hover:bg-primary-800 transition-colors duration-200"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{analysis.title}</h3>
                        <p className="text-sm text-secondary-400 uppercase tracking-wide">{analysis.type}</p>
                      </div>
                      <span className="text-xs text-secondary-500 font-mono">
                        {new Date(analysis.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-primary-900 rounded-lg shadow-lg border border-primary-800">
            <div className="px-6 py-4 border-b border-primary-800">
              <h2 className="text-xl font-bold text-white">Quick Access</h2>
            </div>
            <div className="p-4 space-y-3">
              <a 
                href="/crack-analyzer" 
                className="block p-4 bg-primary-800 rounded border border-primary-700 hover:border-accent hover:bg-primary-700 transition-all duration-200"
              >
                <h3 className="font-semibold text-white mb-1">Rust & Wear Scanner</h3>
                <p className="text-sm text-secondary-400">Locomotive and track corrosion detection</p>
              </a>
              
              <a 
                href="/beam-deflection" 
                className="block p-4 bg-primary-800 rounded border border-primary-700 hover:border-accent hover:bg-primary-700 transition-all duration-200"
              >
                <h3 className="font-semibold text-white mb-1">Bridge Girder Analysis</h3>
                <p className="text-sm text-secondary-400">IRS Bridge Rules and load calculations</p>
              </a>
              
              <a 
                href="/ergonomics" 
                className="block p-4 bg-primary-800 rounded border border-primary-700 hover:border-accent hover:bg-primary-700 transition-all duration-200"
              >
                <h3 className="font-semibold text-white mb-1">Rolling Stock Geometry</h3>
                <p className="text-sm text-secondary-400">Bogie alignment and clearance checks</p>
              </a>
              
              <a 
                href="/site-context" 
                className="block p-4 bg-primary-800 rounded border border-primary-700 hover:border-accent hover:bg-primary-700 transition-all duration-200"
              >
                <h3 className="font-semibold text-white mb-1">Corridor Environment</h3>
                <p className="text-sm text-secondary-400">Monsoon, soil, and thermal monitoring</p>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
