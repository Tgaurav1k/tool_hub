import { Router } from 'express'
import {
  getTools,
  getToolById,
  createTool,
  updateTool,
  deleteTool,
} from '../controllers/tools.controller'
import { authenticateJWT } from '../middleware/authenticateJWT'
import { authorizeRole } from '../middleware/authorizeRole'
import { validateRequest } from '../middleware/validateRequest'
import { createToolSchema, updateToolSchema } from '../validators/tools.schema'

const router = Router()

router.use(authenticateJWT)

router.get('/', getTools)
router.get('/:id', getToolById)
router.post('/', authorizeRole('superadmin'), validateRequest(createToolSchema), createTool)
router.patch('/:id', authorizeRole('superadmin'), validateRequest(updateToolSchema), updateTool)
router.delete('/:id', authorizeRole('superadmin'), deleteTool)

export default router
