import { Router } from 'express';
import TenantController from '../controllers/tenantController';
import { authMiddleware } from '../middleware/authMiddleware';
import { predictiveAnalyticsService } from '../services/predictiveAnalytics.service';

const router = Router();

router.get('/', authMiddleware.protect, TenantController.getAllTenants);

/**
 * POST /tenant-screening/predict-issues
 * Calls the predictive analytics model to predict tenant screening issues.
 * Expects applicant/application data in the request body.
 */
router.post('/tenant-screening/predict-issues', async (req, res) => {
  try {
    const prediction = await predictiveAnalyticsService.predictTenantScreeningIssues(req.body);
    res.json(prediction);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || String(error) || 'Prediction failed' });
  }
});

/**
 * GET /tenant-screening/alerts
 * Returns a list of current issue alerts for tenant screening.
 * For now, returns mock data.
 */
router.get('/tenant-screening/alerts', async (req, res) => {
  try {
    const alerts = await predictiveAnalyticsService.getTenantScreeningAlerts();
    res.json(alerts);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || String(error) || 'Failed to fetch alerts' });
  }
});

export default router;
