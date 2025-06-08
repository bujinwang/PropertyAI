import { Router } from 'express';
import NotificationController from '../controllers/notificationController';

const router = Router();

router.post('/', NotificationController.createNotification);
router.get('/:userId', NotificationController.getNotifications);
router.put('/:id/read', NotificationController.markAsRead);

export default router;
