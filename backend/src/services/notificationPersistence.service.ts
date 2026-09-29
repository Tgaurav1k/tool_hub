import prisma from '../db/prisma'

/** How long a notification row sticks around before it's auto-deleted. */
const RETENTION_DAYS = Number(process.env.NOTIFICATION_RETENTION_DAYS ?? 7)

function retentionCutoff(): Date {
  const d = new Date()
  d.setDate(d.getDate() - RETENTION_DAYS)
  return d
}

/** Removes every row older than the retention window. Returns how many were deleted. */
export async function purgeExpiredNotifications(): Promise<number> {
  const cutoff = retentionCutoff()
  const { count } = await prisma.notification.deleteMany({
    where: { createdAt: { lt: cutoff } },
  })
  return count
}

export interface PersistNotificationInput {
  userId: string
  type: string
  scope?: string | null
  title: string
  body: string
}

/**
 * Writes a notification row to the DB so the user sees it in their bell panel
 * on next login, even if they were offline when the event fired.
 * Failures are swallowed (notifications must never break a write endpoint).
 */
export async function persistNotification(input: PersistNotificationInput): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        scope: input.scope ?? null,
        title: input.title,
        body: input.body,
      },
    })
  } catch (err) {
    console.error('[notifications] failed to persist:', err)
  }
}

export async function listUserNotifications(userId: string, limit = 50) {
  return prisma.notification.findMany({
    where: { userId, createdAt: { gte: retentionCutoff() } },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

export async function markNotificationRead(userId: string, id: string) {
  const { count } = await prisma.notification.updateMany({
    where: { id, userId },
    data: { read: true },
  })
  return count > 0
}

export async function markAllNotificationsRead(userId: string) {
  const { count } = await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  })
  return count
}

export async function deleteNotification(userId: string, id: string) {
  const { count } = await prisma.notification.deleteMany({
    where: { id, userId },
  })
  return count > 0
}

export async function deleteAllNotifications(userId: string) {
  const { count } = await prisma.notification.deleteMany({
    where: { userId },
  })
  return count
}
