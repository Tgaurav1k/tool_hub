import { Request, Response } from 'express'
import prisma from '../db/prisma'

export async function getCategories(req: Request, res: Response) {
  const { role, id: userId } = req.user!

  if (role === 'user' || role === 'admin') {
    const assignments = await prisma.categoryAssignment.findMany({
      where: { userId },
      include: {
        category: {
          include: { _count: { select: { tools: true } } },
        },
      },
      orderBy: { category: { sortOrder: 'asc' } },
    })

    const categories = assignments.map((a) => ({
      id: a.category.id,
      name: a.category.name,
      icon: a.category.icon,
      colorToken: a.category.colorToken,
      sortOrder: a.category.sortOrder,
      toolCount: a.category._count.tools,
    }))

    return res.json({ categories })
  }

  const categories = await prisma.category.findMany({
    include: { _count: { select: { tools: true } } },
    orderBy: { sortOrder: 'asc' },
  })

  res.json({
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      colorToken: c.colorToken,
      sortOrder: c.sortOrder,
      toolCount: c._count.tools,
    })),
  })
}

export async function getCategoryTools(req: Request, res: Response) {
  const { id } = req.params
  const { role, id: userId } = req.user!

  const scopedRole = role === 'user' || role === 'admin'

  let userAssignment: { restrictStandardTools: boolean } | null = null
  if (scopedRole) {
    userAssignment = await prisma.categoryAssignment.findUnique({
      where: { userId_categoryId: { userId, categoryId: id } },
      select: { restrictStandardTools: true },
    })
    if (!userAssignment) {
      return res.status(403).json({ error: 'You do not have access to this category' })
    }
  }

  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      tools: { orderBy: { name: 'asc' } },
    },
  })

  if (!category) {
    return res.status(404).json({ error: 'Category not found' })
  }

  if (scopedRole && userAssignment) {
    let tools = category.tools
    if (userAssignment.restrictStandardTools) {
      const allowRows = await prisma.userToolAllow.findMany({
        where: { userId, tool: { categoryId: id } },
        select: { toolId: true },
      })
      const allowSet = new Set(allowRows.map((r) => r.toolId))
      tools = tools.filter((t) => t.requiresToolAssignment || allowSet.has(t.id))
    }

    const gated = tools.filter((t) => t.requiresToolAssignment)
    if (gated.length > 0) {
      const allowed = await prisma.userToolAssignment.findMany({
        where: { userId, toolId: { in: gated.map((t) => t.id) } },
        select: { toolId: true },
      })
      const allowedIds = new Set(allowed.map((a) => a.toolId))
      tools = tools.filter((t) => !t.requiresToolAssignment || allowedIds.has(t.id))
    }

    return res.json({
      category: {
        ...category,
        tools,
      },
    })
  }

  res.json({ category })
}
