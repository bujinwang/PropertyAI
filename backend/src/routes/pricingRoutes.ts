import { Router } from 'express';
import { recommendPrice } from '../controllers/pricingController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.post('/recommend-price', authMiddleware.protect, recommendPrice);

export default router;