import { Router } from 'express';
import { TenantRatingController } from '../controllers/tenantRating.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const tenantRatingController = new TenantRatingController();

// Create a new tenant rating
router.post(
  '/',
  authMiddleware.protect,
  tenantRatingController.createTenantRating
);

// Get all ratings for a specific tenant
router.get(
  '/:tenantId',
  tenantRatingController.getTenantRatings
);

// Update a specific rating
router.put(
  '/:id',
  authMiddleware.protect,
  tenantRatingController.updateTenantRating
);

// Delete a specific rating
router.delete(
  '/:id',
  authMiddleware.protect,
  tenantRatingController.deleteTenantRating
);

// Get analytics for a specific tenant's ratings
router.get(
  '/:tenantId/analytics',
  tenantRatingController.getTenantRatingAnalytics
);

export default router;
