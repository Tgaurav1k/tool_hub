import { Router, Request, Response } from 'express'
import { authenticateJWT } from '../middleware/authenticateJWT'
import prisma from '../db/prisma'

const router = Router()

router.use(authenticateJWT)

router.get('/', async (req: Request, res: Response) => {
  const userId = req.user!.id
  const rows = await prisma.userFavorite.findMany({
    where: { userId },
    select: { toolId: true },
  })
  res.json({ toolIds: rows.map((r) => r.toolId) })
})

router.post('/:toolId', async (req: Request, res: Response) => {
  const userId = req.user!.id
  const { toolId } = req.params

  const tool = await prisma.tool.findUnique({ where: { id: toolId } })
  if (!tool) return res.status(404).json({ error: 'Tool not found' })

  const existing = await prisma.userFavorite.findUnique({
    where: { userId_toolId: { userId, toolId } },
  })

  if (existing) {
    await prisma.userFavorite.delete({ where: { id: existing.id } })
    return res.json({ favorited: false, toolId })
  }

  await prisma.userFavorite.create({ data: { userId, toolId } })
  res.json({ favorited: true, toolId })
})

router.delete('/:toolId', async (req: Request, res: Response) => {
  const userId = req.user!.id
  const { toolId } = req.params

  await prisma.userFavorite.deleteMany({ where: { userId, toolId } })
  res.json({ favorited: false, toolId })
})

export default router
