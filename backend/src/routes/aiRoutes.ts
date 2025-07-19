import express from 'express';
import * as aiController from '../controllers/aiController';
import { pricingController } from '../controllers/pricing.controller';

const router = express.Router();

router.post('/properties/:propertyId/generate-description', aiController.generateDescription);
router.post('/smart-response', aiController.smartResponse);
router.post('/translate', aiController.translate);
router.post('/sentiment', aiController.sentiment);
router.post('/follow-up', aiController.followUp);
router.post('/assess-risk', aiController.assessRisk);
router.post('/pricing-recommendation', pricingController.getPriceRecommendation);

export default router;
