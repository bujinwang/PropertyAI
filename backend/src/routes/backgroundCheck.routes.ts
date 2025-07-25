import { Router } from 'express';
import { backgroundCheckController } from '../controllers/backgroundCheckController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.post(
  '/',
  authMiddleware.protect,
  backgroundCheckController.performCheck
);

export default router;
