import { Router } from 'express';
import { schedulingController } from '../controllers/scheduling.controller';

const router = Router();

router.post('/schedule/:workOrderId', schedulingController.scheduleEvent);

export default router;
