import { Shield, Stethoscope, AlertTriangle } from 'lucide-react'

export function ModeBadge({ mode, size = 'sm' }) {
  if (mode === 'army') {
    return (
      <span className={`badge-army ${size === 'xs' ? 'text-xs py-0' : ''}`}>
        <Shield className="w-3 h-3" />
        68X Army
      </span>
    )
  }
  return (
    <span className={`badge-civilian ${size === 'xs' ? 'text-xs py-0' : ''}`}>
      <Stethoscope className="w-3 h-3" />
      Civilian RBT
    </span>
  )
}

export function SafetyBadge({ active }) {
  if (!active) return null
  return (
    <span className="badge-danger animate-pulse-slow">
      <AlertTriangle className="w-3 h-3" />
      Active Safety Plan
    </span>
  )
}

export function StatusBadge({ status }) {
  const configs = {
    active: { color: 'bg-success-muted text-green-300 border border-green-800', label: 'Active' },
    inactive: { color: 'bg-surface-3 text-text-muted border border-border', label: 'Inactive' },
    pending: { color: 'bg-warning-muted text-yellow-300 border border-yellow-800', label: 'Pending' },
  }
  const config = configs[status] || configs.inactive

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${config.color}`}>
      {config.label}
    </span>
  )
}

export function CountBadge({ count, variant = 'default' }) {
  if (!count && count !== 0) return null
  const colors = {
    default: 'bg-surface-3 text-text-secondary',
    primary: 'bg-primary/20 text-primary-300',
    danger: 'bg-danger-muted text-red-300',
  }
  return (
    <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold ${colors[variant]}`}>
      {count > 99 ? '99+' : count}
    </span>
  )
}
