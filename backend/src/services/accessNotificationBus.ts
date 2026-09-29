import type { Request, Response } from 'express'
import { persistNotification } from './notificationPersistence.service'

export type AccessNotifyPayload = {
  type: 'access_update'
  scope: 'categories' | 'linked_tools' | 'account'
  title: string
  message: string
}

const subscribers = new Map<string, Set<Response>>()

export function subscribeAccessNotifications(userId: string, req: Request, res: Response) {
  res.status(200)
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  ;(res as Response & { flushHeaders?: () => void }).flushHeaders?.()

  if (!subscribers.has(userId)) subscribers.set(userId, new Set())
  subscribers.get(userId)!.add(res)

  res.write(': connected\n\n')

  const ping = setInterval(() => {
    try {
      res.write(': ping\n\n')
    } catch {
      clearInterval(ping)
      subscribers.get(userId)?.delete(res)
    }
  }, 20000)

  let cleaned = false
  const cleanup = () => {
    if (cleaned) return
    cleaned = true
    clearInterval(ping)
    subscribers.get(userId)?.delete(res)
    if (subscribers.get(userId)?.size === 0) subscribers.delete(userId)
    try {
      res.end()
    } catch {
      // ignore
    }
  }

  req.on('close', cleanup)
  res.on('close', cleanup)
}

export function publishAccessNotification(targetUserId: string, payload: AccessNotifyPayload) {
  // Always persist so offline users see it on next login. Fire-and-forget.
  void persistNotification({
    userId: targetUserId,
    type: payload.type,
    scope: payload.scope,
    title: payload.title,
    body: payload.message,
  })

  const set = subscribers.get(targetUserId)
  if (!set || set.size === 0) return

  const body = `data: ${JSON.stringify(payload)}\n\n`
  for (const res of [...set]) {
    try {
      res.write(body)
    } catch {
      set.delete(res)
    }
  }
}
