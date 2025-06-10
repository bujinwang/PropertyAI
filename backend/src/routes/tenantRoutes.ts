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
  // TODO: Replace with real alert fetching logic
  const mockAlerts = [
    {
      id: 'alert-1',
      message: 'Unusual delay in application processing for Application #1234',
      severity: 'high',
      timestamp: new Date().toISOString(),
      context: { applicationId: '1234', stage: 'Background Check' },
    },
    {
      id: 'alert-2',
      message: 'Spike in document verification failures detected',
      severity: 'medium',
      timestamp: new Date().toISOString(),
      context: { affectedApplications: 7 },
    },
  ];
  res.json(mockAlerts);
});

export default router;
