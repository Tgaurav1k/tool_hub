import { Router } from 'express'
import authRoutes from './auth.routes'
import usersRoutes from './users.routes'
import toolsRoutes from './tools.routes'
import categoriesRoutes from './categories.routes'
import assignmentsRoutes from './assignments.routes'
import activityRoutes from './activity.routes'
import rolesRoutes from './roles.routes'
import favoritesRoutes from './favorites.routes'
import toolAssignmentsRoutes from './toolAssignments.routes'
import notificationsRoutes from './notifications.routes'

const router = Router()

router.use('/auth', authRoutes)
router.use('/roles', rolesRoutes)
router.use('/users', usersRoutes)
router.use('/tools', toolsRoutes)
router.use('/categories', categoriesRoutes)
router.use('/assignments', assignmentsRoutes)
router.use('/tool-assignments', toolAssignmentsRoutes)
router.use('/activity', activityRoutes)
router.use('/favorites', favoritesRoutes)
router.use('/notifications', notificationsRoutes)

export default router
