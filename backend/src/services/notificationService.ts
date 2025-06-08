import { User } from '@prisma/client';
import { Notification } from '../models/mongo/Notification';

class NotificationService {
  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: string,
    relatedId?: string,
    relatedType?: string
  ) {
    const notification = new Notification({
      userId,
      title,
      message,
      type,
      relatedId,
      relatedType,
    });
    await notification.save();
    return notification;
  }

  async getNotifications(userId: string) {
    return Notification.find({ userId });
  }

  async markAsRead(notificationId: string) {
    return Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );
  }
}

export default new NotificationService();
