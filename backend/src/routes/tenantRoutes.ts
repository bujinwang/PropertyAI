import express from 'express';
import {
  createTenant,
  getTenants,
  getTenant,
  updateTenant,
  deleteTenant,
} from '../controllers/userController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.route('/').get(protect, getTenants).post(protect, createTenant);
router
  .route('/:id')
  .get(protect, getTenant)
  .put(protect, updateTenant)
  .delete(protect, deleteTenant);

export default router;
