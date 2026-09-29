import { create } from 'zustand'

export interface AccessToast {
  id: string
  title: string
  body: string
  createdAt: number
}

export interface NotificationItem {
  id: string
  title: string
  body: string
  createdAt: number
  read: boolean
}

interface NotificationState {
  /** Transient toasts that auto-dismiss. Kept in sync with recent history entries. */
  toasts: AccessToast[]
  /** Persistent notification history (capped). Hydrated from server on login. */
  history: NotificationItem[]
  /** Replaces the whole history (e.g. on login fetch). */
  hydrate: (items: NotificationItem[]) => void
  /** Adds a new toast + history item (used when SSE events arrive). */
  push: (t: { id?: string; title: string; body: string; createdAt?: number }) => void
  dismiss: (id: string) => void
  markAllRead: () => void
  dismissItem: (id: string) => void
  clearAll: () => void
  /** Clears local state (call on logout). */
  reset: () => void
}

const HISTORY_LIMIT = 50

function newId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `t-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export const useNotificationStore = create<NotificationState>((set) => ({
  toasts: [],
  history: [],
  hydrate: (items) =>
    set({ history: [...items].slice(0, HISTORY_LIMIT) }),
  push: ({ id, title, body, createdAt }) =>
    set((s) => {
      const finalId = id ?? newId()
      const ts = createdAt ?? Date.now()
      const toast: AccessToast = { id: finalId, title, body, createdAt: ts }
      const item: NotificationItem = { id: finalId, title, body, createdAt: ts, read: false }
      // De-dupe on id (SSE event that was also persisted could be fetched shortly after).
      const dedupedHistory = [item, ...s.history.filter((n) => n.id !== finalId)].slice(0, HISTORY_LIMIT)
      return {
        toasts: [...s.toasts, toast].slice(-5),
        history: dedupedHistory,
      }
    }),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  markAllRead: () =>
    set((s) => ({
      history: s.history.map((n) => (n.read ? n : { ...n, read: true })),
    })),
  dismissItem: (id) => set((s) => ({ history: s.history.filter((n) => n.id !== id) })),
  clearAll: () => set({ history: [] }),
  reset: () => set({ toasts: [], history: [] }),
}))
