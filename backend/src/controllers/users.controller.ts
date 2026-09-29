import { Request, Response } from 'express'
import prisma from '../db/prisma'
import { hashPassword } from '../services/auth.service'
import { syncCategoryAssignments } from '../services/assignment.service'
import { freezeCategoryToCurrentTools } from '../services/explicitToolAllow.service'
import { applyUserToolAssignments } from '../services/userToolAssignment.service'
import { resetUserPassword } from '../services/passwordReset.service'
import { parseAvatarInput, toAvatarDataUrl } from '../utils/avatar'
import { publishAccessNotification } from '../services/accessNotificationBus'
import { sendWelcomeEmail, sendStatusChangeEmail, sendPasswordResetEmail } from '../services/email.service'

export async function getUsers(req: Request, res: Response) {
  const { role } = req.user!
  const where: any = {}

  if (role === 'admin') {
    where.createdById = req.user!.id
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      avatarBlob: true,
      avatarMimeType: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      createdById: true,
      categoryAssignments: {
        include: { category: { select: { id: true, name: true, icon: true, colorToken: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  res.json({
    users: users.map((u) => ({
      ...u,
      avatarUrl: toAvatarDataUrl(u),
      avatarBlob: undefined,
      avatarMimeType: undefined,
    })),
  })
}

export async function getUserById(req: Request, res: Response) {
  const { id } = req.params
  const { role } = req.user!

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      avatarBlob: true,
      avatarMimeType: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      createdById: true,
      categoryAssignments: {
        include: { category: { select: { id: true, name: true, icon: true, colorToken: true } } },
      },
    },
  })

  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  if (role === 'admin' && user.createdById !== req.user!.id) {
    return res.status(403).json({ error: 'You can only view users you created' })
  }

  const explicitRows = await prisma.userToolAllow.findMany({
    where: { userId: id },
    select: { toolId: true },
  })

  res.json({
    user: user
      ? {
          ...user,
          avatarUrl: toAvatarDataUrl(user),
          avatarBlob: undefined,
          avatarMimeType: undefined,
        }
      : null,
    explicitToolIds: explicitRows.map((r) => r.toolId),
  })
}

export async function createUser(req: Request, res: Response) {
  const { name, email, password, role: newRole, categoryIds, toolAssignments } = req.body
  const creator = req.user!

  if (creator.role === 'admin' && newRole === 'admin') {
    return res.status(403).json({ error: 'Admins cannot create other admins' })
  }

  if (toolAssignments?.length && creator.role !== 'superadmin') {
    return res.status(403).json({ error: 'Only SuperAdmin can grant linked tool access.' })
  }

  if (toolAssignments?.length) {
    const tools = await prisma.tool.findMany({
      where: { id: { in: toolAssignments.map((a: { toolId: string }) => a.toolId) } },
    })
    if (tools.length !== toolAssignments.length) {
      return res.status(400).json({ error: 'One or more tool IDs are invalid.' })
    }
    for (const t of tools) {
      if (!t.requiresToolAssignment) {
        return res.status(400).json({
          error: `Tool "${t.name}" does not use per-user access; remove it from tool assignments.`,
        })
      }
    }
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return res.status(409).json({ error: 'Email already in use' })
  }

  const mergedCategoryIds = new Set<string>(categoryIds ?? [])
  if (toolAssignments?.length) {
    const toolsForCat = await prisma.tool.findMany({
      where: { id: { in: toolAssignments.map((a: { toolId: string }) => a.toolId) } },
      select: { categoryId: true },
    })
    for (const t of toolsForCat) mergedCategoryIds.add(t.categoryId)
  }

  const passwordHash = await hashPassword(password)
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: newRole || 'user',
      status: 'active',
      createdById: creator.id,
    },
  })

  if (mergedCategoryIds.size > 0) {
    await syncCategoryAssignments(user.id, Array.from(mergedCategoryIds), creator.id)
    for (const categoryId of mergedCategoryIds) {
      await freezeCategoryToCurrentTools(user.id, categoryId, creator.id)
    }
  }

  let linkedToolSyncWarnings: string[] = []
  if (toolAssignments?.length) {
    const { syncWarnings } = await applyUserToolAssignments(
      user.id,
      email,
      password,
      toolAssignments,
      creator.id,
    )
    linkedToolSyncWarnings = syncWarnings
  }

  const result = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      avatarBlob: true,
      avatarMimeType: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      categoryAssignments: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
              icon: true,
              colorToken: true,
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
        include: { tool: { select: { id: true, name: true, slug: true, url: true } } },
      },
    },
  })

  let emailWarning: string | null = null
  if (result) {
    const categoryNames = result.categoryAssignments.map((a) => a.category.name)
    const standardTools = result.categoryAssignments.flatMap((a) =>
      a.category.tools.map((t) => ({ name: t.name, url: t.url })),
    )
    const linkedTools = result.toolAssignments.map((a) => ({
      name: a.tool.name,
      url: a.tool.url,
    }))
    const seen = new Set<string>()
    const tools = [...standardTools, ...linkedTools].filter((t) => {
      if (seen.has(t.name)) return false
      seen.add(t.name)
      return true
    })

    const emailRes = await sendWelcomeEmail({
      to: result.email,
      name: result.name,
      password,
      role: (result.role === 'admin' ? 'admin' : 'user'),
      categories: categoryNames,
      tools,
    })
    if (!emailRes.ok) emailWarning = emailRes.message
  }

  res.status(201).json({
    user: result
      ? {
          ...result,
          avatarUrl: toAvatarDataUrl(result),
          avatarBlob: undefined,
          avatarMimeType: undefined,
        }
      : null,
    linkedToolSyncWarnings,
    emailWarning,
  })

  if (result) {
    const catNames = result.categoryAssignments?.map((a) => a.category.name) ?? []
    const toolNames = result.toolAssignments?.map((a) => a.tool.name) ?? []
    if (catNames.length || toolNames.length) {
      publishAccessNotification(user.id, {
        type: 'access_update',
        scope: 'account',
        title: 'Your access was updated',
        message: [
          catNames.length ? `Categories: ${catNames.join(', ')}` : null,
          toolNames.length ? `Linked tools: ${toolNames.join(', ')}` : null,
        ]
          .filter(Boolean)
          .join(' · '),
      })
    }
  }
}

export async function updateUser(req: Request, res: Response) {
  const { id } = req.params
  const { role } = req.user!
  const updates = req.body

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  if (user.role === 'superadmin') {
    return res.status(403).json({ error: 'SuperAdmin account cannot be modified' })
  }

  if (role === 'admin' && user.createdById !== req.user!.id) {
    return res.status(403).json({ error: 'You can only update users you created' })
  }

  const prevStatus = user.status
  const updated = await prisma.user.update({
    where: { id },
    data: updates,
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      avatarBlob: true,
      avatarMimeType: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
  })

  res.json({
    user: {
      ...updated,
      avatarUrl: toAvatarDataUrl(updated),
      avatarBlob: undefined,
      avatarMimeType: undefined,
    },
  })

  if (updates && updates.status && updates.status !== prevStatus) {
    await sendStatusChangeEmail({
      to: updated.email,
      name: updated.name,
      newStatus: updated.status as 'active' | 'inactive' | 'pending',
    })
  }
}

export async function updateMyProfile(req: Request, res: Response) {
  const currentUserId = req.user!.id
  const { name, avatarDataUrl } = req.body as { name?: string; avatarDataUrl?: string | null }
  const avatarFields = parseAvatarInput({ avatarDataUrl })

  const updated = await prisma.user.update({
    where: { id: currentUserId },
    data: {
      ...(typeof name === 'string' ? { name } : {}),
      ...avatarFields,
      ...(avatarDataUrl !== undefined ? { avatarUrl: null } : {}),
    },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      avatarBlob: true,
      avatarMimeType: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      categoryAssignments: {
        include: { category: true },
      },
    },
  })

  res.json({
    user: {
      ...updated,
      avatarUrl: toAvatarDataUrl(updated),
      avatarBlob: undefined,
      avatarMimeType: undefined,
    },
  })
}

export async function resetPassword(req: Request, res: Response) {
  const { id } = req.params
  const { newPassword } = req.body as { newPassword: string }

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      toolAssignments: { include: { tool: { select: { id: true, name: true, slug: true } } } },
    },
  })
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }
  if (user.role === 'superadmin') {
    return res.status(403).json({ error: 'SuperAdmin password cannot be reset via this endpoint.' })
  }

  const { resyncedToolCount, linkedToolSyncWarnings } = await resetUserPassword(user, newPassword)

  res.json({
    message: 'Password reset',
    resyncedToolCount,
    linkedToolSyncWarnings,
  })

  await sendPasswordResetEmail({
    to: user.email,
    name: user.name,
    password: newPassword,
  })
}

export async function deleteUser(req: Request, res: Response) {
  const { id } = req.params
  const { role } = req.user!

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  if (user.role === 'superadmin') {
    return res.status(403).json({ error: 'Cannot delete SuperAdmin' })
  }

  if (role === 'admin' && user.createdById !== req.user!.id) {
    return res.status(403).json({ error: 'You can only delete users you created' })
  }

  await prisma.user.delete({ where: { id } })
  res.json({ message: 'User deleted' })
}
