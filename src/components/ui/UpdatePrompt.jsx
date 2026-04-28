import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw } from 'lucide-react'

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(env(safe-area-inset-bottom) + 80px)',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 16px',
      background: 'var(--cm-od)',
      color: '#fff',
      borderRadius: 4,
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 13,
      fontWeight: 500,
      whiteSpace: 'nowrap',
    }}>
      <RefreshCw style={{ width: 14, height: 14, flexShrink: 0 }} />
      <span>New version available</span>
      <button
        onClick={() => updateServiceWorker(true)}
        style={{
          marginLeft: 4,
          padding: '3px 10px',
          background: 'rgba(255,255,255,0.2)',
          border: '1px solid rgba(255,255,255,0.4)',
          borderRadius: 2,
          color: '#fff',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Update
      </button>
    </div>
  )
}
