import { Router } from 'express';
import { aiRoutingController } from '../controllers/aiRouting.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get(
  '/find-best-vendor/:workOrderId',
  authMiddleware.protect,
  authMiddleware.checkRole(['ADMIN', 'PROPERTY_MANAGER']),
  aiRoutingController.findBestVendor
);

export default router;
