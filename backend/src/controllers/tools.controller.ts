import { Request, Response } from 'express'
import prisma from '../db/prisma'
import { generateUniqueToolSlug } from '../utils/slug'

export async function getTools(req: Request, res: Response) {
  const { categoryId, requiresToolAssignment } = req.query
  const where: Record<string, unknown> = {}

  if (categoryId) where.categoryId = categoryId as string
  if (requiresToolAssignment === 'true') where.requiresToolAssignment = true

  const tools = await prisma.tool.findMany({
    where,
    include: {
      category: { select: { id: true, name: true, icon: true, colorToken: true } },
    },
    orderBy: { name: 'asc' },
  })

  res.json({ tools })
}

export async function getToolById(req: Request, res: Response) {
  const { id } = req.params

  const tool = await prisma.tool.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true, icon: true, colorToken: true } },
    },
  })

  if (!tool) {
    return res.status(404).json({ error: 'Tool not found' })
  }

  res.json({ tool })
}

export async function createTool(req: Request, res: Response) {
  const { name, description, url, icon, categoryId, status, slug, requiresToolAssignment } = req.body

  const category = await prisma.category.findUnique({ where: { id: categoryId } })
  if (!category) {
    return res.status(404).json({ error: 'Category not found' })
  }

  // Every tool gets a unique slug. Use the provided slug as the base if given,
  // otherwise derive it from the name (e.g. "Blog Writer" -> "blog-writer").
  const finalSlug = await generateUniqueToolSlug(prisma, slug?.trim() || name)

  const tool = await prisma.tool.create({
    data: {
      name,
      description,
      url,
      icon,
      categoryId,
      status,
      slug: finalSlug,
      // Default to true so tools created via the UI match the seeded tools
      // (visible only after an explicit per-user assignment).
      requiresToolAssignment: requiresToolAssignment === undefined ? true : Boolean(requiresToolAssignment),
    },
    include: {
      category: { select: { id: true, name: true, icon: true, colorToken: true } },
    },
  })

  res.status(201).json({ tool })
}

export async function updateTool(req: Request, res: Response) {
  const { id } = req.params
  const updates = req.body

  const existing = await prisma.tool.findUnique({ where: { id } })
  if (!existing) {
    return res.status(404).json({ error: 'Tool not found' })
  }

  // If the slug field is touched, keep it unique and never let it become empty:
  // an empty/null slug falls back to one derived from the (new or existing) name.
  if ('slug' in updates) {
    const base =
      typeof updates.slug === 'string' && updates.slug.trim()
        ? updates.slug
        : updates.name ?? existing.name
    updates.slug = await generateUniqueToolSlug(prisma, base, id)
  }

  const tool = await prisma.tool.update({
    where: { id },
    data: updates,
    include: {
      category: { select: { id: true, name: true, icon: true, colorToken: true } },
    },
  })

  res.json({ tool })
}

export async function deleteTool(req: Request, res: Response) {
  const { id } = req.params

  const existing = await prisma.tool.findUnique({ where: { id } })
  if (!existing) {
    return res.status(404).json({ error: 'Tool not found' })
  }

  await prisma.tool.delete({ where: { id } })
  res.json({ message: 'Tool deleted' })
}
