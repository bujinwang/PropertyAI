import { Router } from 'express';
import { maintenanceRequestCategorizationController } from '../controllers/maintenanceRequestCategorization.controller';

const router = Router();

router.post(
  '/categorize/:maintenanceRequestId',
  maintenanceRequestCategorizationController.categorizeRequest
);

export default router;
