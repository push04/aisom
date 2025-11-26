import React from 'react'

export function Skeleton({ className = '', variant = 'rectangular', animation = 'shimmer' }) {
  const baseClasses = 'bg-neutral-800'
  
  const variantClasses = {
    rectangular: 'rounded',
    circular: 'rounded-full',
    text: 'rounded h-4',
    card: 'rounded-lg'
  }
  
  const animationClasses = {
    shimmer: 'skeleton-shimmer',
    pulse: 'animate-pulse',
    none: ''
  }

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      aria-hidden="true"
    />
  )
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-neutral-900 border border-neutral-800 rounded-lg p-6 ${className}`}>
      <div className="flex items-center gap-4 mb-4">
        <Skeleton variant="circular" className="w-12 h-12" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-4/6" />
      </div>
    </div>
  )
}

export function SkeletonStats({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
          <Skeleton className="h-3 w-20 mb-3" />
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-2 w-12" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 5, columns = 4 }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
      <div className="border-b border-neutral-800 p-4">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-neutral-800">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4 flex gap-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonImage({ className = '', aspectRatio = '16/9' }) {
  return (
    <div 
      className={`bg-neutral-800 rounded-lg skeleton-shimmer ${className}`}
      style={{ aspectRatio }}
    >
      <div className="flex items-center justify-center h-full">
        <svg className="w-12 h-12 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    </div>
  )
}

export function SkeletonAnalysis() {
  return (
    <div className="space-y-6">
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="grid grid-cols-2 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-neutral-800/50 rounded-lg p-4">
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-3 w-4/6" />
        </div>
      </div>
    </div>
  )
}

export function LoadingOverlay({ message = 'Processing...' }) {
  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 border-2 border-neutral-700 rounded-full" />
          <div className="absolute inset-0 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-white font-medium">{message}</p>
        <p className="text-neutral-500 text-sm mt-1">This may take a moment</p>
      </div>
    </div>
  )
}

export default Skeleton
