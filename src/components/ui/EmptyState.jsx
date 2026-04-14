import { Button } from './Button'

export function EmptyState({ icon: Icon, title, description, action, actionLabel, actionIcon }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {Icon && (
        <div className="w-14 h-14 rounded-full bg-surface-2 border border-border flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-text-muted" />
        </div>
      )}
      <h3 className="text-base font-semibold text-text-primary mb-1">{title}</h3>
      {description && <p className="text-sm text-text-secondary max-w-sm mb-6">{description}</p>}
      {action && actionLabel && (
        <Button variant="primary" onClick={action} icon={actionIcon}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
