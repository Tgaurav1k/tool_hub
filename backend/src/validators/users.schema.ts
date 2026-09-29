import { z } from 'zod'

const toolAssignmentSchema = z.object({
  toolId: z.string().uuid(),
  toolRole: z.enum(['user', 'admin']),
})

export const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['user', 'admin']).default('user'),
  categoryIds: z.array(z.string().uuid()).optional(),
  /** Per-tool access for integrations (e.g. Image Generation). SuperAdmin only; enforced in controller. */
  toolAssignments: z.array(toolAssignmentSchema).optional(),
})

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  status: z.enum(['active', 'pending', 'inactive']).optional(),
  role: z.enum(['user', 'admin']).optional(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
})

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
})

export const updateMyProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  avatarDataUrl: z
    .string()
    .refine(
      (v) => {
        if (v.startsWith('data:image/')) return true
        try {
          // Validate data URL shape with base64 payload.
          const re = /^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=\r\n]+$/
          return re.test(v)
        } catch {
          return false
        }
      },
      { message: 'Avatar must be a valid image data URL.' },
    )
    .nullable()
    .optional(),
})
