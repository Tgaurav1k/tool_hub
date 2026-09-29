import { Router } from 'express'
import { getUserToolAssignments, syncUserToolAssignments } from '../controllers/toolAssignments.controller'
import { authenticateJWT } from '../middleware/authenticateJWT'
import { authorizeRole } from '../middleware/authorizeRole'

const router = Router()

router.use(authenticateJWT)

router.get('/:userId', authorizeRole('superadmin'), getUserToolAssignments)
router.put('/:userId', authorizeRole('superadmin'), syncUserToolAssignments)

export default router
