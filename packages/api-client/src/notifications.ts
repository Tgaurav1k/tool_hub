import { apiRequest } from '@toolhub/auth'

export interface NotificationRecord {
  id: string
  type: string
  scope: string | null
  title: string
  body: string
  read: boolean
  createdAt: string
}

export async function listMyNotifications() {
  return apiRequest<{ notifications: NotificationRecord[] }>('/notifications')
}

export async function markNotificationRead(id: string) {
  return apiRequest<{ ok: true }>(`/notifications/${id}/read`, { method: 'PATCH' })
}

export async function markAllNotificationsRead() {
  return apiRequest<{ ok: true; count: number }>(`/notifications/read-all`, { method: 'PATCH' })
}

export async function deleteMyNotification(id: string) {
  return apiRequest<{ ok: true }>(`/notifications/${id}`, { method: 'DELETE' })
}

export async function clearMyNotifications() {
  return apiRequest<{ ok: true; count: number }>(`/notifications`, { method: 'DELETE' })
}
