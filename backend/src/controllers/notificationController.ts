import { Request, Response } from 'express';
import { sendNotification } from '../services/notificationService';

class NotificationController {
  async createNotification(req: Request, res: Response) {
    try {
      await sendNotification(
        req.body.channel,
        req.body.to,
        req.body.subject,
        req.body.message
      );
      const notification = {}; // Placeholder
      res.status(201).json(notification);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getNotifications(req: Request, res: Response) {
    try {
      const notifications = {}; // Placeholder
      res.status(200).json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async markAsRead(req: Request, res: Response) {
    try {
      const notification = {}; // Placeholder
      res.status(200).json(notification);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new NotificationController();
