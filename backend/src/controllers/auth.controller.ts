import { Request, Response } from 'express'
import prisma from '../db/prisma'
import {
  hashPassword,
  comparePassword,
  generateToken,
  setTokenCookie,
  clearTokenCookie,
  generatePasswordResetToken,
  peekResetTokenUserId,
  verifyPasswordResetToken,
} from '../services/auth.service'
import { logActivity } from '../services/activity.service'
import { resetUserPassword } from '../services/passwordReset.service'
import { sendPasswordResetLinkEmail } from '../services/email.service'
import { toAvatarDataUrl } from '../utils/avatar'

/** Base URL of the frontend, used to build the reset link. Set APP_URL in production. */
function frontendBaseUrl(): string {
  const explicit = process.env.APP_URL?.replace(/\/$/, '')
  if (explicit) return explicit
  // Fall back to APP_LOGIN_URL with a trailing /login stripped off.
  const loginUrl = process.env.APP_LOGIN_URL?.replace(/\/login\/?$/, '').replace(/\/$/, '')
  return loginUrl || 'http://localhost:3000'
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  if (user.status !== 'active') {
    return res.status(403).json({ error: 'Account is not active. Contact your administrator.' })
  }

  const valid = await comparePassword(password, user.passwordHash)
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const token = generateToken(user.id)
  setTokenCookie(res, token)

  await logActivity({
    userId: user.id,
    action: 'login',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  })

  res.json({
    user: {
      id: user.id,
      name: user.name,
      avatarUrl: toAvatarDataUrl(user),
      email: user.email,
      role: user.role,
      status: user.status,
    },
  })
}

export async function signup(req: Request, res: Response) {
  const { name, email, password } = req.body

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return res.status(409).json({ error: 'Email already in use' })
  }

  const passwordHash = await hashPassword(password)
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role: 'user', status: 'pending' },
  })

  res.status(201).json({
    user: {
      id: user.id,
      name: user.name,
      avatarUrl: toAvatarDataUrl(user),
      email: user.email,
      role: user.role,
      status: user.status,
    },
    message: 'Account created. Awaiting admin approval.',
  })
}

export async function logout(req: Request, res: Response) {
  if (req.user) {
    await logActivity({
      userId: req.user.id,
      action: 'logout',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    })
  }

  clearTokenCookie(res)
  res.json({ message: 'Logged out successfully' })
}

export async function me(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      avatarBlob: true,
      avatarMimeType: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      categoryAssignments: {
        include: { category: true },
      },
    },
  })

  res.json({
    user: user
      ? {
          ...user,
          avatarUrl: toAvatarDataUrl(user),
        }
      : null,
  })
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body as { email: string }

  const user = await prisma.user.findUnique({ where: { email } })

  // Always respond identically so the endpoint can't be used to probe which
  // emails have accounts. The email (if any) is sent after the response.
  res.json({ message: 'If that email exists, a password reset link has been sent to it.' })

  // Only active accounts can sign in, so only they can usefully be reset.
  if (!user || user.status !== 'active') return

  try {
    const token = generatePasswordResetToken(user)
    const resetUrl = `${frontendBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`
    await sendPasswordResetLinkEmail({
      to: user.email,
      name: user.name,
      resetUrl,
      expiresIn: '1 hour',
    })
  } catch (err) {
    console.error('[forgot-password] failed to send reset link for', email, err)
  }
}

export async function resetPassword(req: Request, res: Response) {
  const { token, password } = req.body as { token: string; password: string }

  const uid = peekResetTokenUserId(token)
  if (!uid) {
    return res.status(400).json({ error: 'This reset link is invalid or has expired.' })
  }

  const user = await prisma.user.findUnique({
    where: { id: uid },
    include: {
      toolAssignments: { include: { tool: { select: { name: true, slug: true } } } },
    },
  })

  // Verify against the user's current password hash — a used/expired link fails here.
  if (!user || user.status !== 'active' || !verifyPasswordResetToken(token, user)) {
    return res.status(400).json({ error: 'This reset link is invalid or has expired.' })
  }

  const { linkedToolSyncWarnings } = await resetUserPassword(user, password)

  await logActivity({
    userId: user.id,
    action: 'password_reset_self',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  })

  res.json({ message: 'Your password has been updated. You can now sign in.', linkedToolSyncWarnings })
}
