import { Router } from 'express';
import { maintenanceResponseTimeController } from '../controllers/maintenanceResponseTime.controller';

const router = Router();

router.post(
  '/track/:maintenanceRequestId',
  maintenanceResponseTimeController.trackResponseTime
);

export default router;
