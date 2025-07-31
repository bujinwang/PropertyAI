import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get user notifications
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.put('/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const notification = await prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true }
    });

    res.json({ success: true, updated: notification.count });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.put('/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const updated = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });

    res.json({ success: true, updatedCount: updated.count });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Create notification (for internal use)
export const createNotification = async (data: {
  userId: string;
  type: string;
  message: string;
  link?: string;
}) => {
  return await prisma.notification.create({
    data
  });
};

// Notification types for UX reviews
export const NotificationTypes = {
  UX_REVIEW_CREATED: 'UX_REVIEW_CREATED',
  UX_REVIEW_UPDATED: 'UX_REVIEW_UPDATED',
  UX_REVIEW_ASSIGNED: 'UX_REVIEW_ASSIGNED',
  UX_REVIEW_COMMENTED: 'UX_REVIEW_COMMENTED',
  UX_REVIEW_COMPLETED: 'UX_REVIEW_COMPLETED',
  UX_REVIEW_PRIORITY_CHANGED: 'UX_REVIEW_PRIORITY_CHANGED',
  UX_REVIEW_STATUS_CHANGED: 'UX_REVIEW_STATUS_CHANGED'
};

export default router;