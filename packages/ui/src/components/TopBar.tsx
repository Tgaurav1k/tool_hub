import React, { useEffect, useRef, useState } from 'react'
import { C, shadows, headerGlass } from '@toolhub/config'
import { Search, Bell, X, BellOff } from 'lucide-react'
import { Badge } from './Badge'

export interface TopBarNotification {
  id: string
  title: string
  body: string
  createdAt: number
  read: boolean
}

interface TopBarProps {
  userName: string
  userAvatarUrl?: string | null
  userRole: string
  search: string
  onSearchChange: (val: string) => void
  roleColor?: string
  notifications?: TopBarNotification[]
  onMarkAllRead?: () => void
  onDismissNotification?: (id: string) => void
  onClearAllNotifications?: () => void
}

function formatRelative(ts: number): string {
  const diff = Math.max(0, Date.now() - ts)
  const s = Math.floor(diff / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(ts).toLocaleDateString()
}

export function TopBar({
  userName,
  userAvatarUrl,
  userRole,
  search,
  onSearchChange,
  roleColor = C.sand500,
  notifications,
  onMarkAllRead,
  onDismissNotification,
  onClearAllNotifications,
}: TopBarProps) {
  const [bellOpen, setBellOpen] = useState(false)
  const bellRef = useRef<HTMLDivElement | null>(null)
  const unreadCount = (notifications ?? []).filter((n) => !n.read).length

  useEffect(() => {
    if (!bellOpen) return
    const onDoc = (e: MouseEvent) => {
      if (!bellRef.current) return
      if (!bellRef.current.contains(e.target as Node)) setBellOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setBellOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [bellOpen])

  const openBell = () => {
    setBellOpen((v) => {
      const next = !v
      if (next && unreadCount > 0 && onMarkAllRead) onMarkAllRead()
      return next
    })
  }

  return (
    <header
      className="tb-topbar"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        background: headerGlass.background,
        backdropFilter: headerGlass.blur,
        WebkitBackdropFilter: headerGlass.blur,
        borderBottom: headerGlass.border,
        boxShadow: '0 1px 0 rgba(255, 255, 255, 0.5)',
        gap: '16px',
        flexWrap: 'wrap',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        className="tb-topbar-search"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255, 253, 249, 0.55)',
          borderRadius: '12px',
          padding: '8px 14px',
          flex: '1 1 240px',
          maxWidth: '400px',
          border: `1px solid rgba(222, 204, 176, 0.45)`,
          boxShadow: `${shadows.sm}, inset 0 1px 0 rgba(255,255,255,0.6)`,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      >
        <Search size={16} color={C.sand300} />
        <input
          type="text"
          placeholder="Search tools..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            border: 'none',
            background: 'transparent',
            outline: 'none',
            fontSize: '14px',
            color: C.coffee800,
            width: '100%',
            fontFamily: 'inherit',
          }}
        />
      </div>

      <div className="tb-topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div ref={bellRef} style={{ position: 'relative' }}>
          <button
            type="button"
            aria-label="Notifications"
            aria-expanded={bellOpen}
            onClick={openBell}
            style={{
              background: bellOpen ? `${C.sand500}18` : 'none',
              border: 'none',
              cursor: 'pointer',
              color: C.sand600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              width: 36,
              height: 36,
              borderRadius: 10,
              transition: 'background 0.15s ease',
            }}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span
                aria-label={`${unreadCount} unread notifications`}
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  minWidth: 16,
                  height: 16,
                  padding: '0 4px',
                  borderRadius: 999,
                  background: C.danger,
                  color: '#FFFFFF',
                  fontSize: 10,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 0 2px #FBF6ED',
                  lineHeight: 1,
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {bellOpen && (
            <div
              role="dialog"
              aria-label="Notifications"
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                width: 360,
                maxWidth: 'calc(100vw - 32px)',
                background: '#FFFFFF',
                border: `1px solid ${C.sand200}`,
                borderRadius: 14,
                boxShadow: '0 12px 32px rgba(69, 54, 34, 0.18), 0 2px 6px rgba(69, 54, 34, 0.08)',
                zIndex: 1000,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderBottom: `1px solid ${C.sand100}`,
                  background: C.sand50,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 700, color: C.coffee800 }}>Notifications</div>
                {(notifications?.length ?? 0) > 0 && onClearAllNotifications && (
                  <button
                    type="button"
                    onClick={() => onClearAllNotifications()}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: C.sand600,
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 600,
                      fontFamily: 'inherit',
                    }}
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {!notifications || notifications.length === 0 ? (
                  <div
                    style={{
                      padding: '28px 16px',
                      textAlign: 'center',
                      color: C.sand600,
                      fontSize: 13,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <BellOff size={22} color={C.sand300} />
                    <div style={{ fontWeight: 600, color: C.coffee800 }}>No notifications</div>
                    <div style={{ fontSize: 12 }}>You&apos;re all caught up.</div>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        padding: '12px 16px',
                        borderBottom: `1px solid ${C.sand100}`,
                        background: n.read ? 'transparent' : `${C.sand500}0A`,
                        position: 'relative',
                      }}
                    >
                      <span
                        aria-hidden
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: n.read ? C.sand200 : C.sand500,
                          marginTop: 6,
                          flexShrink: 0,
                          boxShadow: n.read ? 'none' : `0 0 0 3px ${C.sand500}22`,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: C.coffee800,
                            marginBottom: 2,
                          }}
                        >
                          {n.title}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: C.sand600,
                            lineHeight: 1.45,
                            wordBreak: 'break-word',
                          }}
                        >
                          {n.body}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: C.sand500,
                            marginTop: 4,
                            fontWeight: 600,
                          }}
                        >
                          {formatRelative(n.createdAt)}
                        </div>
                      </div>
                      {onDismissNotification && (
                        <button
                          type="button"
                          aria-label="Dismiss notification"
                          onClick={() => onDismissNotification(n.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: C.sand500,
                            padding: 2,
                            borderRadius: 6,
                            display: 'flex',
                            flexShrink: 0,
                          }}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: '10px',
              background: `${roleColor}20`,
              color: roleColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: 700,
              flexShrink: 0,
              overflow: 'hidden',
            }}
          >
            {userAvatarUrl ? (
              <img
                src={userAvatarUrl}
                alt={userName}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }}
              />
            ) : (
              userName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()
            )}
          </div>
          <div className="tb-topbar-user-meta">
            <div className="tb-topbar-user-meta-name" style={{ fontSize: '13px', fontWeight: 600, color: C.coffee800 }}>{userName}</div>
            <Badge color={roleColor} bg={`${roleColor}15`} size="sm">
              {userRole}
            </Badge>
          </div>
        </div>
      </div>
    </header>
  )
}
