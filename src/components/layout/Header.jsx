import { useLocation } from 'react-router-dom'
import { WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ThemeToggle } from '../ui/ThemeToggle'

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/clients':   'Clients',
  '/sessions':  'Sessions',
  '/safety':    'Safety Plans',
  '/staffing':  'Staffing Documents',
  '/dsm':       'DSM-5 Reference',
  '/settings':  'Settings',
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
    <div className="flex items-center gap-1.5 px-2.5 py-1" style={{
      fontFamily: 'JetBrains Mono, monospace', fontSize: 9,
      letterSpacing: '0.18em', border: '1px solid var(--cm-warn)',
      background: 'var(--cm-warn-soft)', color: 'var(--cm-warn)', borderRadius: 2,
    }}>
      <WifiOff className="w-3 h-3" />
      OFFLINE
    </div>
  )
}

export function Header({ title, actions, backButton }) {
  const location = useLocation()
  const pageTitle = title || PAGE_TITLES[location.pathname] || 'ClinicalMind'

  return (
    <header className="sticky top-0 z-30 flex-shrink-0 flex items-center gap-3 px-4 md:px-6"
      style={{
        height: 48,
        background: 'var(--cm-surface)',
        borderBottom: '1px solid var(--cm-line)',
      }}
    >
      {backButton && <div className="flex-shrink-0">{backButton}</div>}

      {/* Mobile: app name */}
      <div className="md:hidden flex items-center gap-2 mr-auto">
        <div style={{
          width: 24, height: 24, border: '1px solid var(--cm-od)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2,
        }}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="var(--cm-od)" strokeWidth="1.4" strokeLinejoin="round">
            <path d="M8 1.5L2.5 3.5v5C2.5 11.5 5 13.5 8 14.5c3-1 5.5-3 5.5-6v-5L8 1.5z"/>
          </svg>
        </div>
        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--cm-ink)' }}>{pageTitle}</span>
      </div>

      {/* Desktop: stencil title */}
      <div className="hidden md:flex items-center gap-3 flex-1 min-w-0">
        <div className="mono-label" style={{ fontSize: 9 }}>OP //</div>
        <h1 style={{ fontSize: 14, fontWeight: 700, color: 'var(--cm-ink)', letterSpacing: '-0.01em' }}>
          {pageTitle}
        </h1>
      </div>

      <div className="flex items-center gap-2 ml-auto md:ml-0">
        <OnlineIndicator />
        {actions}
        <ThemeToggle />
      </div>
    </header>
  )
}
