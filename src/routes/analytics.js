const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analyticsService');
const marketDataService = require('../services/marketDataService');
const authMiddleware = require('../middleware/authMiddleware');
const fs = require('fs').promises;
const path = require('path');

// Simple in-memory cache for predictions (in production, use Redis)
const predictionCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

const layoutsDir = path.join(__dirname, '../data/layouts');

router.get('/metrics', authMiddleware, async (req, res) => {
  try {
    const { dateFrom, dateTo, propertyIds } = req.query;

    // Default to last 30 days if not provided
    const fromDate = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = dateTo ? new Date(dateTo) : new Date();

    const propertyIdsArray = propertyIds ? propertyIds.split(',').map(id => id.trim()) : [];

    const userRole = req.user.role; // Assume user object has role
    const userProperties = req.user.properties || []; // Assume array of property IDs for managers

    const metrics = await analyticsService.getMetrics(fromDate, toDate, propertyIdsArray, userRole, userProperties);

    res.json(metrics);
  } catch (error) {
    console.error('Analytics metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics metrics' });
  }
});

router.post('/save-layout', authMiddleware, async (req, res) => {
  try {
    const { layout } = req.body;
    const userId = req.user.id; // Assume user has id
    const filePath = path.join(layoutsDir, `${userId}.json`);
    await fs.mkdir(layoutsDir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(layout));
    res.json({ success: true });
  } catch (error) {
    console.error('Save layout error:', error);
    res.status(500).json({ error: 'Failed to save layout' });
  }
});

router.get('/load-layout', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const filePath = path.join(layoutsDir, `${userId}.json`);
    const layout = await fs.readFile(filePath, 'utf8');
    res.json(JSON.parse(layout));
  } catch (error) {
    res.json([]); // Default empty layout
  }
});

router.post('/predict-maintenance', authMiddleware, async (req, res) => {
  try {
    const { propertyId } = req.body;

    if (!propertyId) {
      return res.status(400).json({
        error: 'Property ID is required',
        message: 'Please provide a propertyId in the request body'
      });
    }

    // Check cache first
    const cacheKey = `predict_${propertyId}`;
    const cached = predictionCache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      return res.json({
        ...cached.data,
        cached: true,
        cacheAge: Math.round((Date.now() - cached.timestamp) / 1000 / 60), // minutes
      });
    }

    // Generate predictions
    const result = await analyticsService.predictMaintenance(propertyId);

    // Cache the result
    predictionCache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });

    res.json({
      ...result,
      cached: false,
    });

  } catch (error) {
    console.error('Predict maintenance error:', error);
    res.status(500).json({
      error: 'Failed to generate maintenance predictions',
      message: 'An internal error occurred while processing your request'
    });
  }
});

router.post('/predict-churn', authMiddleware, async (req, res) => {
  try {
    const { tenantId } = req.body;

    if (!tenantId) {
      return res.status(400).json({
        error: 'Tenant ID is required',
        message: 'Please provide a tenantId in the request body'
      });
    }

    // Check cache first (shorter TTL for churn predictions)
    const cacheKey = `churn_${tenantId}`;
    const cached = predictionCache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL / 4) { // 6 hours for churn
      return res.json({
        ...cached.data,
        cached: true,
        cacheAge: Math.round((Date.now() - cached.timestamp) / 1000 / 60), // minutes
      });
    }

    // Generate churn prediction
    const result = await analyticsService.predictChurn(tenantId);

    // Cache the result
    predictionCache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });

    res.json({
      ...result,
      cached: false,
    });

  } catch (error) {
   console.error('Predict churn error:', error);
   res.status(500).json({
     error: 'Failed to generate churn prediction',
     message: 'An internal error occurred while processing your request'
   });
 }
});

// Market Data Endpoints

router.get('/market-data', authMiddleware, async (req, res) => {
 try {
   const { zipCode, propertyType } = req.query;

   if (!zipCode) {
     return res.status(400).json({
       error: 'Zip code is required',
       message: 'Please provide a zipCode query parameter'
     });
   }

   const marketData = await marketDataService.fetchMarketData(zipCode, propertyType);

   res.json({
     ...marketData,
     requested: {
       zipCode,
       propertyType: propertyType || 'residential'
     }
   });

 } catch (error) {
   console.error('Market data error:', error);
   res.status(500).json({
     error: 'Failed to fetch market data',
     message: 'An internal error occurred while processing your request'
   });
 }
});

router.post('/pricing-recommendations', authMiddleware, async (req, res) => {
 try {
   const { propertyId } = req.body;

   if (!propertyId) {
     return res.status(400).json({
       error: 'Property ID is required',
       message: 'Please provide a propertyId in the request body'
     });
   }

   // Check cache first
   const cacheKey = `pricing_${propertyId}`;
   const cached = predictionCache.get(cacheKey);

   if (cached && (Date.now() - cached.timestamp) < CACHE_TTL / 2) { // 12 hours for pricing
     return res.json({
       ...cached.data,
       cached: true,
       cacheAge: Math.round((Date.now() - cached.timestamp) / 1000 / 60), // minutes
     });
   }

   // Generate pricing recommendations
   const result = await marketDataService.getPricingRecommendations(propertyId);

   // Cache the result
   predictionCache.set(cacheKey, {
     data: result,
     timestamp: Date.now(),
   });

   res.json({
     ...result,
     cached: false,
   });

 } catch (error) {
   console.error('Pricing recommendations error:', error);
   res.status(500).json({
     error: 'Failed to generate pricing recommendations',
     message: 'An internal error occurred while processing your request'
   });
 }
});

router.post('/competitive-analysis', authMiddleware, async (req, res) => {
 try {
   const { propertyId } = req.body;

   if (!propertyId) {
     return res.status(400).json({
       error: 'Property ID is required',
       message: 'Please provide a propertyId in the request body'
     });
   }

   // Check cache first
   const cacheKey = `competitive_${propertyId}`;
   const cached = predictionCache.get(cacheKey);

   if (cached && (Date.now() - cached.timestamp) < CACHE_TTL / 2) { // 12 hours for analysis
     return res.json({
       ...cached.data,
       cached: true,
       cacheAge: Math.round((Date.now() - cached.timestamp) / 1000 / 60), // minutes
     });
   }

   // Generate competitive analysis
   const result = await marketDataService.getCompetitiveAnalysis(propertyId);

   // Cache the result
   predictionCache.set(cacheKey, {
     data: result,
     timestamp: Date.now(),
   });

   res.json({
     ...result,
     cached: false,
   });

 } catch (error) {
   console.error('Competitive analysis error:', error);
   res.status(500).json({
     error: 'Failed to generate competitive analysis',
     message: 'An internal error occurred while processing your request'
   });
 }
});

router.get('/market-trends', authMiddleware, async (req, res) => {
 try {
   const { zipCode, months } = req.query;

   if (!zipCode) {
     return res.status(400).json({
       error: 'Zip code is required',
       message: 'Please provide a zipCode query parameter'
     });
   }

   const monthsNum = months ? parseInt(months) : 12;
   const trends = await marketDataService.getMarketTrends(zipCode, monthsNum);

   res.json(trends);

 } catch (error) {
   console.error('Market trends error:', error);
   res.status(500).json({
     error: 'Failed to fetch market trends',
     message: 'An internal error occurred while processing your request'
   });
 }
});

module.exports = router;