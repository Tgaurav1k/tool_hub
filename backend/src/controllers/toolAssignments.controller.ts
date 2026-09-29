import { Request, Response } from 'express'
import prisma from '../db/prisma'
import { syncUserToLinkedTool } from '../services/linkedToolSync.service'
import { publishAccessNotification } from '../services/accessNotificationBus'
import { sendAccessUpdateEmail } from '../services/email.service'

export async function getUserToolAssignments(req: Request, res: Response) {
  const { userId } = req.params

  const assignments = await prisma.userToolAssignment.findMany({
    where: { userId },
    include: {
      tool: { select: { id: true, name: true, slug: true, icon: true, url: true } },
      assignedBy: { select: { id: true, name: true } },
    },
    orderBy: { assignedAt: 'desc' },
  })

  res.json({ assignments })
}

export async function syncUserToolAssignments(req: Request, res: Response) {
  const { userId } = req.params
  const { toolAssignments, password } = req.body as {
    toolAssignments: { toolId: string; toolRole: 'user' | 'admin' }[]
    password?: string
  }
  const assigner = req.user!

  if (assigner.role !== 'superadmin') {
    return res.status(403).json({ error: 'Only SuperAdmin can manage linked tool access.' })
  }

  const targetUser = await prisma.user.findUnique({ where: { id: userId } })
  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' })
  }

  const gatedTools = await prisma.tool.findMany({
    where: { requiresToolAssignment: true },
    select: { id: true, name: true, categoryId: true },
  })
  const gatedToolIds = new Set(gatedTools.map((t) => t.id))

  for (const a of toolAssignments) {
    if (!gatedToolIds.has(a.toolId)) {
      return res.status(400).json({ error: `Tool ID "${a.toolId}" is not a linked tool.` })
    }
  }

  const desiredToolIds = new Set(toolAssignments.map((a) => a.toolId))

  const beforeRows = await prisma.userToolAssignment.findMany({
    where: { userId, toolId: { in: [...gatedToolIds] } },
    include: { tool: { select: { id: true, name: true } } },
  })
  const beforeByToolId = new Map(beforeRows.map((r) => [r.toolId, { name: r.tool.name, role: r.toolRole }]))

  const toRemove = [...gatedToolIds].filter((id) => !desiredToolIds.has(id))
  if (toRemove.length > 0) {
    await prisma.userToolAssignment.deleteMany({
      where: { userId, toolId: { in: toRemove } },
    })
  }

  const syncWarnings: string[] = []

  for (const a of toolAssignments) {
    await prisma.userToolAssignment.upsert({
      where: { userId_toolId: { userId, toolId: a.toolId } },
      create: {
        userId,
        toolId: a.toolId,
        toolRole: a.toolRole,
        assignedById: assigner.id,
      },
      update: { toolRole: a.toolRole, assignedById: assigner.id },
    })

    if (password) {
      const sync = await syncUserToLinkedTool(password, targetUser.email, a.toolRole)
      if (!sync.ok) {
        const tool = gatedTools.find((t) => t.id === a.toolId)
        syncWarnings.push(`${tool?.name ?? a.toolId}: ${sync.message}`)
      }
    }
  }

  const neededCatIds = gatedTools
    .filter((t) => desiredToolIds.has(t.id))
    .map((t) => t.categoryId)

  for (const catId of neededCatIds) {
    const exists = await prisma.categoryAssignment.findUnique({
      where: { userId_categoryId: { userId, categoryId: catId } },
    })
    if (!exists) {
      await prisma.categoryAssignment.create({
        data: { userId, categoryId: catId, assignedById: assigner.id },
      })
    }
  }

  const assignments = await prisma.userToolAssignment.findMany({
    where: { userId },
    include: {
      tool: { select: { id: true, name: true, slug: true, icon: true, url: true } },
      assignedBy: { select: { id: true, name: true } },
    },
    orderBy: { assignedAt: 'desc' },
  })

  res.json({ assignments, syncWarnings })

  const afterGated = assignments.filter((a) => gatedToolIds.has(a.toolId))
  const afterByToolId = new Map(afterGated.map((r) => [r.toolId, { name: r.tool.name, role: r.toolRole }]))

  const addedNames: string[] = []
  const removedNames: string[] = []
  const roleChangedNames: string[] = []

  for (const id of desiredToolIds) {
    if (!gatedToolIds.has(id)) continue
    if (!beforeByToolId.has(id) && afterByToolId.has(id)) {
      addedNames.push(afterByToolId.get(id)!.name)
    }
  }
  for (const [id, prev] of beforeByToolId) {
    if (!desiredToolIds.has(id)) {
      removedNames.push(prev.name)
      continue
    }
    const next = afterByToolId.get(id)
    if (next && prev.role !== next.role) roleChangedNames.push(next.name)
  }

  if (addedNames.length || removedNames.length || roleChangedNames.length) {
    const parts: string[] = []
    if (addedNames.length) parts.push(`New tool access: ${addedNames.join(', ')}`)
    if (removedNames.length) parts.push(`Access removed: ${removedNames.join(', ')}`)
    if (roleChangedNames.length) parts.push(`Role updated for: ${roleChangedNames.join(', ')}`)
    publishAccessNotification(userId, {
      type: 'access_update',
      scope: 'linked_tools',
      title: 'Your tool access was updated',
      message: `${parts.join('. ')}. Your dashboard will refresh automatically.`,
    })

    const freshUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        role: true,
        categoryAssignments: {
          select: {
            restrictStandardTools: true,
            category: {
              select: {
                name: true,
                tools: {
                  where: { requiresToolAssignment: false },
                  select: { id: true, name: true, url: true },
                  orderBy: { name: 'asc' },
                },
              },
            },
          },
        },
        toolAssignments: {
          include: { tool: { select: { name: true, url: true } } },
        },
      },
    })
    if (freshUser) {
      const allowRows = await prisma.userToolAllow.findMany({
        where: { userId },
        select: { toolId: true },
      })
      const allowedIds = new Set(allowRows.map((r) => r.toolId))
      const categoryNames = freshUser.categoryAssignments.map((a) => a.category.name)
      const standardTools = freshUser.categoryAssignments.flatMap((a) => {
        const catTools = a.category.tools
        if (a.restrictStandardTools) return catTools.filter((t) => allowedIds.has(t.id))
        return catTools
      })
      const linkedTools = freshUser.toolAssignments.map((a) => ({
        name: a.tool.name,
        url: a.tool.url,
      }))
      const seen = new Set<string>()
      const tools = [...standardTools.map((t) => ({ name: t.name, url: t.url })), ...linkedTools].filter((t) => {
        if (seen.has(t.name)) return false
        seen.add(t.name)
        return true
      })
      await sendAccessUpdateEmail({
        to: freshUser.email,
        name: freshUser.name,
        role: freshUser.role === 'admin' ? 'admin' : 'user',
        categories: categoryNames,
        tools,
        changeSummary: parts.join('. '),
      })
    }
  }
}
