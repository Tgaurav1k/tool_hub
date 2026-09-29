import { Request, Response } from 'express'
import prisma from '../db/prisma'
import { syncCategoryAssignments } from '../services/assignment.service'
import { publishAccessNotification } from '../services/accessNotificationBus'
import { pruneUserToolAllowsOutsideCategories, syncStandardToolAccessForUser } from '../services/explicitToolAllow.service'
import { sendAccessUpdateEmail } from '../services/email.service'

export async function getUserAssignments(req: Request, res: Response) {
  const { userId } = req.params

  const assignments = await prisma.categoryAssignment.findMany({
    where: { userId },
    include: {
      category: {
        include: { tools: { orderBy: { name: 'asc' } } },
      },
      assignedBy: { select: { id: true, name: true } },
    },
    orderBy: { category: { sortOrder: 'asc' } },
  })

  const explicitRows = await prisma.userToolAllow.findMany({
    where: { userId },
    select: { toolId: true },
  })

  res.json({ assignments, explicitToolIds: explicitRows.map((r) => r.toolId) })
}

export async function assignCategories(req: Request, res: Response) {
  const { userId, categoryIds, explicitToolIds, suppressNotification } = req.body as {
    userId: string
    categoryIds: string[]
    explicitToolIds?: string[]
    suppressNotification?: boolean
  }
  const assigner = req.user!

  const targetUser = await prisma.user.findUnique({ where: { id: userId } })
  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' })
  }

  const ids = Array.isArray(categoryIds) ? (categoryIds as string[]) : []

  if (assigner.role === 'admin') {
    if (targetUser.createdById !== assigner.id) {
      return res.status(403).json({ error: 'You can only assign categories to your own users' })
    }

    const myAssignments = await prisma.categoryAssignment.findMany({
      where: { userId: assigner.id },
      select: { categoryId: true },
    })
    const myCategories = new Set(myAssignments.map((a) => a.categoryId))

    const unauthorized = ids.filter((id: string) => !myCategories.has(id))
    if (unauthorized.length > 0) {
      return res
        .status(403)
        .json({ error: 'You can only assign categories that you have access to' })
    }
  }

  const existing = await prisma.categoryAssignment.findMany({
    where: { userId },
    include: { category: { select: { name: true } } },
  })
  const existingIds = new Set(existing.map((e) => e.categoryId))
  const desiredIds = new Set(ids)
  const addedIds = ids.filter((id) => !existingIds.has(id))
  const removed = existing.filter((e) => !desiredIds.has(e.categoryId))

  const result = await syncCategoryAssignments(userId, ids, assigner.id)

  await pruneUserToolAllowsOutsideCategories(userId, ids)

  if (explicitToolIds !== undefined) {
    await syncStandardToolAccessForUser(userId, ids, explicitToolIds, assigner.id)
  }

  const explicitRows = await prisma.userToolAllow.findMany({
    where: { userId },
    select: { toolId: true },
  })

  res.json({ assignments: result, explicitToolIds: explicitRows.map((r) => r.toolId) })

  if (!suppressNotification && (addedIds.length || removed.length || explicitToolIds !== undefined)) {
    const addedNames =
      addedIds.length > 0
        ? (
            await prisma.category.findMany({
              where: { id: { in: addedIds } },
              select: { name: true },
            })
          ).map((c) => c.name)
        : []
    const removedNames = removed.map((r) => r.category.name)
    const parts: string[] = []
    if (addedNames.length) parts.push(`Added categories: ${addedNames.join(', ')}`)
    if (removedNames.length) parts.push(`Removed categories: ${removedNames.join(', ')}`)
    if (explicitToolIds !== undefined) parts.push('Per-tool access was updated')
    publishAccessNotification(userId, {
      type: 'access_update',
      scope: 'categories',
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

export async function removeAssignment(req: Request, res: Response) {
  const { userId, categoryId } = req.params
  const assigner = req.user!

  if (assigner.role === 'admin') {
    const targetUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!targetUser || targetUser.createdById !== assigner.id) {
      return res
        .status(403)
        .json({ error: 'You can only remove assignments from your own users' })
    }
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { name: true },
  })

  const removedCount = (
    await prisma.categoryAssignment.deleteMany({
      where: { userId, categoryId },
    })
  ).count

  res.json({ message: 'Assignment removed' })

  if (removedCount > 0) {
    await prisma.userToolAllow.deleteMany({
      where: { userId, tool: { categoryId } },
    })
    publishAccessNotification(userId, {
      type: 'access_update',
      scope: 'categories',
      title: 'Your tool access was updated',
      message: `Removed category access: ${category?.name ?? 'Unknown'}. Related tools may disappear from your dashboard.`,
    })
  }
}
