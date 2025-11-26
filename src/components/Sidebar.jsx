import React, { useState, useEffect, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'

const menuItems = [
  {
    path: '/',
    label: 'Command Center',
    shortLabel: 'CMD',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
    category: 'main'
  },
  {
    path: '/track-inspection',
    label: 'Track Inspection',
    shortLabel: 'TRK',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
    category: 'inspection'
  },
  {
    path: '/crack-analyzer',
    label: 'Corrosion Scanner',
    shortLabel: 'COR',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
      </svg>
    ),
    category: 'inspection'
  },
  {
    path: '/locomotive-health',
    label: 'Locomotive Health',
    shortLabel: 'LOC',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    category: 'inspection'
  },
  {
    path: '/fastener-detection',
    label: 'Fastener Detection',
    shortLabel: 'FST',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    category: 'inspection'
  },
  {
    path: '/pantograph-monitor',
    label: 'Pantograph Monitor',
    shortLabel: 'PAN',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    category: 'inspection'
  },
  {
    path: '/signal-analyzer',
    label: 'Signal Analyzer',
    shortLabel: 'SIG',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    category: 'inspection'
  },
  {
    path: '/wheel-profile',
    label: 'Wheel Profile',
    shortLabel: 'WHL',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    category: 'rolling'
  },
  {
    path: '/sleeper-condition',
    label: 'Sleeper Condition',
    shortLabel: 'SLP',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    ),
    category: 'rolling'
  },
  {
    path: '/ballast-analyzer',
    label: 'Ballast Quality',
    shortLabel: 'BLT',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    category: 'rolling'
  },
  {
    path: '/ohe-monitor',
    label: 'OHE Wire Monitor',
    shortLabel: 'OHE',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
      </svg>
    ),
    category: 'electrical'
  },
  {
    path: '/level-crossing',
    label: 'Level Crossing',
    shortLabel: 'LCX',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    category: 'electrical'
  },
  {
    path: '/tunnel-clearance',
    label: 'Tunnel Clearance',
    shortLabel: 'TNL',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    category: 'electrical'
  },
  {
    path: '/beam-deflection',
    label: 'Bridge Analysis',
    shortLabel: 'BRG',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    category: 'analysis'
  },
  {
    path: '/diagram-builder',
    label: 'Track Designer',
    shortLabel: 'DSN',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
      </svg>
    ),
    category: 'analysis'
  },
  {
    path: '/ergonomics',
    label: 'Rolling Stock Geometry',
    shortLabel: 'GEO',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    ),
    category: 'analysis'
  },
  {
    path: '/site-context',
    label: 'Environment Monitor',
    shortLabel: 'ENV',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    category: 'analysis'
  }
]

const categoryLabels = {
  main: 'Overview',
  inspection: 'Infrastructure Inspection',
  rolling: 'Track Components',
  electrical: 'Electrical Systems',
  analysis: 'Analysis Tools'
}

function Sidebar() {
  const location = useLocation()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isPinned, setIsPinned] = useState(() => {
    const saved = localStorage.getItem('sidebarPinned')
    return saved ? JSON.parse(saved) : false
  })
  const [hoveredItem, setHoveredItem] = useState(null)
  const [focusedIndex, setFocusedIndex] = useState(-1)

  useEffect(() => {
    localStorage.setItem('sidebarPinned', JSON.stringify(isPinned))
  }, [isPinned])

  const isActive = (path) => location.pathname === path

  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {})

  const flatItems = menuItems

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusedIndex(prev => (prev + 1) % flatItems.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusedIndex(prev => (prev - 1 + flatItems.length) % flatItems.length)
    } else if (e.key === 'Home') {
      e.preventDefault()
      setFocusedIndex(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      setFocusedIndex(flatItems.length - 1)
    }
  }, [flatItems.length])

  const shouldExpand = isExpanded || isPinned

  return (
    <aside 
      className={`fixed left-0 top-0 h-full bg-black border-r border-neutral-800 z-50 transition-all duration-300 ease-out ${
        shouldExpand ? 'w-72' : 'w-16'
      }`}
      onMouseEnter={() => !isPinned && setIsExpanded(true)}
      onMouseLeave={() => !isPinned && setIsExpanded(false)}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-neutral-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className={`transition-all duration-200 ${shouldExpand ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}`}>
                <h1 className="font-bold text-white text-lg whitespace-nowrap">RailVision AI</h1>
                <p className="text-xs text-neutral-500 whitespace-nowrap">Indian Railways Intelligence</p>
              </div>
            </div>
            {shouldExpand && (
              <button
                onClick={() => setIsPinned(!isPinned)}
                className={`p-1.5 rounded-lg transition-colors ${isPinned ? 'bg-white text-black' : 'text-neutral-500 hover:text-white hover:bg-neutral-800'}`}
                aria-label={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}
                title={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isPinned ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  )}
                </svg>
              </button>
            )}
          </div>
        </div>

        <nav 
          className="flex-1 overflow-y-auto py-4 px-2 no-scrollbar"
          onKeyDown={handleKeyDown}
        >
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="mb-4" role="group" aria-label={categoryLabels[category]}>
              <div className={`px-3 mb-2 transition-all duration-200 ${shouldExpand ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
                <span className="text-[10px] uppercase tracking-widest text-neutral-600 font-semibold">
                  {categoryLabels[category]}
                </span>
              </div>
              
              <ul role="list">
                {items.map((item, index) => {
                  const globalIndex = flatItems.findIndex(i => i.path === item.path)
                  const isFocused = globalIndex === focusedIndex
                  
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all duration-200 relative focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                          isActive(item.path)
                            ? 'bg-white text-black'
                            : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-white'
                        } ${isFocused ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''}`}
                        onMouseEnter={() => setHoveredItem(item.path)}
                        onMouseLeave={() => setHoveredItem(null)}
                        onFocus={() => setFocusedIndex(globalIndex)}
                        aria-current={isActive(item.path) ? 'page' : undefined}
                      >
                        <span className={`flex-shrink-0 transition-transform duration-200 ${
                          hoveredItem === item.path && !isActive(item.path) ? 'scale-110' : ''
                        }`} aria-hidden="true">
                          {item.icon}
                        </span>
                        
                        <span className={`text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                          shouldExpand ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
                        }`}>
                          {item.label}
                        </span>

                        {!shouldExpand && hoveredItem === item.path && (
                          <div 
                            className="absolute left-full ml-3 px-3 py-2 bg-neutral-900 text-white text-sm rounded-lg shadow-xl whitespace-nowrap z-50 border border-neutral-700"
                            role="tooltip"
                          >
                            {item.label}
                            <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-neutral-900 border-l border-b border-neutral-700 rotate-45" />
                          </div>
                        )}

                        {isActive(item.path) && (
                          <span className="absolute right-3 w-1.5 h-1.5 bg-black rounded-full" aria-hidden="true" />
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-neutral-800">
          <div className={`flex items-center gap-3 transition-all duration-200 ${shouldExpand ? 'opacity-100' : 'justify-center'}`}>
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" aria-hidden="true" />
            <span className={`text-xs text-neutral-500 transition-all duration-200 ${shouldExpand ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
              System Online
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
