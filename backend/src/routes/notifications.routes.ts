import { Router } from 'express'
import {
  streamAccessNotifications,
  getMyNotifications,
  markMyNotificationRead,
  markAllMyNotificationsRead,
  deleteMyNotification,
  clearMyNotifications,
} from '../controllers/notifications.controller'
import { authenticateJWT } from '../middleware/authenticateJWT'

const router = Router()

router.use(authenticateJWT)
router.get('/stream', streamAccessNotifications)
router.get('/', getMyNotifications)
router.patch('/read-all', markAllMyNotificationsRead)
router.patch('/:id/read', markMyNotificationRead)
router.delete('/', clearMyNotifications)
router.delete('/:id', deleteMyNotification)

export default router
