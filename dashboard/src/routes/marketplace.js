const express = require('express');
const router = express.Router();
const marketplaceService = require('../services/marketplaceService');
const authMiddleware = require('../middleware/auth'); // Assume existing
const rateLimit = require('../middleware/rateLimit'); // Existing

// POST /api/marketplace/match
router.post('/match', authMiddleware, rateLimit(100, '1m'), async (req, res) => {
  try {
    const { tenantId, propertyIds } = req.body;
    if (!tenantId) return res.status(400).json({ error: 'tenantId required' });

    const matches = await marketplaceService.generateMatches(tenantId, propertyIds);
    res.json({ matches, count: matches.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/marketplace/score/tenant/:tenantId
router.get('/score/tenant/:tenantId', authMiddleware, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const score = await marketplaceService.scoreTenant(tenantId);
    res.json(score);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/marketplace/score/property/:propertyId
router.get('/score/property/:propertyId', authMiddleware, async (req, res) => {
  try {
    const { propertyId } = req.params;
    const criteria = req.query; // From query params
    const score = await marketplaceService.scoreProperty(propertyId, criteria);
    res.json(score);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/marketplace/ab-test
router.post('/ab-test', authMiddleware, async (req, res) => {
  try {
    const { tenantId, variant, propertyIds } = req.body;
    const results = await marketplaceService.runABTest(tenantId, variant, propertyIds);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;