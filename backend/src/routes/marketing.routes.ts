import express from 'express';
import * as marketingController from '../controllers/marketingController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware.protect);

// Campaign routes
router.get('/campaigns', marketingController.getCampaigns);
router.post('/campaigns', marketingController.createCampaign);
router.get('/campaigns/:id', marketingController.getCampaign);
router.put('/campaigns/:id', marketingController.updateCampaign);
router.delete('/campaigns/:id', marketingController.deleteCampaign);
router.post('/campaigns/:id/pause', marketingController.pauseCampaign);
router.post('/campaigns/:id/resume', marketingController.resumeCampaign);

// Analytics routes
router.get('/analytics/overview', marketingController.getAnalyticsOverview);
router.get('/analytics/traffic', marketingController.getWebsiteTraffic);
router.get('/analytics/lead-sources', marketingController.getLeadSources);
router.get('/analytics/property-performance', marketingController.getPropertyPerformance);
router.get('/analytics/conversion-funnel', marketingController.getConversionFunnel);

// Promotion routes
router.get('/promotions', marketingController.getPromotions);
router.post('/promotions', marketingController.createPromotion);
router.get('/promotions/:id', marketingController.getPromotion);
router.put('/promotions/:id', marketingController.updatePromotion);
router.delete('/promotions/:id', marketingController.deletePromotion);
router.post('/promotions/:id/activate', marketingController.activatePromotion);
router.post('/promotions/:id/deactivate', marketingController.deactivatePromotion);
router.post('/promotions/validate-code', marketingController.validatePromotionCode);

// Syndication routes
router.get('/syndication/platforms', marketingController.getSyndicationPlatforms);
router.put('/syndication/platforms/:id', marketingController.updateSyndicationPlatform);
router.post('/syndication/platforms/:id/sync', marketingController.syncPlatform);
router.post('/syndication/sync-all', marketingController.syncAllPlatforms);
router.get('/syndication/activity', marketingController.getSyncActivity);

export default router;