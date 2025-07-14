import { Router } from 'express';
import VendorPerformanceController from '../controllers/vendorPerformanceController';

const router = Router();

router.post('/', VendorPerformanceController.createRating);
router.get('/:id', VendorPerformanceController.getRating);
router.get(
  '/vendor/:vendorId',
  VendorPerformanceController.getRatingsForVendor
);
router.get(
  '/work-order/:workOrderId',
  VendorPerformanceController.getRatingsForWorkOrder
);
router.get(
  '/vendor/:vendorId/average-score',
  VendorPerformanceController.getAverageScoreForVendor
);

export default router;
