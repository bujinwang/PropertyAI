import express from 'express';
import {
  createProperty,
  getProperties,
  getProperty,
  updateProperty,
  deleteProperty,
} from '../controllers/propertyController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.route('/').get(getProperties).post(protect, createProperty);
router
  .route('/:id')
  .get(getProperty)
  .put(protect, updateProperty)
  .delete(protect, deleteProperty);

export default router;
