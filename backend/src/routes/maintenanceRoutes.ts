import { Router } from 'express';
import MaintenanceController from '../controllers/maintenanceController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authMiddleware.protect, MaintenanceController.getAllMaintenanceRequests);
router.post('/', authMiddleware.protect, MaintenanceController.createMaintenanceRequest);
router.get(
  '/:id',
  authMiddleware.protect,
  MaintenanceController.getMaintenanceRequestById
);
router.put(
  '/:id',
  authMiddleware.protect,
  MaintenanceController.updateMaintenanceRequest
);
router.delete(
  '/:id',
  authMiddleware.protect,
  MaintenanceController.deleteMaintenanceRequest
);

export default router;
