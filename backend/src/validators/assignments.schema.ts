import { z } from 'zod'

export const assignCategoriesSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  categoryIds: z.array(z.string().uuid('Invalid category ID')).min(0),
  /** When set, replaces per-tool allowlist for standard tools (non-linked). Omit for legacy clients. */
  explicitToolIds: z.array(z.string().uuid()).optional(),
})
