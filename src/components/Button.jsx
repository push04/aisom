import React from 'react'

function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  className = '',
  ...props
}) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantClasses = {
    primary: 'bg-white text-black hover:bg-neutral-200 focus:ring-white active:scale-[0.98]',
    secondary: 'bg-neutral-800 text-white border border-neutral-700 hover:bg-neutral-700 hover:border-neutral-600 focus:ring-neutral-500 active:scale-[0.98]',
    outline: 'bg-transparent text-white border border-neutral-600 hover:bg-white hover:text-black focus:ring-white active:scale-[0.98]',
    ghost: 'bg-transparent text-neutral-400 hover:text-white hover:bg-neutral-800 focus:ring-neutral-500',
    danger: 'bg-neutral-800 text-white border border-neutral-600 hover:bg-neutral-700 focus:ring-neutral-500 active:scale-[0.98]'
  }
  
  const sizeClasses = {
    xs: 'text-xs px-2.5 py-1.5 gap-1.5',
    sm: 'text-sm px-3 py-2 gap-2',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3 gap-2.5',
    xl: 'text-lg px-8 py-4 gap-3'
  }

  const iconSizes = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6'
  }

  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <svg 
            className={`animate-spin ${iconSizes[size]}`} 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Processing...</span>
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <span className={iconSizes[size]}>{icon}</span>
          )}
          {children}
          {icon && iconPosition === 'right' && (
            <span className={iconSizes[size]}>{icon}</span>
          )}
        </>
      )}
    </button>
  )
}

export function IconButton({
  children,
  variant = 'ghost',
  size = 'md',
  disabled = false,
  className = '',
  'aria-label': ariaLabel,
  ...props
}) {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantClasses = {
    primary: 'bg-white text-black hover:bg-neutral-200 focus:ring-white',
    secondary: 'bg-neutral-800 text-white hover:bg-neutral-700 focus:ring-neutral-500',
    ghost: 'text-neutral-400 hover:text-white hover:bg-neutral-800 focus:ring-neutral-500',
    outline: 'border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-600 focus:ring-neutral-500'
  }
  
  const sizeClasses = {
    xs: 'p-1',
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
    xl: 'p-3'
  }

  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      disabled={disabled}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </button>
  )
}

export function ButtonGroup({ children, className = '' }) {
  return (
    <div className={`inline-flex rounded-lg overflow-hidden ${className}`} role="group">
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child
        
        return React.cloneElement(child, {
          className: `${child.props.className || ''} rounded-none first:rounded-l-lg last:rounded-r-lg border-r-0 last:border-r focus:z-10`
        })
      })}
    </div>
  )
}

export default Button
