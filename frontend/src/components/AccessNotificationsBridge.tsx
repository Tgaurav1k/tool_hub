import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { API_URL } from '@toolhub/config'
import { notificationsApi } from '@toolhub/api-client'
import { useAppStore } from '../stores/appStore'
import { useNotificationStore } from '../stores/notificationStore'

function notificationsStreamUrl() {
  const base = API_URL.startsWith('http')
    ? API_URL
    : `${window.location.origin}${API_URL.startsWith('/') ? '' : '/'}${API_URL}`
  return `${base.replace(/\/$/, '')}/notifications/stream`
}

export function AccessNotificationsBridge() {
  const user = useAppStore((s) => s.user)
  const queryClient = useQueryClient()
  const push = useNotificationStore((s) => s.push)
  const hydrate = useNotificationStore((s) => s.hydrate)
  const reset = useNotificationStore((s) => s.reset)
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!user) {
      esRef.current?.close()
      esRef.current = null
      reset()
      return
    }

    // 1. Hydrate persistent history from the server so offline events show up.
    let cancelled = false
    void notificationsApi
      .listMyNotifications()
      .then((res) => {
        if (cancelled) return
        hydrate(
          res.notifications.map((n) => ({
            id: n.id,
            title: n.title,
            body: n.body,
            createdAt: new Date(n.createdAt).getTime(),
            read: n.read,
          })),
        )
      })
      .catch(() => {
        // non-fatal; SSE will still deliver live events
      })

    // 2. Subscribe to live stream for anything that happens while we're open.
    const url = notificationsStreamUrl()
    const es = new EventSource(url)
    esRef.current = es

    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data) as { type?: string; title?: string; message?: string }
        if (data?.type === 'access_update') {
          push({
            title: data.title ?? 'Access updated',
            body: data.message ?? 'Your permissions may have changed.',
          })
          void queryClient.invalidateQueries({ queryKey: ['assigned-tools'] })
          void queryClient.invalidateQueries({ queryKey: ['categories'] })
          void queryClient.invalidateQueries({ queryKey: ['tools'] })
          void queryClient.invalidateQueries({ queryKey: ['tool-assignments'] })
        }
      } catch {
        // ignore malformed events
      }
    }

    return () => {
      cancelled = true
      es.close()
      if (esRef.current === es) esRef.current = null
    }
  }, [user?.id, queryClient, push, hydrate, reset])

  return null
}
