const express = require('express');
const router = express.Router();
const { runScreening, getScreeningReport, generateReportPDF } from '../services/screeningWorkflow';
const tenantService from '../services/tenantService';

const requireAuth = require('./middleware/authMiddleware');
const rateLimit = require('./middleware/rateLimit');

router.post('/screen', requireAuth, rateLimit, async (req, res) => {
  try {
    const { tenantId, applicationId } = req.body;
    if (!tenantId) return res.status(400).json({ error: 'tenantId required' });

    const result = await runScreening(tenantId, applicationId);

    res.json({
      success: true,
      reportId: result.reportId,
      riskLevel: result.riskLevel,
      overallRiskScore: result.overallRiskScore,
      aiAssessment: result.aiAssessment,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/screen/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const report = await getScreeningReport(id);
    res.json(report);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

router.get('/screen/report/:tenantId', requireAuth, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const tenant = await tenantService.getTenant(tenantId);
    const reportId = tenant.screeningStatus.reportId;
    if (!reportId) return res.status(404).json({ error: 'No report for tenant' });

    const pdfContent = await generateReportPDF(reportId);
    res.set('Content-Type', 'application/pdf');
    res.send(pdfContent); // Buffer in prod
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;