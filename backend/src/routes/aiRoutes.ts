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

// Placeholder routes for AI Insights Dashboard
router.post('/insights', aiController.getInsights);
router.get('/insights/dashboard-summary', aiController.getDashboardSummary);
router.get('/insights/categories', aiController.getInsightCategories);
router.post('/insights/:insightId/regenerate', aiController.regenerateInsight);

export default router;
