import { Router } from 'express';
import { predictiveMaintenanceController } from '../controllers/predictiveMaintenance.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get(
  '/predict/:applianceId',
  authMiddleware.protect,
  authMiddleware.checkRole(['ADMIN', 'PROPERTY_MANAGER']),
  predictiveMaintenanceController.predictFailure
);

export default router;
