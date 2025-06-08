import express from 'express';
import {
  createMaintenanceRequest,
  getMaintenanceRequests,
  getMaintenanceRequest,
  updateMaintenanceRequest,
  deleteMaintenanceRequest,
} from '../controllers/maintenanceController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.route('/').get(protect, getMaintenanceRequests).post(protect, createMaintenanceRequest);
router
  .route('/:id')
  .get(protect, getMaintenanceRequest)
  .put(protect, updateMaintenanceRequest)
  .delete(protect, deleteMaintenanceRequest);

export default router;
