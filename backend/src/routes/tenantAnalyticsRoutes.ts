import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import TenantAnalyticsController from '../controllers/tenantAnalyticsController';

const router = Router();

// Sentiment analytics endpoints
router.get('/sentiment-trends', authMiddleware.protect, TenantAnalyticsController.getSentimentTrends);
router.get('/common-issues', authMiddleware.protect, TenantAnalyticsController.getCommonIssues);
router.get('/early-warnings', authMiddleware.protect, TenantAnalyticsController.getEarlyWarnings);
router.get('/proactive-suggestions', authMiddleware.protect, TenantAnalyticsController.getProactiveSuggestions);

export default router;