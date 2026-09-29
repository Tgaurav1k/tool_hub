import { Request, Response } from 'express'
import { logActivity, getActivityLogs } from '../services/activity.service'

export async function getActivity(req: Request, res: Response) {
  const { page, limit, action, userId } = req.query as any
  const currentUser = req.user!

  const result = await getActivityLogs({
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    action,
    userId,
    scopeToCreatorId: currentUser.role === 'admin' ? currentUser.id : undefined,
  })

  res.json(result)
}

export async function logToolLaunch(req: Request, res: Response) {
  const { toolId } = req.body
  const userId = req.user!.id

  const log = await logActivity({
    userId,
    action: 'tool_launch',
    toolId,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  })

  res.status(201).json({ log })
}
