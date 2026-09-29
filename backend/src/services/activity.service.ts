import prisma from '../db/prisma'

type ActivityAction = 'login' | 'logout' | 'tool_launch' | 'password_reset_self'

export async function logActivity(params: {
  userId: string
  action: ActivityAction
  toolId?: string
  ipAddress?: string
  userAgent?: string
}) {
  // Superadmin #2 is intentionally invisible to the activity log: no login/logout/
  // tool_launch row is ever written for it. Env is read at call time (not module load)
  // so it works regardless of dotenv init order.
  const hiddenEmail = process.env.SUPERADMIN_EMAIL2?.trim().toLowerCase()
  if (hiddenEmail) {
    const actor = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { email: true },
    })
    if (actor?.email.trim().toLowerCase() === hiddenEmail) return null
  }

  return prisma.activityLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      toolId: params.toolId || null,
      ipAddress: params.ipAddress || null,
      userAgent: params.userAgent || null,
    },
  })
}

export async function getActivityLogs(params: {
  page: number
  limit: number
  action?: ActivityAction
  userId?: string
  scopeToCreatorId?: string
}) {
  const where: any = {}

  if (params.action) where.action = params.action
  if (params.userId) where.userId = params.userId

  if (params.scopeToCreatorId) {
    where.user = { createdById: params.scopeToCreatorId }
  }

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        tool: { select: { id: true, name: true, url: true, category: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.activityLog.count({ where }),
  ])

  return {
    data: logs,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      pages: Math.ceil(total / params.limit),
    },
  }
}
