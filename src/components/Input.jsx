import React, { forwardRef } from 'react'

const Input = forwardRef(({
  label,
  error,
  hint,
  icon,
  suffix,
  size = 'md',
  fullWidth = true,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  const baseClasses = 'bg-neutral-900 border text-white rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 placeholder-neutral-500'
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-4 py-3 text-base'
  }
  
  const stateClasses = error 
    ? 'border-neutral-600 focus:border-neutral-500 focus:ring-neutral-600'
    : 'border-neutral-700 focus:border-white focus:ring-white/20'

  return (
    <div className={containerClassName}>
      {label && (
        <label className="block text-sm font-medium text-neutral-300 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
            {icon}
          </div>
        )}
        
        <input
          ref={ref}
          className={`
            ${baseClasses}
            ${sizeClasses[size]}
            ${stateClasses}
            ${icon ? 'pl-10' : ''}
            ${suffix ? 'pr-12' : ''}
            ${fullWidth ? 'w-full' : ''}
            ${className}
          `}
          {...props}
        />
        
        {suffix && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">
            {suffix}
          </div>
        )}
      </div>
      
      {(error || hint) && (
        <p className={`mt-1.5 text-sm ${error ? 'text-neutral-400' : 'text-neutral-500'}`}>
          {error || hint}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export const Select = forwardRef(({
  label,
  error,
  hint,
  options = [],
  size = 'md',
  fullWidth = true,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  const baseClasses = 'bg-neutral-900 border text-white rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 appearance-none cursor-pointer'
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 pr-8 text-sm',
    md: 'px-4 py-2.5 pr-10 text-sm',
    lg: 'px-4 py-3 pr-10 text-base'
  }
  
  const stateClasses = error 
    ? 'border-neutral-600 focus:border-neutral-500 focus:ring-neutral-600'
    : 'border-neutral-700 focus:border-white focus:ring-white/20'

  return (
    <div className={containerClassName}>
      {label && (
        <label className="block text-sm font-medium text-neutral-300 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        <select
          ref={ref}
          className={`
            ${baseClasses}
            ${sizeClasses[size]}
            ${stateClasses}
            ${fullWidth ? 'w-full' : ''}
            ${className}
          `}
          {...props}
        >
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              className="bg-neutral-900"
            >
              {option.label}
            </option>
          ))}
        </select>
        
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {(error || hint) && (
        <p className={`mt-1.5 text-sm ${error ? 'text-neutral-400' : 'text-neutral-500'}`}>
          {error || hint}
        </p>
      )}
    </div>
  )
})

Select.displayName = 'Select'

export const Textarea = forwardRef(({
  label,
  error,
  hint,
  size = 'md',
  fullWidth = true,
  rows = 4,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  const baseClasses = 'bg-neutral-900 border text-white rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 placeholder-neutral-500 resize-none'
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-sm',
    lg: 'px-4 py-3 text-base'
  }
  
  const stateClasses = error 
    ? 'border-neutral-600 focus:border-neutral-500 focus:ring-neutral-600'
    : 'border-neutral-700 focus:border-white focus:ring-white/20'

  return (
    <div className={containerClassName}>
      {label && (
        <label className="block text-sm font-medium text-neutral-300 mb-2">
          {label}
        </label>
      )}
      
      <textarea
        ref={ref}
        rows={rows}
        className={`
          ${baseClasses}
          ${sizeClasses[size]}
          ${stateClasses}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      />
      
      {(error || hint) && (
        <p className={`mt-1.5 text-sm ${error ? 'text-neutral-400' : 'text-neutral-500'}`}>
          {error || hint}
        </p>
      )}
    </div>
  )
})

Textarea.displayName = 'Textarea'

export default Input
