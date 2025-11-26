import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { SkeletonStats, SkeletonCard } from '../components/Skeleton'

function Dashboard() {
  const [recentAnalyses, setRecentAnalyses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [systemStatus, setSystemStatus] = useState({
    tracksMonitored: 0,
    activeAlerts: 0,
    inspectionsToday: 0,
    systemHealth: 98.5
  })
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setTimeout(() => {
      const stored = localStorage.getItem('recentAnalyses')
      if (stored) {
        setRecentAnalyses(JSON.parse(stored))
      }
      setIsLoading(false)
    }, 300)

    const clockTimer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => {
      clearTimeout(timer)
      clearInterval(clockTimer)
    }
  }, [])

  const stats = [
    {
      title: 'Total Inspections',
      value: recentAnalyses.length,
      subtitle: 'This Session',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
    },
    {
      title: 'Corrosion Scans',
      value: recentAnalyses.filter(a => a.type === 'crack').length,
      subtitle: 'Infrastructure',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      )
    },
    {
      title: 'Bridge Analytics',
      value: recentAnalyses.filter(a => a.type === 'beam').length,
      subtitle: 'Structures',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      title: 'System Health',
      value: `${systemStatus.systemHealth}%`,
      subtitle: 'All Systems',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    }
  ]

  const quickModules = [
    {
      path: '/track-inspection',
      title: 'Track Inspection',
      description: 'Rail geometry, gauge, and alignment analysis',
      category: 'Infrastructure'
    },
    {
      path: '/crack-analyzer',
      title: 'Corrosion Scanner',
      description: 'Rust and wear detection for infrastructure',
      category: 'Infrastructure'
    },
    {
      path: '/locomotive-health',
      title: 'Locomotive Health',
      description: 'Engine diagnostics and thermal analysis',
      category: 'Rolling Stock'
    },
    {
      path: '/beam-deflection',
      title: 'Bridge Analysis',
      description: 'IRS Bridge Rules load calculations',
      category: 'Structures'
    },
    {
      path: '/pantograph-monitor',
      title: 'Pantograph Monitor',
      description: 'OHE contact and wear monitoring',
      category: 'Electrical'
    },
    {
      path: '/site-context',
      title: 'Environment Monitor',
      description: 'Weather and corridor conditions',
      category: 'Planning'
    }
  ]

  const systemServices = [
    { name: 'AI Analysis Engine', status: 'online', statusText: 'ONLINE' },
    { name: 'Image Processing', status: 'online', statusText: 'READY' },
    { name: 'Motion Detection', status: 'online', statusText: 'ACTIVE' },
    { name: 'Weather API', status: 'online', statusText: 'CONNECTED' }
  ]

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <header className="mb-8" role="banner">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                Rail Operations Command Center
              </h1>
              <p className="text-sm sm:text-base text-neutral-400">
                Indian Railway Infrastructure Intelligence Platform
              </p>
            </div>
            <div className="text-left sm:text-right" aria-live="polite">
              <time 
                className="text-xl sm:text-2xl font-mono text-white tabular-nums"
                dateTime={currentTime.toISOString()}
              >
                {currentTime.toLocaleTimeString('en-IN', { hour12: false })}
              </time>
              <div className="text-xs sm:text-sm text-neutral-500">
                {currentTime.toLocaleDateString('en-IN', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
        </header>

        {isLoading ? (
          <SkeletonStats count={4} />
        ) : (
          <section aria-label="Statistics" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
            {stats.map((stat, index) => (
              <article 
                key={index}
                className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 sm:p-5 relative overflow-hidden group hover:border-neutral-700 transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-neutral-800 rounded-lg text-neutral-400 group-hover:text-white transition-colors">
                    {stat.icon}
                  </div>
                  <span className="text-[10px] sm:text-xs text-neutral-500 uppercase tracking-wider font-medium">
                    {stat.subtitle}
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-white font-mono tabular-nums">
                  {stat.value}
                </div>
                <div className="text-xs text-neutral-500 uppercase tracking-wider mt-1">
                  {stat.title}
                </div>
              </article>
            ))}
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <section 
            aria-label="Recent analysis history" 
            className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden"
          >
            <div className="px-5 sm:px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Recent Analysis History</h2>
              <span className="text-xs text-neutral-500 bg-neutral-800 px-2 py-1 rounded-full">
                {recentAnalyses.length} records
              </span>
            </div>
            <div className="p-5 sm:p-6">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-neutral-800 rounded-lg skeleton-shimmer" />
                  ))}
                </div>
              ) : recentAnalyses.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-800 flex items-center justify-center">
                    <svg className="w-8 h-8 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-white font-medium mb-1">No inspection records yet</h3>
                  <p className="text-sm text-neutral-500">
                    Start by using any of the analysis modules below
                  </p>
                </div>
              ) : (
                <ul className="space-y-2 max-h-80 overflow-y-auto" role="list">
                  {recentAnalyses.slice(0, 10).map((analysis, index) => (
                    <li 
                      key={index}
                      className="flex items-center justify-between p-3 sm:p-4 bg-neutral-800/50 rounded-lg border-l-2 border-white/50 hover:bg-neutral-800 hover:border-white transition-all duration-200"
                    >
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-white truncate">{analysis.title}</h3>
                        <p className="text-xs text-neutral-500 uppercase tracking-wide">{analysis.type}</p>
                      </div>
                      <time className="text-xs text-neutral-600 font-mono ml-4 flex-shrink-0">
                        {new Date(analysis.timestamp).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </time>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section 
            aria-label="System status" 
            className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden"
          >
            <div className="px-5 sm:px-6 py-4 border-b border-neutral-800">
              <h2 className="text-lg font-semibold text-white">System Status</h2>
            </div>
            <div className="p-5 sm:p-6">
              <ul className="space-y-3" role="list">
                {systemServices.map((service, index) => (
                  <li 
                    key={index}
                    className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span 
                        className={`w-2 h-2 rounded-full ${
                          service.status === 'online' ? 'bg-white animate-pulse' : 'bg-neutral-600'
                        }`}
                        aria-hidden="true"
                      />
                      <span className="text-sm text-neutral-300">{service.name}</span>
                    </div>
                    <span className="text-xs text-white font-mono">{service.statusText}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-6 pt-6 border-t border-neutral-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-neutral-400">Overall System Health</span>
                  <span className="text-lg font-bold text-white">{systemStatus.systemHealth}%</span>
                </div>
                <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: `${systemStatus.systemHealth}%` }}
                    role="progressbar"
                    aria-valuenow={systemStatus.systemHealth}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        <section aria-label="Quick access modules" className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-neutral-800">
            <h2 className="text-lg font-semibold text-white">Quick Access Modules</h2>
          </div>
          <div className="p-5 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickModules.map((module, index) => (
                <Link 
                  key={module.path}
                  to={module.path}
                  className="group block p-4 sm:p-5 bg-neutral-800/50 rounded-xl border border-neutral-700/50 hover:border-white/30 hover:bg-neutral-800 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-medium bg-neutral-800 px-2 py-0.5 rounded">
                      {module.category}
                    </span>
                    <div className="w-2 h-2 bg-white/50 rounded-full group-hover:bg-white transition-colors" />
                  </div>
                  <h3 className="font-semibold text-white group-hover:text-white transition-colors mb-2">
                    {module.title}
                  </h3>
                  <p className="text-sm text-neutral-500 mb-4 line-clamp-2">
                    {module.description}
                  </p>
                  <div className="flex items-center text-xs text-neutral-600 group-hover:text-white transition-colors">
                    <span>Open Module</span>
                    <svg 
                      className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <footer className="mt-8 text-center" role="contentinfo">
          <p className="text-xs text-neutral-600">
            RailVision AI - Indian Railway Infrastructure Intelligence Platform
          </p>
          <p className="text-xs text-neutral-700 mt-1">
            Powered by Advanced Computer Vision and Machine Learning
          </p>
        </footer>
      </div>
    </div>
  )
}

export default Dashboard
