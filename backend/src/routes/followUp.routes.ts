import { Router } from 'express';
import * as followUpController from '../controllers/followUp.controller';

const router = Router();

router.post('/follow-ups', followUpController.scheduleFollowUp);
router.get('/follow-ups', followUpController.getFollowUps);

export default router;
