import { Router } from 'express';
import { vendorPerformanceController } from '../controllers/vendorPerformance.controller';

const router = Router();

router.post('/record', vendorPerformanceController.recordVendorPerformance);

export default router;
