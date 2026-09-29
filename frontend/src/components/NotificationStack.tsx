import { useEffect } from 'react'
import { C } from '@toolhub/config'
import { useNotificationStore, type AccessToast } from '../stores/notificationStore'

const AUTO_DISMISS_MS = 9000

function ToastCard({ toast }: { toast: AccessToast }) {
  const dismiss = useNotificationStore((s) => s.dismiss)

  useEffect(() => {
    const timer = window.setTimeout(() => dismiss(toast.id), AUTO_DISMISS_MS)
    return () => window.clearTimeout(timer)
  }, [toast.id, dismiss])

  return (
    <div
      style={{
        pointerEvents: 'auto',
        background: C.cardBg,
        border: `1px solid ${C.sand200}`,
        borderRadius: 12,
        padding: '12px 14px',
        boxShadow: '0 8px 28px rgba(62,46,30,0.12)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: C.coffee800, marginBottom: 4 }}>{toast.title}</div>
          <div style={{ fontSize: 12, color: C.sand600, lineHeight: 1.45 }}>{toast.body}</div>
        </div>
        <button
          type="button"
          onClick={() => dismiss(toast.id)}
          aria-label="Dismiss"
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: C.sand500,
            fontSize: 18,
            lineHeight: 1,
            padding: 0,
            flexShrink: 0,
          }}
        >
          ×
        </button>
      </div>
    </div>
  )
}

export function NotificationStack() {
  const toasts = useNotificationStore((s) => s.toasts)

  if (toasts.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 100000,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        maxWidth: 380,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} />
      ))}
    </div>
  )
}
