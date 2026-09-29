import { Router } from 'express'
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateMyProfile,
  deleteUser,
  resetPassword,
} from '../controllers/users.controller'
import { authenticateJWT } from '../middleware/authenticateJWT'
import { authorizeRole } from '../middleware/authorizeRole'
import { validateRequest } from '../middleware/validateRequest'
import {
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
  updateMyProfileSchema,
} from '../validators/users.schema'

const router = Router()

router.use(authenticateJWT)

router.patch('/me/profile', validateRequest(updateMyProfileSchema), updateMyProfile)
router.get('/', authorizeRole('admin', 'superadmin'), getUsers)
router.get('/:id', authorizeRole('admin', 'superadmin'), getUserById)
router.post('/', authorizeRole('admin', 'superadmin'), validateRequest(createUserSchema), createUser)
router.patch('/:id', authorizeRole('admin', 'superadmin'), validateRequest(updateUserSchema), updateUser)
router.post(
  '/:id/reset-password',
  authorizeRole('superadmin'),
  validateRequest(resetPasswordSchema),
  resetPassword,
)
router.delete('/:id', authorizeRole('admin', 'superadmin'), deleteUser)

export default router
