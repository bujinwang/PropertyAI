import { Router } from 'express';
import { vendorController } from '../controllers/vendor.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/:id', authMiddleware.protect, vendorController.getProfile);
router.put(
  '/:id',
  authMiddleware.protect,
  authMiddleware.checkRole(['ADMIN', 'PROPERTY_MANAGER']),
  vendorController.updateProfile
);

export default router;
