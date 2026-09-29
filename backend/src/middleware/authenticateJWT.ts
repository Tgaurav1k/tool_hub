import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../db/prisma'

export interface AuthUser {
  id: string
  email: string
  role: 'superadmin' | 'admin' | 'user'
  name: string
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

export async function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.token

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, name: true, status: true },
    })

    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: 'Invalid or inactive account' })
    }

    const role = user.role as AuthUser['role']
    req.user = { id: user.id, email: user.email, role, name: user.name }
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}
