export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = {
    xs: 'w-3 h-3 border',
    sm: 'w-4 h-4 border',
    md: 'w-5 h-5 border-2',
    lg: 'w-7 h-7 border-2',
    xl: 'w-10 h-10 border-2',
  }

  return (
    <span
      className={[
        'inline-block rounded-full border-current border-t-transparent animate-spin',
        sizes[size],
        className,
      ].join(' ')}
      role="status"
      aria-label="Loading"
    />
  )
}

export function PageLoader({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-3 text-text-secondary">
      <LoadingSpinner size="lg" className="text-primary" />
      <p className="text-sm">{message}</p>
    </div>
  )
}

export function FullPageLoader({ message = 'Loading ClinicalMind...' }) {
  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center gap-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-primary animate-pulse" />
        </div>
        <span className="text-xl font-semibold text-text-primary">ClinicalMind</span>
      </div>
      <LoadingSpinner size="lg" className="text-primary" />
      <p className="text-sm text-text-secondary">{message}</p>
    </div>
  )
}
