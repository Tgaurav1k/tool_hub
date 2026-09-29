import { Router } from 'express'
import {
  getUserAssignments,
  assignCategories,
  removeAssignment,
} from '../controllers/assignments.controller'
import { authenticateJWT } from '../middleware/authenticateJWT'
import { authorizeRole } from '../middleware/authorizeRole'
import { validateRequest } from '../middleware/validateRequest'
import { assignCategoriesSchema } from '../validators/assignments.schema'

const router = Router()

router.use(authenticateJWT)

router.get('/:userId', authorizeRole('admin', 'superadmin'), getUserAssignments)
router.post('/', authorizeRole('admin', 'superadmin'), validateRequest(assignCategoriesSchema), assignCategories)
router.delete('/:userId/:categoryId', authorizeRole('admin', 'superadmin'), removeAssignment)

export default router
