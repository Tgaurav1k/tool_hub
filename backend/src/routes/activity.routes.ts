import { Router } from 'express'
import { getActivity, logToolLaunch } from '../controllers/activity.controller'
import { authenticateJWT } from '../middleware/authenticateJWT'
import { authorizeRole } from '../middleware/authorizeRole'
import { validateRequest } from '../middleware/validateRequest'
import { logActivitySchema } from '../validators/activity.schema'

const router = Router()

router.use(authenticateJWT)

router.get('/', authorizeRole('admin', 'superadmin'), getActivity)
router.post('/', validateRequest(logActivitySchema), logToolLaunch)

export default router
