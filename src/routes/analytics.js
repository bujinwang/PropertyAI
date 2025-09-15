const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analyticsService');
const marketDataService = require('../services/marketDataService');
const authMiddleware = require('../middleware/authMiddleware');
const exportService = require('../utils/exportService');
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
router.post('/export', authMiddleware, async (req, res) => {
  try {
    const { format, template, filters = {} } = req.body;

    // Validate required parameters
    if (!format || !template) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'Both format and template are required'
      });
    }

    // Validate export parameters
    exportService.validateExportParams(format, template, filters);

    // Role-based access control
    const userRole = req.user.role;
    const userProperties = req.user.properties || [];

    // Managers can only export their assigned properties
    if (userRole === 'PROPERTY_MANAGER' && filters.propertyIds) {
      const requestedProperties = filters.propertyIds.split(',').map(id => id.trim());
      const unauthorized = requestedProperties.some(propId => !userProperties.includes(propId));

      if (unauthorized) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only export data for your assigned properties'
        });
      }
    }

    // Get analytics data based on user role and filters
    const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateTo = filters.dateTo ? new Date(filters.dateTo) : new Date();
    const propertyIdsArray = filters.propertyIds ? filters.propertyIds.split(',').map(id => id.trim()) : [];

    const analyticsData = await analyticsService.getMetrics(dateFrom, dateTo, propertyIdsArray, userRole, userProperties);

    // Add additional data based on template
    let exportData = { ...analyticsData };

    if (template === 'audit') {
      // Get audit trail data (mock for now - would come from audit service)
      exportData.auditTrail = [
        {
          createdAt: new Date().toISOString(),
          action: 'EXPORT_GENERATED',
          entityType: 'ANALYTICS',
          entityId: 'export_' + Date.now(),
          user: req.user.email,
          details: `Generated ${format.toUpperCase()} export for ${template} template`
        }
      ];
    }

    // Generate export file
    let fileContent;
    let contentType;
    let filename;

    if (format === 'pdf') {
      fileContent = await exportService.generatePDF(exportData, template, filters);
      contentType = 'application/pdf';
      filename = `${template}-report-${new Date().toISOString().split('T')[0]}.pdf`;
    } else if (format === 'csv') {
      fileContent = await exportService.generateCSV(exportData, template, filters);
      contentType = 'text/csv';
      filename = `${template}-report-${new Date().toISOString().split('T')[0]}.csv`;
    }

    // For small files, return base64 content directly
    if (Buffer.isBuffer(fileContent) && fileContent.length < 5 * 1024 * 1024) { // < 5MB
      const base64Content = fileContent.toString('base64');
      res.json({
        success: true,
        format,
        template,
        filename,
        contentType,
        data: base64Content,
        size: fileContent.length
      });
    } else {
      // For larger files, save to temp location and return signed URL
      // (In production, this would upload to S3 and return signed URL)
      const tempPath = path.join('/tmp', `export_${Date.now()}_${filename}`);
      await fs.writeFile(tempPath, fileContent);

      // Mock signed URL for development
      const signedUrl = `http://localhost:3000/temp-exports/${filename}`;

      res.json({
        success: true,
        format,
        template,
        filename,
        contentType,
        signedUrl,
        expiresIn: 3600 // 1 hour
      });
    }

  } catch (error) {
    console.error('Export error:', error);

    if (error.message.includes('Invalid format') ||
        error.message.includes('Invalid template') ||
        error.message.includes('Date from cannot be after date to') ||
        error.message.includes('Date range cannot exceed')) {
      return res.status(400).json({
        error: 'Invalid parameters',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Export failed',
      message: 'An internal error occurred while generating the export'
    });
  }
});
  }
});

// Schedule recurring exports
router.post('/schedule-export', authMiddleware, async (req, res) => {
  try {
    const { format, template, frequency, email, filters = {} } = req.body;

    // Validate required parameters
    if (!format || !template || !frequency || !email) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'Format, template, frequency, and email are all required'
      });
    }

    // Validate frequency
    if (!['weekly', 'monthly'].includes(frequency)) {
      return res.status(400).json({
        error: 'Invalid frequency',
        message: 'Frequency must be either "weekly" or "monthly"'
      });
    }

    // Validate email format (basic check)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email',
        message: 'Please provide a valid email address'
      });
    }

    // Validate export parameters
    exportService.validateExportParams(format, template, filters);

    // Role-based access control
    const userRole = req.user.role;
    const userProperties = req.user.properties || [];

    // Managers can only schedule exports for their assigned properties
    if (userRole === 'PROPERTY_MANAGER' && filters.propertyIds) {
      const requestedProperties = filters.propertyIds.split(',').map(id => id.trim());
      const unauthorized = requestedProperties.some(propId => !userProperties.includes(propId));

      if (unauthorized) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only schedule exports for your assigned properties'
        });
      }
    }

    // For now, simulate scheduling success (in production, this would call backend API)
    // TODO: Replace with actual backend API call when backend scheduler is available
    const scheduleId = `schedule_${Date.now()}_${req.user.id}`;

    // Mock schedule creation
    const scheduleData = {
      id: scheduleId,
      userId: req.user.id,
      userEmail: req.user.email,
      format,
      template,
      frequency,
      email,
      filters,
      createdAt: new Date().toISOString(),
      nextRun: frequency === 'weekly'
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active'
    };

    // In production, this would save to backend database via API call
    console.log('Scheduled export created (frontend):', scheduleData);

    res.json({
      success: true,
      message: `Export scheduled successfully! You will receive ${frequency} reports at ${email}`,
      scheduleId,
      nextRun: scheduleData.nextRun
    });

  } catch (error) {
    console.error('Schedule export error:', error);

    if (error.message.includes('Invalid format') ||
        error.message.includes('Invalid template') ||
        error.message.includes('Date from cannot be after date to') ||
        error.message.includes('Date range cannot exceed')) {
      return res.status(400).json({
        error: 'Invalid parameters',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Scheduling failed',
      message: 'An internal error occurred while scheduling the export'
    });
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