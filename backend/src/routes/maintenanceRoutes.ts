import { Router } from 'express';
import MaintenanceController from '../controllers/maintenanceController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authMiddleware, MaintenanceController.getAllMaintenanceRequests);
router.post('/', authMiddleware, MaintenanceController.createMaintenanceRequest);
router.get(
  '/:id',
  authMiddleware,
  MaintenanceController.getMaintenanceRequestById
);
router.put(
  '/:id',
  authMiddleware,
  MaintenanceController.updateMaintenanceRequest
);
router.delete(
  '/:id',
  authMiddleware,
  MaintenanceController.deleteMaintenanceRequest
);

export default router;
