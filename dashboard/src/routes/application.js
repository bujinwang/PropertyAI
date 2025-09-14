const express = require('express');
const router = express.Router();
const screeningWorkflow from '../services/screeningWorkflow';
const notificationService from '../services/NotificationService';
const tenantService from '../services/tenantService';

const requireAuth = require('./middleware/authMiddleware');
const rateLimit = require('./middleware/rateLimit');

// POST /api/marketplace/application/submit
router.post('/submit', requireAuth, rateLimit, async (req, res) => {
  try {
    const { tenantId, propertyId, notes } = req.body;
    if (!tenantId || !propertyId) return res.status(400).json({ error: 'tenantId and propertyId required' });

    // Trigger screening
    const screeningResult = await screeningWorkflow.runScreening(tenantId, 'app-' + Date.now());

    // Create application record (assume Application model exists or use ScreeningReport as proxy)
    const application = {
      id: 'app-' + Date.now(),
      tenantId,
      propertyId,
      status: 'submitted',
      screeningReportId: screeningResult.reportId,
      notes,
      submittedAt: new Date(),
    };

    // Notify owner
    await notificationService.notifyOwner('owner@example.com', application.id, 'submitted'); // Mock owner

    res.json({ success: true, applicationId: application.id, screeningId: screeningResult.reportId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/marketplace/application/:id/approve
router.post('/application/:id/approve', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    // Update application status
    // Assume Application model
    // await Application.update({ status: 'approved' }, { where: { id } });

    // Notify tenant
    await notificationService.notifyTenant('tenant@example.com', 'screening-report-id', 'low'); // Mock

    res.json({ success: true, status: 'approved' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/marketplace/application/:id/reject
router.post('/application/:id/reject', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    // Update application status
    // await Application.update({ status: 'rejected' }, { where: { id } });

    // Notify tenant
    await notificationService.notifyTenant('tenant@example.com', 'screening-report-id', 'high');

    res.json({ success: true, status: 'rejected' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/marketplace/applications/pending
router.get('/applications/pending', requireAuth, async (req, res) => {
  // Mock or query DB for pending applications
  res.json({ applications: [] }); // Placeholder
});

module.exports = router;