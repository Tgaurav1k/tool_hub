import bcrypt from 'bcryptjs'
import jwt, { type SignOptions } from 'jsonwebtoken'
import { Response } from 'express'

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12')
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

/**
 * Signed, stateless password-reset token. The signing key is bound to the
 * user's *current* password hash, so the link stops working the moment the
 * password changes (single-use) and after it expires. No DB storage needed.
 */
function resetSigningKey(passwordHash: string): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not set')
  return `${secret}:pwreset:${passwordHash}`
}

export function generatePasswordResetToken(user: { id: string; passwordHash: string }): string {
  return jwt.sign({ uid: user.id, purpose: 'pwreset' }, resetSigningKey(user.passwordHash), {
    expiresIn: (process.env.PASSWORD_RESET_EXPIRES_IN ?? '1h') as SignOptions['expiresIn'],
  })
}

/** Returns the user id encoded in a reset token without verifying it (to locate the user). */
export function peekResetTokenUserId(token: string): string | null {
  const decoded = jwt.decode(token) as { uid?: string; purpose?: string } | null
  return decoded?.purpose === 'pwreset' && decoded.uid ? decoded.uid : null
}

export function verifyPasswordResetToken(
  token: string,
  user: { id: string; passwordHash: string },
): boolean {
  try {
    const payload = jwt.verify(token, resetSigningKey(user.passwordHash)) as {
      uid: string
      purpose: string
    }
    return payload.purpose === 'pwreset' && payload.uid === user.id
  } catch {
    return false
  }
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateToken(userId: string): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not set')
  const opts: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? '8h') as SignOptions['expiresIn'],
  }
  return jwt.sign({ userId }, secret, opts)
}

export function setTokenCookie(res: Response, token: string) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000,
    path: '/',
  })
}

export function clearTokenCookie(res: Response) {
  res.cookie('token', '', {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
}
