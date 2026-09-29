import type { Request, Response } from 'express'
import { subscribeAccessNotifications } from '../services/accessNotificationBus'
import {
  listUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllNotifications,
} from '../services/notificationPersistence.service'

/** SSE stream: only the signed-in user receives their own access-change events. */
export function streamAccessNotifications(req: Request, res: Response) {
  subscribeAccessNotifications(req.user!.id, req, res)
}

export async function getMyNotifications(req: Request, res: Response) {
  const items = await listUserNotifications(req.user!.id)
  res.json({ notifications: items })
}

export async function markMyNotificationRead(req: Request, res: Response) {
  const ok = await markNotificationRead(req.user!.id, req.params.id)
  if (!ok) return res.status(404).json({ error: 'Notification not found' })
  res.json({ ok: true })
}

export async function markAllMyNotificationsRead(req: Request, res: Response) {
  const count = await markAllNotificationsRead(req.user!.id)
  res.json({ ok: true, count })
}

export async function deleteMyNotification(req: Request, res: Response) {
  const ok = await deleteNotification(req.user!.id, req.params.id)
  if (!ok) return res.status(404).json({ error: 'Notification not found' })
  res.json({ ok: true })
}

export async function clearMyNotifications(req: Request, res: Response) {
  const count = await deleteAllNotifications(req.user!.id)
  res.json({ ok: true, count })
}
