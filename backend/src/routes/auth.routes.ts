import { Router } from 'express'
import { login, signup, logout, me, forgotPassword, resetPassword } from '../controllers/auth.controller'
import { authenticateJWT } from '../middleware/authenticateJWT'
import { validateRequest } from '../middleware/validateRequest'
import {
  loginSchema,
  signupSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/auth.schema'
import { authRateLimiter } from '../middleware/rateLimiter'

const router = Router()

router.post('/login', authRateLimiter, validateRequest(loginSchema), login)
router.post('/signup', validateRequest(signupSchema), signup)
router.post('/logout', authenticateJWT, logout)
router.get('/me', authenticateJWT, me)
router.post('/forgot-password', validateRequest(forgotPasswordSchema), forgotPassword)
router.post('/reset-password', validateRequest(resetPasswordSchema), resetPassword)

export default router
