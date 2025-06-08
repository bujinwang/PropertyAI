import { Router } from 'express';
import { aiRoutingController } from '../controllers/aiRouting.controller';

const router = Router();

router.get('/find-best-vendor/:workOrderId', aiRoutingController.findBestVendor);

export default router;
