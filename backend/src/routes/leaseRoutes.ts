import express from 'express';
import {
  createLease,
  getLeases,
  getLease,
  updateLease,
  deleteLease,
} from '../controllers/leaseController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.route('/').get(protect, getLeases).post(protect, createLease);
router
  .route('/:id')
  .get(protect, getLease)
  .put(protect, updateLease)
  .delete(protect, deleteLease);

export default router;
