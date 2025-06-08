import { Request, Response } from 'express';
import ReminderService from '../services/reminderService';

class ReminderController {
  async sendReminders(req: Request, res: Response) {
    try {
      await ReminderService.sendReminders();
      res.status(200).json({ message: 'Reminders sent successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new ReminderController();
