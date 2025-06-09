import { Router } from 'express';
import { pricingController } from '../controllers/pricing.controller';

const router = Router();

router.post('/recommend-price', pricingController.getPriceRecommendation);

export default router;
