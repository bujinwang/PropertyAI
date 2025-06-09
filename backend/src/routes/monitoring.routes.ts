import { Router } from 'express';
import { getMetrics } from '../controllers/monitoring.controller';

const router = Router();

router.get('/metrics', getMetrics);

export default router;
