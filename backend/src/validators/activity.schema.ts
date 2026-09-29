import { z } from 'zod'

export const logActivitySchema = z.object({
  toolId: z.string().uuid('Invalid tool ID'),
  action: z.literal('tool_launch'),
})

export const activityQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  action: z.enum(['login', 'logout', 'tool_launch']).optional(),
  userId: z.string().uuid().optional(),
})
