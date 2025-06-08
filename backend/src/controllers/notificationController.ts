import { Request, Response } from 'express';
import NotificationService from '../services/notificationService';

class NotificationController {
  async createNotification(req: Request, res: Response) {
    try {
      const notification = await NotificationService.createNotification(
        req.body.userId,
        req.body.title,
        req.body.message,
        req.body.type,
        req.body.relatedId,
        req.body.relatedType
      );
      res.status(201).json(notification);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getNotifications(req: Request, res: Response) {
    try {
      const notifications = await NotificationService.getNotifications(
        req.params.userId
      );
      res.status(200).json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async markAsRead(req: Request, res: Response) {
    try {
      const notification = await NotificationService.markAsRead(
        req.params.id
      );
      res.status(200).json(notification);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new NotificationController();
