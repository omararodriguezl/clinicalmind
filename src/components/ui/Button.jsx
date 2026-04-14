import { forwardRef } from 'react'
import { LoadingSpinner } from './LoadingSpinner'

const variants = {
  primary: 'bg-primary hover:bg-primary-600 text-white border border-primary-600 shadow-sm',
  secondary: 'bg-surface-2 hover:bg-surface-3 text-text-primary border border-border',
  danger: 'bg-danger-muted hover:bg-red-700 text-red-300 border border-red-800',
  ghost: 'bg-transparent hover:bg-surface-2 text-text-secondary border border-transparent',
  army: 'bg-army-muted hover:bg-army-border text-army-text border border-army-border',
  civilian: 'bg-civilian-muted hover:bg-civilian-border text-civilian-text border border-civilian-border',
  success: 'bg-success-muted hover:bg-green-700 text-green-300 border border-green-800',
}

const sizes = {
  xs: 'px-2.5 py-1 text-xs gap-1.5',
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2',
  xl: 'px-6 py-3 text-base gap-2.5',
  icon: 'p-2',
}

export const Button = forwardRef(function Button(
  {
    variant = 'secondary',
    size = 'md',
    loading = false,
    disabled = false,
    icon: Icon,
    iconRight: IconRight,
    children,
    className = '',
    ...props
  },
  ref
) {
  const isDisabled = disabled || loading

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center font-medium rounded-md',
        'transition-all duration-150 select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        variants[variant],
        sizes[size],
        isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]',
        className,
      ].join(' ')}
      {...props}
    >
      {loading ? (
        <LoadingSpinner size="sm" />
      ) : (
        Icon && <Icon className={children ? (size === 'xs' || size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4') : 'w-4 h-4'} />
      )}
      {children}
      {!loading && IconRight && (
        <IconRight className={size === 'xs' || size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      )}
    </button>
  )
})
