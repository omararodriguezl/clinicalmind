import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, Mic, ShieldAlert,
  ClipboardList, BookOpen, Settings, LogOut,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard',       code: '01' },
  { to: '/clients',   icon: Users,           label: 'Clients',         code: '02' },
  { to: '/sessions',  icon: Mic,             label: 'Sessions',        code: '03' },
  { to: '/safety',    icon: ShieldAlert,     label: 'Safety Plans',    code: '04' },
  { to: '/staffing',  icon: ClipboardList,   label: 'Staffing',        code: '05' },
  { to: '/dsm',       icon: BookOpen,        label: 'DSM-5',           code: '06' },
  { to: '/settings',  icon: Settings,        label: 'Settings',        code: '07' },
]

function NavItem({ to, icon: Icon, label, code, mobile = false }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => [
        'flex items-center transition-all duration-100',
        mobile
          ? 'flex-col gap-1 py-3 px-2 text-center'
          : 'gap-2.5 px-3 py-2 w-full',
        isActive
          ? mobile
            ? 'text-[var(--cm-od)]'
            : 'bg-[var(--cm-od-soft)] text-[var(--cm-od-ink)] border-l-[3px] border-[var(--cm-od)] pl-[9px]'
          : mobile
            ? 'text-[var(--cm-ink-mute)]'
            : 'text-[var(--cm-ink-soft)] hover:text-[var(--cm-ink)] hover:bg-[var(--cm-surface-alt)] border-l-[3px] border-transparent',
      ].join(' ')}
    >
      {({ isActive }) => (
        <>
          <Icon className={mobile ? 'w-6 h-6' : 'w-3.5 h-3.5 flex-shrink-0'} />
          {mobile ? (
            <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em', fontWeight: 600 }}>{label.toUpperCase()}</span>
          ) : (
            <>
              <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 500, flex: 1 }}>{label}</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: isActive ? 'var(--cm-od-ink)' : 'var(--cm-ink-faint)', letterSpacing: '0.1em', opacity: 0.7 }}>{code}</span>
            </>
          )}
        </>
      )}
    </NavLink>
  )
}

export function Sidebar() {
  const { signOut } = useAuth()

  const handleSignOut = async () => {
    try { await signOut(); toast.success('Signed out') }
    catch { toast.error('Failed to sign out') }
  }

  return (
    <aside className="hidden md:flex flex-col w-52 flex-shrink-0 h-screen sticky top-0"
      style={{ background: 'var(--cm-bg-deep)', borderRight: '1px solid var(--cm-line)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4" style={{ borderBottom: '1px solid var(--cm-line)' }}>
        <div style={{
          width: 30, height: 30, border: '1.2px solid var(--cm-od)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2,
          background: 'var(--cm-od-soft)',
        }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--cm-od)" strokeWidth="1.4" strokeLinejoin="round">
            <path d="M8 1.5L2.5 3.5v5C2.5 11.5 5 13.5 8 14.5c3-1 5.5-3 5.5-6v-5L8 1.5z"/>
          </svg>
        </div>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'var(--cm-ink-mute)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>CLINICALMIND</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cm-ink)', letterSpacing: '-0.01em' }}>Rev 2.6</div>
        </div>
      </div>

      {/* Section label */}
      <div className="px-4 pt-4 pb-1">
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8.5, color: 'var(--cm-ink-faint)', letterSpacing: '0.22em', fontWeight: 600, textTransform: 'uppercase' }}>
          OPERATIONS
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-1 py-1 overflow-y-auto space-y-0.5">
        {NAV_ITEMS.map(item => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      {/* Footer — sign out */}
      <div className="px-1 py-2" style={{ borderTop: '1px solid var(--cm-line)' }}>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2.5 w-full px-3 py-2 transition-all duration-100 border-l-[3px] border-transparent hover:border-[var(--cm-danger)] hover:bg-[var(--cm-danger-soft)]"
          style={{ borderRadius: 0, fontSize: 13, fontWeight: 500, color: 'var(--cm-ink-mute)' }}
        >
          <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}

export function MobileNav() {
  const mobileItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Home',     code: '01' },
    { to: '/clients',   icon: Users,           label: 'Clients',  code: '02' },
    { to: '/sessions',  icon: Mic,             label: 'Sessions', code: '03' },
    { to: '/safety',    icon: ShieldAlert,     label: 'Safety',   code: '04' },
    { to: '/dsm',       icon: BookOpen,        label: 'DSM-5',    code: '06' },
    { to: '/settings',  icon: Settings,        label: 'Settings', code: '07' },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 pb-safe"
      style={{ background: 'var(--cm-surface)', borderTop: '1px solid var(--cm-line)' }}
    >
      <div className="flex items-stretch justify-around px-1 pt-1 pb-2">
        {mobileItems.map(item => (
          <NavItem key={item.to} {...item} mobile />
        ))}
      </div>
    </nav>
  )
}
