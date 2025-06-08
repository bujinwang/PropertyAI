import { Router } from 'express';
import { costEstimationController } from '../controllers/costEstimation.controller';

const router = Router();

router.get('/estimate/:workOrderId', costEstimationController.getCostEstimation);

export default router;
