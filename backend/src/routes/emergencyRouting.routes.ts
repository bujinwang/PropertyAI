import { Router } from 'express';
import { emergencyRoutingController } from '../controllers/emergencyRouting.controller';

const router = Router();

router.post(
  '/route/:maintenanceRequestId',
  emergencyRoutingController.routeEmergencyRequest
);

export default router;
