import { Router } from 'express';
import { getSlowQueries, analyzeQueryPerformance } from '../controllers/databaseOptimization.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/slow-queries', authMiddleware.protect, getSlowQueries);
router.post('/analyze-query', authMiddleware.protect, analyzeQueryPerformance);

export default router;
