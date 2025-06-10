import { Router } from 'express';
import { modelPerformanceController } from '../controllers/modelPerformance.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get(
  '/',
  authMiddleware.protect,
  authMiddleware.checkRole(['ADMIN']),
  modelPerformanceController.getAllPerformance
);

export default router;
