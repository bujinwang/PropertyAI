import express from 'express';
import {
  createApplication,
  getApplications,
  getApplication,
  updateApplication,
  deleteApplication,
} from '../controllers/applicationController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.route('/').get(protect, getApplications).post(protect, createApplication);
router
  .route('/:id')
  .get(protect, getApplication)
  .put(protect, updateApplication)
  .delete(protect, deleteApplication);

export default router;
