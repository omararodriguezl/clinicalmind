import { forwardRef } from 'react'
import { LoadingSpinner } from './LoadingSpinner'

const variants = {
  primary:   'bg-primary text-white border border-primary hover:opacity-90',
  secondary: 'bg-surface-2 text-text-primary border border-border hover:bg-surface-3 hover:border-border-light',
  danger:    'bg-danger-muted text-danger border border-danger hover:opacity-90',
  ghost:     'bg-transparent text-text-secondary border border-transparent hover:bg-surface-2 hover:text-text-primary',
  army:      'bg-army-muted text-army-text border border-army-border hover:opacity-90',
  civilian:  'bg-civilian-muted text-civilian-text border border-civilian-border hover:opacity-90',
  success:   'bg-success-muted text-success border border-success hover:opacity-90',
}

const sizes = {
  xs:   'px-2 py-1 text-xs gap-1',
  sm:   'px-2.5 py-1.5 text-xs gap-1.5',
  md:   'px-3.5 py-2 text-sm gap-1.5',
  lg:   'px-4 py-2.5 text-sm gap-2',
  xl:   'px-5 py-3 text-sm gap-2',
  icon: 'p-1.5',
}

export const Button = forwardRef(function Button(
  { variant = 'secondary', size = 'md', loading = false, disabled = false,
    icon: Icon, iconRight: IconRight, children, className = '', ...props },
  ref
) {
  const isDisabled = disabled || loading

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center font-medium',
        'transition-all duration-100 select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
        variants[variant],
        sizes[size],
        isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:opacity-80',
        className,
      ].join(' ')}
      style={{ borderRadius: 2, ...props.style }}
      {...props}
    >
      {loading ? (
        <LoadingSpinner size="sm" />
      ) : (
        Icon && <Icon className={size === 'xs' || size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      )}
      {children}
      {!loading && IconRight && (
        <IconRight className={size === 'xs' || size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      )}
    </button>
  )
})
