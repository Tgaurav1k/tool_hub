import { useCallback, useMemo } from 'react'
import type { TopBarNotification } from '@toolhub/ui'
import { notificationsApi } from '@toolhub/api-client'
import { useNotificationStore } from '../stores/notificationStore'

/**
 * Wires the notification store into TopBar props. Read/dismiss/clear are
 * optimistic in the local store and written through to the server so state
 * survives logout and refresh.
 */
export function useTopBarNotifications(): {
  notifications: TopBarNotification[]
  onMarkAllRead: () => void
  onDismissNotification: (id: string) => void
  onClearAllNotifications: () => void
} {
  const history = useNotificationStore((s) => s.history)
  const markAllReadLocal = useNotificationStore((s) => s.markAllRead)
  const dismissItemLocal = useNotificationStore((s) => s.dismissItem)
  const clearAllLocal = useNotificationStore((s) => s.clearAll)

  const notifications = useMemo<TopBarNotification[]>(
    () =>
      history.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        createdAt: n.createdAt,
        read: n.read,
      })),
    [history],
  )

  const onMarkAllRead = useCallback(() => {
    markAllReadLocal()
    void notificationsApi.markAllNotificationsRead().catch(() => {
      /* non-fatal — next fetch will reconcile */
    })
  }, [markAllReadLocal])

  const onDismissNotification = useCallback(
    (id: string) => {
      dismissItemLocal(id)
      void notificationsApi.deleteMyNotification(id).catch(() => {})
    },
    [dismissItemLocal],
  )

  const onClearAllNotifications = useCallback(() => {
    clearAllLocal()
    void notificationsApi.clearMyNotifications().catch(() => {})
  }, [clearAllLocal])

  return {
    notifications,
    onMarkAllRead,
    onDismissNotification,
    onClearAllNotifications,
  }
}
