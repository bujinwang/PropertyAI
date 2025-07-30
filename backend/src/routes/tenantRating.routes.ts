import { Router } from 'express';
import { TenantRatingController } from '../controllers/tenantRating.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const tenantRatingController = new TenantRatingController();

router.post(
  '/',
  authMiddleware.checkRole(['PROPERTY_MANAGER']),
  tenantRatingController.createTenantRating
);

router.get(
  '/:tenantId',
  authMiddleware.checkRole(['PROPERTY_MANAGER']),
  tenantRatingController.getTenantRatings
);

export default router;
