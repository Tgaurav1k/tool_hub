import { Router } from 'express'
import { listRoles } from '../controllers/roles.controller'

const router = Router()

router.get('/', listRoles)

export default router
