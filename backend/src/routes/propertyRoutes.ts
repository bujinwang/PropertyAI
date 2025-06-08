import express from 'express';
import {
  createProperty,
  getProperties,
  getProperty,
  updateProperty,
  deleteProperty,
} from '../controllers/propertyController';
import { protect } from '../middleware/auth';
import { rbac } from '../middleware/rbacMiddleware';

const router = express.Router();

router.route('/').get(getProperties).post(protect, rbac(['ADMIN', 'PROPERTY_MANAGER']), createProperty);
router
  .route('/:id')
  .get(getProperty)
  .put(protect, rbac(['ADMIN', 'PROPERTY_MANAGER']), updateProperty)
  .delete(protect, rbac(['ADMIN', 'PROPERTY_MANAGER']), deleteProperty);

export default router;
