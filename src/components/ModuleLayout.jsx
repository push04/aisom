import React from 'react'

function ModuleLayout({ 
  title, 
  subtitle, 
  status = 'online',
  children,
  actions,
  breadcrumb
}) {
  const statusStyles = {
    online: { dot: 'bg-white animate-pulse', text: 'ONLINE' },
    processing: { dot: 'bg-neutral-400 animate-spin', text: 'PROCESSING' },
    offline: { dot: 'bg-neutral-600', text: 'OFFLINE' },
    error: { dot: 'bg-neutral-500 animate-pulse', text: 'ERROR' }
  }

  const currentStatus = statusStyles[status] || statusStyles.online

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {breadcrumb && (
          <nav className="mb-4" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-sm">
              {breadcrumb.map((item, index) => (
                <li key={index} className="flex items-center gap-2">
                  {index > 0 && (
                    <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                  {item.href ? (
                    <a href={item.href} className="text-neutral-400 hover:text-white transition-colors">
                      {item.label}
                    </a>
                  ) : (
                    <span className="text-white font-medium">{item.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-neutral-800 mb-6">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-white truncate">
                {title}
              </h1>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className={`w-2 h-2 rounded-full ${currentStatus.dot}`} />
                <span className="text-xs text-neutral-500 font-mono uppercase tracking-wider">
                  {currentStatus.text}
                </span>
              </div>
            </div>
            {subtitle && (
              <p className="text-sm sm:text-base text-neutral-400 line-clamp-2">
                {subtitle}
              </p>
            )}
          </div>
          
          {actions && (
            <div className="flex items-center gap-3 flex-shrink-0">
              {actions}
            </div>
          )}
        </header>

        <main className="animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}

export function ModuleCard({ 
  title, 
  children, 
  className = '',
  headerActions,
  loading = false,
  error = null
}) {
  return (
    <div className={`bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {headerActions && (
            <div className="flex items-center gap-2">
              {headerActions}
            </div>
          )}
        </div>
      )}
      
      <div className="p-6 relative">
        {loading && (
          <div className="absolute inset-0 bg-neutral-900/90 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-neutral-700 border-t-white rounded-full animate-spin" />
              <span className="text-sm text-neutral-400">Loading...</span>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="text-white font-medium">Error</h3>
                <p className="text-sm text-neutral-400 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {children}
      </div>
    </div>
  )
}

export function ModuleGrid({ children, columns = 2 }) {
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 lg:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  }

  return (
    <div className={`grid gap-6 ${colClasses[columns] || colClasses[2]}`}>
      {children}
    </div>
  )
}

export function StatCard({ label, value, unit, icon, trend, className = '' }) {
  return (
    <div className={`bg-neutral-900 border border-neutral-800 rounded-xl p-5 relative overflow-hidden group hover:border-neutral-700 transition-colors ${className}`}>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
          {label}
        </span>
        {icon && (
          <span className="text-neutral-600 group-hover:text-neutral-500 transition-colors">
            {icon}
          </span>
        )}
      </div>
      
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-white font-mono">
          {value}
        </span>
        {unit && (
          <span className="text-sm text-neutral-500">{unit}</span>
        )}
      </div>
      
      {trend && (
        <div className={`mt-2 text-xs font-medium ${
          trend.direction === 'up' ? 'text-neutral-300' : 
          trend.direction === 'down' ? 'text-neutral-500' : 'text-neutral-400'
        }`}>
          {trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : ''}
          {trend.value} {trend.label}
        </div>
      )}
    </div>
  )
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action,
  className = '' 
}) {
  return (
    <div className={`text-center py-12 ${className}`}>
      {icon && (
        <div className="w-20 h-20 mx-auto mb-4 text-neutral-700">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-neutral-500 max-w-sm mx-auto mb-6">{description}</p>
      )}
      {action}
    </div>
  )
}

export default ModuleLayout
