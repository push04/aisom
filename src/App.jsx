import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import CrackAnalyzer from './pages/CrackAnalyzer'
import BeamDeflection from './pages/BeamDeflection'
import Ergonomics from './pages/Ergonomics'
import SiteContext from './pages/SiteContext'
import ErrorBoundary from './components/ErrorBoundary'

function Navigation() {
  const location = useLocation()
  
  const isActive = (path) => location.pathname === path
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { path: '/crack-analyzer', label: 'Structural Scan', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
    { path: '/beam-deflection', label: 'Beam Analysis', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
    { path: '/ergonomics', label: 'Ergonomics', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { path: '/site-context', label: 'Site Context', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' }
  ]
  
  return (
    <nav className="bg-primary-900 border-b border-primary-800 shadow-xl">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <svg className="w-10 h-10 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <div>
              <span className="font-bold text-xl text-white tracking-tight">StructuralVision AI</span>
              <p className="text-xs text-secondary-400">Professional Engineering Analysis Platform</p>
            </div>
          </div>
          <div className="flex space-x-1">
            {navItems.map((item) => (
              <Link 
                key={item.path}
                to={item.path} 
                className={`flex items-center space-x-2 px-4 py-2 rounded transition-all duration-200 ${
                  isActive(item.path) 
                    ? 'bg-accent text-white shadow-lg' 
                    : 'text-secondary-300 hover:bg-primary-800 hover:text-white'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-primary-950">
        <Navigation />
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/crack-analyzer" element={<CrackAnalyzer />} />
            <Route path="/beam-deflection" element={<BeamDeflection />} />
            <Route path="/ergonomics" element={<Ergonomics />} />
            <Route path="/site-context" element={<SiteContext />} />
          </Routes>
        </ErrorBoundary>
      </div>
    </Router>
  )
}

export default App
