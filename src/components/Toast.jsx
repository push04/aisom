import React, { useState, useEffect, createContext, useContext, useCallback } from 'react'

const ToastContext = createContext()

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type, duration }])
    
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, duration)
    }
    
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const success = useCallback((message, duration) => addToast(message, 'success', duration), [addToast])
  const error = useCallback((message, duration) => addToast(message, 'error', duration), [addToast])
  const warning = useCallback((message, duration) => addToast(message, 'warning', duration), [addToast])
  const info = useCallback((message, duration) => addToast(message, 'info', duration), [addToast])

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm">
      {toasts.map((toast, index) => (
        <Toast 
          key={toast.id} 
          toast={toast} 
          onClose={() => removeToast(toast.id)}
          style={{ animationDelay: `${index * 50}ms` }}
        />
      ))}
    </div>
  )
}

function Toast({ toast, onClose }) {
  const [isExiting, setIsExiting] = useState(false)

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(onClose, 200)
  }

  const icons = {
    success: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }

  const styles = {
    success: 'bg-white text-black border-white',
    error: 'bg-neutral-900 text-white border-neutral-600',
    warning: 'bg-neutral-800 text-white border-neutral-500',
    info: 'bg-neutral-900 text-white border-neutral-700'
  }

  return (
    <div 
      className={`flex items-start gap-3 p-4 rounded-lg border shadow-2xl backdrop-blur-sm transition-all duration-200 ${
        styles[toast.type]
      } ${isExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0 animate-slide-in-right'}`}
      role="alert"
    >
      <span className="flex-shrink-0 mt-0.5">
        {icons[toast.type]}
      </span>
      <p className="flex-1 text-sm font-medium leading-relaxed">
        {toast.message}
      </p>
      <button 
        onClick={handleClose}
        className="flex-shrink-0 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        aria-label="Close notification"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

export default Toast
