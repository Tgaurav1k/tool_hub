import { z } from 'zod'

export const createToolSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  url: z.string().url('Must be a valid URL'),
  icon: z.string().default('Wrench'),
  categoryId: z.string().uuid('Invalid category ID'),
  status: z.enum(['active', 'inactive', 'new']).default('active'),
  // Free-form here; the controller normalizes it into a unique [a-z0-9-] slug
  // (or derives one from the name when omitted).
  slug: z.string().trim().max(80).optional().nullable(),
  requiresToolAssignment: z.boolean().optional(),
})

export const updateToolSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().min(5).optional(),
  url: z.string().url().optional(),
  icon: z.string().min(1).optional(),
  categoryId: z.string().uuid().optional(),
  status: z.enum(['active', 'inactive', 'new']).optional(),
  // Free-form here; the controller normalizes it into a unique [a-z0-9-] slug
  // (or derives one from the name when omitted).
  slug: z.string().trim().max(80).optional().nullable(),
  requiresToolAssignment: z.boolean().optional(),
})
