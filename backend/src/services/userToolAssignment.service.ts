import prisma from '../db/prisma'
import { syncUserToLinkedTool } from './linkedToolSync.service'

/** Slugs of tools that expose a `/api/admin/sync-user` endpoint we can push credentials to. */
const TOOLS_WITH_SYNC_API = new Set(['image-generation'])

export async function applyUserToolAssignments(
  userId: string,
  email: string,
  plainPassword: string,
  assignments: { toolId: string; toolRole: 'user' | 'admin' }[],
  assignedById: string,
): Promise<{ syncWarnings: string[] }> {
  const syncWarnings: string[] = []

  for (const a of assignments) {
    const tool = await prisma.tool.findUnique({ where: { id: a.toolId } })
    if (!tool?.requiresToolAssignment) {
      continue
    }

    await prisma.userToolAssignment.upsert({
      where: { userId_toolId: { userId, toolId: a.toolId } },
      create: {
        userId,
        toolId: a.toolId,
        toolRole: a.toolRole,
        assignedById,
      },
      update: { toolRole: a.toolRole, assignedById },
    })

    if (tool.slug && TOOLS_WITH_SYNC_API.has(tool.slug)) {
      const sync = await syncUserToLinkedTool(plainPassword, email, a.toolRole)
      if (!sync.ok) {
        syncWarnings.push(`${tool.name}: ${sync.message}`)
      }
    }
  }

  return { syncWarnings }
}
