import { Request, Response } from 'express'
import prisma from '../db/prisma'

/** Catalog rows from `roles` table (single source of truth in DB). */
export async function listRoles(_req: Request, res: Response) {
  const roles = await prisma.role.findMany({
    orderBy: { sortOrder: 'asc' },
    select: { slug: true, label: true, description: true, sortOrder: true },
  })
  res.json({ roles })
}
