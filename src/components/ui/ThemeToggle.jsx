import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'

export function ThemeToggle() {
  const { dark, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="flex items-center gap-1.5 px-2.5 py-1.5 border border-border rounded-sm text-text-muted hover:text-text-primary hover:border-border-light hover:bg-surface-2 transition-all duration-150"
      style={{ borderRadius: 2, fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.14em' }}
    >
      {dark
        ? <><Sun className="w-3.5 h-3.5" /><span className="hidden sm:inline">LIGHT</span></>
        : <><Moon className="w-3.5 h-3.5" /><span className="hidden sm:inline">DARK</span></>
      }
    </button>
  )
}
