import { Router, Request, Response } from 'express';
import { deprecationMonitor } from '../middleware/deprecation-monitor';

const router = Router();

/**
 * @route   GET /api/monitoring/deprecated-usage
 * @desc    Get deprecated endpoint usage report
 * @access  Admin only
 */
router.get('/deprecated-usage', async (req: Request, res: Response) => {
  try {
    const report = await deprecationMonitor.generateReport();
    res.json({
      success: true,
      data: report,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to generate deprecation report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate report'
    });
  }
});

/**
 * @route   GET /api/monitoring/health
 * @desc    API health check
 * @access  Public
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

export default router;