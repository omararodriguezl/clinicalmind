import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Mic,
  ShieldAlert,
  ClipboardList,
  BookOpen,
  Settings,
  LogOut,
  Activity,
  Brain,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/sessions', icon: Mic, label: 'Sessions' },
  { to: '/safety', icon: ShieldAlert, label: 'Safety Plans' },
  { to: '/staffing', icon: ClipboardList, label: 'Staffing' },
  { to: '/dsm', icon: BookOpen, label: 'DSM-5 Reference' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

function NavItem({ to, icon: Icon, label, mobile = false }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          isActive
            ? 'bg-primary/10 text-primary border border-primary/20'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface-2 border border-transparent',
          mobile ? 'flex-col gap-1 text-xs p-2 text-center' : '',
        ].join(' ')
      }
    >
      <Icon className={mobile ? 'w-5 h-5' : 'w-4 h-4 flex-shrink-0'} />
      <span className={mobile ? 'text-[10px] leading-tight' : ''}>{label}</span>
    </NavLink>
  )
}

// Desktop sidebar
export function Sidebar() {
  const { signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Signed out')
    } catch {
      toast.error('Failed to sign out')
    }
  }

  return (
    <aside className="hidden md:flex flex-col w-56 flex-shrink-0 bg-surface border-r border-border h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-border">
        <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
          <Brain className="w-4 h-4 text-primary" />
        </div>
        <div>
          <div className="text-sm font-bold text-text-primary">ClinicalMind</div>
          <div className="text-[10px] text-text-muted leading-tight">v1.0</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-border">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm font-medium text-text-secondary hover:text-danger hover:bg-danger-muted/30 transition-all duration-150"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}

// Mobile bottom tab bar
export function MobileNav() {
  const location = useLocation()

  // Only show 5 most important items on mobile
  const mobileItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { to: '/clients', icon: Users, label: 'Clients' },
    { to: '/sessions', icon: Mic, label: 'Sessions' },
    { to: '/safety', icon: ShieldAlert, label: 'Safety' },
    { to: '/dsm', icon: BookOpen, label: 'DSM-5' },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-40 pb-safe">
      <div className="flex items-stretch justify-around px-2 pt-1">
        {mobileItems.map((item) => (
          <NavItem key={item.to} {...item} mobile />
        ))}
      </div>
    </nav>
  )
}
