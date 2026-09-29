import { Router } from 'express'
import { getCategories, getCategoryTools } from '../controllers/categories.controller'
import { authenticateJWT } from '../middleware/authenticateJWT'

const router = Router()

router.use(authenticateJWT)

router.get('/', getCategories)
router.get('/:id/tools', getCategoryTools)

export default router
