import { Router } from 'express';
import ReminderController from '../controllers/reminderController';

const router = Router();

router.post('/', ReminderController.sendReminders);

export default router;
