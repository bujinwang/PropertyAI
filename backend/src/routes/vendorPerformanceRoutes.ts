import { Router } from 'express';
import * as VendorPerformanceController from '../controllers/vendorPerformanceController';

/**
 * `/api/vendor-performance` route table.
 *
 * The controller exports MODULE-LEVEL FUNCTIONS, not a class instance. It used
 * to `export default new VendorPerformanceController()`, and Express was handed
 * the methods unbound — so `this` was `undefined` inside every handler and
 * `getAverageScoreForVendor` (the one method that called `this.getRatingsForVendor`)
 * returned a 500 on every request while `tsc` reported no errors. Importing the
 * namespace and referencing functions removes the `this` binding entirely.
 *
 * ORDERING: literal segments precede the `/:id` catch-all, same rule as
 * `/api/templates` and `/api/knowledge-base`. Express matches whole segments, so
 * `/vendor/:vendorId/average-score` could not actually be shadowed by
 * `/vendor/:vendorId` — but keeping the longest path first means a future
 * single-segment route cannot break it by accident.
 */

const router = Router();

router.post('/', VendorPerformanceController.createRating);

router.get('/vendor/:vendorId/average-score', VendorPerformanceController.getAverageScoreForVendor);
router.get('/vendor/:vendorId', VendorPerformanceController.getRatingsForVendor);
router.get('/work-order/:workOrderId', VendorPerformanceController.getRatingsForWorkOrder);

router.get('/:id', VendorPerformanceController.getRating);

export default router;
