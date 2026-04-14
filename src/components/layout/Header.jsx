import { useLocation } from 'react-router-dom'
import { Wifi, WifiOff, Brain } from 'lucide-react'
import { useEffect, useState } from 'react'

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/clients': 'Clients',
  '/sessions': 'Sessions',
  '/safety': 'Safety Plans',
  '/staffing': 'Staffing Documents',
  '/dsm': 'DSM-5 Reference',
  '/settings': 'Settings',
}

function OnlineIndicator() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  if (online) return null
  return (
    <div className="flex items-center gap-1.5 text-xs text-warning bg-warning-muted px-2.5 py-1 rounded-full border border-yellow-700">
      <WifiOff className="w-3 h-3" />
      <span>Offline</span>
    </div>
  )
}

export function Header({ title, actions, backButton }) {
  const location = useLocation()
  const pageTitle = title || PAGE_TITLES[location.pathname] || 'ClinicalMind'

  return (
    <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-md border-b border-border px-4 md:px-6 h-14 flex items-center gap-3 flex-shrink-0">
      {/* Back button (mobile) */}
      {backButton && (
        <div className="flex-shrink-0">{backButton}</div>
      )}

      {/* Mobile logo */}
      <div className="md:hidden flex items-center gap-2 mr-auto">
        <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
          <Brain className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="font-semibold text-sm text-text-primary">{pageTitle}</span>
      </div>

      {/* Desktop title */}
      <h1 className="hidden md:block text-base font-semibold text-text-primary flex-1">
        {pageTitle}
      </h1>

      <div className="flex items-center gap-2 ml-auto md:ml-0">
        <OnlineIndicator />
        {actions}
      </div>
    </header>
  )
}
