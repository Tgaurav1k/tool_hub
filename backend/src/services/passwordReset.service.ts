import prisma from '../db/prisma'
import { hashPassword } from './auth.service'
import { syncUserToLinkedTool } from './linkedToolSync.service'

/** Slugs of linked tools that expose a `/api/admin/sync-user` endpoint. */
const TOOLS_WITH_SYNC_API = new Set(['image-generation'])

type UserForReset = {
  id: string
  email: string
  toolAssignments: { toolRole: string; tool: { name: string; slug: string | null } }[]
}

/**
 * Hash+store a new password and push it to any linked external tools the user
 * is assigned to. Shared by admin reset and self-service forgot-password.
 * Email delivery is left to the caller (timing/message differ per flow).
 */
export async function resetUserPassword(user: UserForReset, newPassword: string) {
  const passwordHash = await hashPassword(newPassword)
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } })

  const linkedToolSyncWarnings: string[] = []
  let resyncedToolCount = 0
  for (const a of user.toolAssignments) {
    if (!a.tool.slug || !TOOLS_WITH_SYNC_API.has(a.tool.slug)) continue
    resyncedToolCount++
    const sync = await syncUserToLinkedTool(newPassword, user.email, a.toolRole as 'user' | 'admin')
    if (!sync.ok) linkedToolSyncWarnings.push(`${a.tool.name}: ${sync.message}`)
  }

  return { resyncedToolCount, linkedToolSyncWarnings }
}
