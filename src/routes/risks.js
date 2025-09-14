const express = require('express');
const router = express.Router();
const riskAssessmentService = require('../services/riskAssessmentService');
const { body, param, query, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const authMiddleware = require('../middleware/authMiddleware');

// Rate limiting for risk assessment endpoints
const riskAssessmentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many risk assessment requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for portfolio assessments
const portfolioAssessmentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 portfolio assessments per hour
  message: 'Portfolio assessment limit exceeded. Please try again in an hour.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Error handling middleware
const handleAsyncError = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Apply authentication to all routes
router.use(authMiddleware);

// Apply rate limiting to all routes
router.use(riskAssessmentLimiter);

/**
 * @route POST /api/risks/assess
 * @desc Trigger comprehensive risk assessment for a specific entity
 * @access Private
 * @body {string} entityType - Type of entity (property, tenant, portfolio)
 * @body {string} entityId - ID of the entity to assess
 * @body {string} [assessmentType] - Type of assessment (comprehensive, maintenance, churn, etc.)
 */
router.post('/assess', [
  body('entityType')
    .isIn(['property', 'tenant', 'portfolio'])
    .withMessage('Entity type must be property, tenant, or portfolio'),
  body('entityId')
    .isUUID()
    .withMessage('Entity ID must be a valid UUID')
    .when(body('entityType').equals('portfolio'), {
      optional: true,
      nullable: true
    }),
  body('assessmentType')
    .optional()
    .isIn(['comprehensive', 'maintenance', 'churn', 'market', 'financial', 'operational', 'compliance'])
    .withMessage('Invalid assessment type'),
  handleValidationErrors
], handleAsyncError(async (req, res) => {
  const { entityType, entityId, assessmentType } = req.body;

  let result;

  try {
    switch (entityType) {
      case 'property':
        result = await riskAssessmentService.assessPropertyRisk(entityId, { type: assessmentType });
        break;
      case 'tenant':
        result = await riskAssessmentService.assessTenantRisk(entityId, { type: assessmentType });
        break;
      case 'portfolio':
        result = await riskAssessmentService.assessPortfolioRisk({ type: assessmentType });
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid entity type'
        });
    }

    res.json({
      success: true,
      data: result,
      message: `${entityType} risk assessment completed successfully`
    });

  } catch (error) {
    console.error('Risk assessment error:', error);
    res.status(500).json({
      success: false,
      error: 'Risk assessment failed',
      message: error.message
    });
  }
}));

/**
 * @route GET /api/risks/portfolio
 * @desc Get portfolio-wide risk summary
 * @access Private
 * @query {boolean} [detailed] - Include detailed risk factors
 * @query {string} [assessmentType] - Filter by assessment type
 */
router.get('/portfolio', [
  query('detailed')
    .optional()
    .isBoolean()
    .withMessage('Detailed must be a boolean'),
  query('assessmentType')
    .optional()
    .isIn(['comprehensive', 'maintenance', 'churn', 'market', 'financial', 'operational', 'compliance'])
    .withMessage('Invalid assessment type'),
  handleValidationErrors
], portfolioAssessmentLimiter, handleAsyncError(async (req, res) => {
  const { detailed, assessmentType } = req.query;

  try {
    // Get the most recent portfolio assessment
    const assessments = await riskAssessmentService.getEntityRiskAssessments(
      'portfolio',
      'portfolio-main',
      {
        assessmentType: assessmentType || 'portfolio',
        limit: 1
      }
    );

    if (assessments.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No portfolio risk assessment found',
        message: 'Run a portfolio assessment first using POST /api/risks/assess'
      });
    }

    const assessment = assessments[0];
    const response = {
      assessmentId: assessment.id,
      overallRiskScore: assessment.overallRiskScore,
      riskLevel: assessment.riskLevel,
      confidence: assessment.confidence,
      assessmentDate: assessment.assessmentDate,
      nextAssessmentDate: assessment.nextAssessmentDate,
      dataQuality: assessment.dataQuality
    };

    if (detailed === 'true') {
      response.riskFactors = assessment.riskFactors;
      response.mitigationStrategies = assessment.mitigationStrategies;
      response.trendData = assessment.trendData;
    }

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Portfolio risk retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve portfolio risk data',
      message: error.message
    });
  }
}));

/**
 * @route GET /api/risks/property/:id
 * @desc Get property-specific risk assessment
 * @access Private
 * @param {string} id - Property ID
 * @query {boolean} [detailed] - Include detailed risk factors
 * @query {string} [assessmentType] - Filter by assessment type
 * @query {number} [limit] - Number of assessments to return
 */
router.get('/property/:id', [
  param('id')
    .isUUID()
    .withMessage('Property ID must be a valid UUID'),
  query('detailed')
    .optional()
    .isBoolean()
    .withMessage('Detailed must be a boolean'),
  query('assessmentType')
    .optional()
    .isIn(['comprehensive', 'maintenance', 'churn', 'market', 'financial', 'operational', 'compliance'])
    .withMessage('Invalid assessment type'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  handleValidationErrors
], handleAsyncError(async (req, res) => {
  const { id } = req.params;
  const { detailed, assessmentType, limit } = req.query;

  try {
    const assessments = await riskAssessmentService.getEntityRiskAssessments(
      'property',
      id,
      {
        assessmentType,
        limit: limit || 5
      }
    );

    if (assessments.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No risk assessments found for this property',
        message: 'Run a property assessment first using POST /api/risks/assess'
      });
    }

    const response = {
      propertyId: id,
      assessments: assessments.map(assessment => ({
        assessmentId: assessment.id,
        assessmentType: assessment.assessmentType,
        overallRiskScore: assessment.overallRiskScore,
        riskLevel: assessment.riskLevel,
        confidence: assessment.confidence,
        assessmentDate: assessment.assessmentDate,
        nextAssessmentDate: assessment.nextAssessmentDate,
        dataQuality: assessment.dataQuality,
        ...(detailed === 'true' && {
          riskFactors: assessment.riskFactors,
          mitigationStrategies: assessment.mitigationStrategies,
          trendData: assessment.trendData
        })
      }))
    };

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Property risk retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve property risk data',
      message: error.message
    });
  }
}));

/**
 * @route GET /api/risks/tenant/:id
 * @desc Get tenant-specific risk assessment
 * @access Private
 * @param {string} id - Tenant ID
 * @query {boolean} [detailed] - Include detailed risk factors
 * @query {string} [assessmentType] - Filter by assessment type
 * @query {number} [limit] - Number of assessments to return
 */
router.get('/tenant/:id', [
  param('id')
    .isUUID()
    .withMessage('Tenant ID must be a valid UUID'),
  query('detailed')
    .optional()
    .isBoolean()
    .withMessage('Detailed must be a boolean'),
  query('assessmentType')
    .optional()
    .isIn(['comprehensive', 'maintenance', 'churn', 'market', 'financial', 'operational', 'compliance'])
    .withMessage('Invalid assessment type'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  handleValidationErrors
], handleAsyncError(async (req, res) => {
  const { id } = req.params;
  const { detailed, assessmentType, limit } = req.query;

  try {
    const assessments = await riskAssessmentService.getEntityRiskAssessments(
      'tenant',
      id,
      {
        assessmentType,
        limit: limit || 5
      }
    );

    if (assessments.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No risk assessments found for this tenant',
        message: 'Run a tenant assessment first using POST /api/risks/assess'
      });
    }

    const response = {
      tenantId: id,
      assessments: assessments.map(assessment => ({
        assessmentId: assessment.id,
        assessmentType: assessment.assessmentType,
        overallRiskScore: assessment.overallRiskScore,
        riskLevel: assessment.riskLevel,
        confidence: assessment.confidence,
        assessmentDate: assessment.assessmentDate,
        nextAssessmentDate: assessment.nextAssessmentDate,
        dataQuality: assessment.dataQuality,
        ...(detailed === 'true' && {
          riskFactors: assessment.riskFactors,
          mitigationStrategies: assessment.mitigationStrategies,
          trendData: assessment.trendData
        })
      }))
    };

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Tenant risk retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve tenant risk data',
      message: error.message
    });
  }
}));

/**
 * @route GET /api/risks/trends
 * @desc Get historical risk trends
 * @access Private
 * @query {string} entityType - Type of entity (property, tenant, portfolio)
 * @query {string} entityId - ID of the entity
 * @query {string} [period] - Time period (7d, 30d, 90d, 1y)
 * @query {string} [assessmentType] - Filter by assessment type
 */
router.get('/trends', [
  query('entityType')
    .isIn(['property', 'tenant', 'portfolio'])
    .withMessage('Entity type must be property, tenant, or portfolio'),
  query('entityId')
    .isUUID()
    .withMessage('Entity ID must be a valid UUID')
    .when(query('entityType').equals('portfolio'), {
      optional: true,
      nullable: true
    }),
  query('period')
    .optional()
    .isIn(['7d', '30d', '90d', '1y'])
    .withMessage('Period must be 7d, 30d, 90d, or 1y'),
  query('assessmentType')
    .optional()
    .isIn(['comprehensive', 'maintenance', 'churn', 'market', 'financial', 'operational', 'compliance'])
    .withMessage('Invalid assessment type'),
  handleValidationErrors
], handleAsyncError(async (req, res) => {
  const { entityType, entityId, period, assessmentType } = req.query;

  try {
    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30); // Default to 30 days
    }

    const trends = await riskAssessmentService.getRiskTrends(
      entityType,
      entityId || 'portfolio-main',
      {
        assessmentType,
        startDate,
        endDate
      }
    );

    res.json({
      success: true,
      data: {
        entityType,
        entityId: entityId || 'portfolio-main',
        period: period || '30d',
        trends: trends,
        dateRange: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        }
      }
    });

  } catch (error) {
    console.error('Risk trends retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve risk trends',
      message: error.message
    });
  }
}));

/**
 * @route GET /api/risks/assessment/:id
 * @desc Get specific risk assessment by ID
 * @access Private
 * @param {string} id - Assessment ID
 */
router.get('/assessment/:id', [
  param('id')
    .isUUID()
    .withMessage('Assessment ID must be a valid UUID'),
  handleValidationErrors
], handleAsyncError(async (req, res) => {
  const { id } = req.params;

  try {
    const assessment = await riskAssessmentService.getRiskAssessment(id);

    res.json({
      success: true,
      data: {
        assessmentId: assessment.id,
        entityType: assessment.entityType,
        entityId: assessment.entityId,
        assessmentType: assessment.assessmentType,
        overallRiskScore: assessment.overallRiskScore,
        riskLevel: assessment.riskLevel,
        confidence: assessment.confidence,
        riskFactors: assessment.riskFactors,
        mitigationStrategies: assessment.mitigationStrategies,
        trendData: assessment.trendData,
        alertsTriggered: assessment.alertsTriggered,
        assessmentDate: assessment.assessmentDate,
        nextAssessmentDate: assessment.nextAssessmentDate,
        dataQuality: assessment.dataQuality,
        metadata: assessment.metadata
      }
    });

  } catch (error) {
    console.error('Risk assessment retrieval error:', error);
    if (error.message === 'Risk assessment not found') {
      return res.status(404).json({
        success: false,
        error: 'Risk assessment not found'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve risk assessment',
      message: error.message
    });
  }
}));

/**
 * @route GET /api/risks/summary
 * @desc Get risk summary statistics
 * @access Private
 * @query {string} [entityType] - Filter by entity type
 * @query {string} [riskLevel] - Filter by risk level
 * @query {string} [period] - Time period for summary
 */
router.get('/summary', [
  query('entityType')
    .optional()
    .isIn(['property', 'tenant', 'portfolio'])
    .withMessage('Entity type must be property, tenant, or portfolio'),
  query('riskLevel')
    .optional()
    .isIn(['minimal', 'low', 'medium', 'high', 'critical'])
    .withMessage('Invalid risk level'),
  query('period')
    .optional()
    .isIn(['7d', '30d', '90d', '1y'])
    .withMessage('Period must be 7d, 30d, 90d, or 1y'),
  handleValidationErrors
], handleAsyncError(async (req, res) => {
  const { entityType, riskLevel, period } = req.query;

  try {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Build where clause for filtering
    const whereClause = {
      assessmentDate: {
        [require('sequelize').Op.between]: [startDate, endDate]
      }
    };

    if (entityType) {
      whereClause.entityType = entityType;
    }

    if (riskLevel) {
      whereClause.riskLevel = riskLevel;
    }

    // Get summary statistics
    const [totalAssessments, riskLevelCounts, averageScore] = await Promise.all([
      require('../models/RiskAssessment').count({ where: whereClause }),
      require('../models/RiskAssessment').findAll({
        where: whereClause,
        attributes: [
          'riskLevel',
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
        ],
        group: ['riskLevel']
      }),
      require('../models/RiskAssessment').findAll({
        where: whereClause,
        attributes: [
          [require('sequelize').fn('AVG', require('sequelize').col('overallRiskScore')), 'averageScore']
        ]
      })
    ]);

    // Format risk level counts
    const riskLevelSummary = {};
    riskLevelCounts.forEach(item => {
      riskLevelSummary[item.dataValues.riskLevel] = parseInt(item.dataValues.count);
    });

    const summary = {
      totalAssessments,
      period: period || '30d',
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      },
      riskLevelBreakdown: riskLevelSummary,
      averageRiskScore: averageScore[0]?.dataValues?.averageScore || 0,
      filters: {
        entityType: entityType || 'all',
        riskLevel: riskLevel || 'all'
      }
    };

    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('Risk summary retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve risk summary',
      message: error.message
    });
  }
}));

// Global error handler for this router
router.use((error, req, res, next) => {
  console.error('Risk API Error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

module.exports = router;