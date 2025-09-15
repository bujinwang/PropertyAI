/**
 * Feedback Routes for Epic 21 User Feedback Collection
 * Advanced Analytics and AI Insights Features
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const Feedback = require('../models/Feedback');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Rate limiting for feedback submission
const feedbackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each user to 10 feedback submissions per window
  message: {
    error: 'Too many feedback submissions. Please try again later.',
    retryAfter: 15 * 60 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip
});

// Validation middleware
const validateFeedback = [
  body('feature')
    .isIn([
      'predictive_maintenance',
      'tenant_churn_prediction',
      'market_trend_integration',
      'ai_powered_reporting',
      'risk_assessment_dashboard',
      'overall_experience'
    ])
    .withMessage('Invalid feature specified'),

  body('feedbackType')
    .isIn(['bug_report', 'feature_request', 'usability_feedback', 'performance_feedback', 'general_feedback'])
    .withMessage('Invalid feedback type'),

  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),

  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),

  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),

  body('category')
    .isIn([
      'accuracy',
      'usability',
      'performance',
      'functionality',
      'design',
      'integration',
      'data_quality',
      'other'
    ])
    .withMessage('Invalid category specified'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid priority level')
];

/**
 * POST /api/feedback
 * Submit user feedback for Epic 21 features
 */
router.post('/', authenticateToken, feedbackLimiter, validateFeedback, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      feature,
      feedbackType,
      rating,
      title,
      description,
      category,
      priority = 'medium'
    } = req.body;

    // Create feedback record
    const feedback = await Feedback.create({
      userId: req.user.id,
      userType: req.user.userType || 'other',
      feature,
      feedbackType,
      rating,
      title,
      description,
      category,
      priority,
      userAgent: req.get('User-Agent'),
      url: req.body.url || req.originalUrl,
      sessionId: req.sessionID
    });

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedbackId: feedback.id,
      status: 'submitted'
    });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      error: 'Failed to submit feedback',
      message: 'An error occurred while processing your feedback. Please try again.'
    });
  }
});

/**
 * GET /api/feedback/stats
 * Get feedback statistics (admin only)
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Check if user has admin privileges
    if (!req.user.roles?.includes('admin') && req.user.userType !== 'executive') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to view feedback statistics'
      });
    }

    const { feature, days = 30 } = req.query;

    // Get feedback statistics
    const stats = await Feedback.getFeedbackStats(feature, parseInt(days));
    const averageRatings = await Feedback.getAverageRating(feature, parseInt(days));

    // Get feedback counts by status
    const statusCounts = await Feedback.findAll({
      where: feature ? { feature } : {},
      attributes: [
        'status',
        [Feedback.sequelize.fn('COUNT', Feedback.sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    res.json({
      period: `${days} days`,
      feature: feature || 'all',
      statistics: {
        totalFeedback: stats.reduce((sum, stat) => sum + parseInt(stat.dataValues.count), 0),
        averageRatings,
        statusBreakdown: statusCounts,
        categoryBreakdown: stats
      }
    });

  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    res.status(500).json({
      error: 'Failed to fetch feedback statistics'
    });
  }
});

/**
 * GET /api/feedback/my-feedback
 * Get user's own feedback submissions
 */
router.get('/my-feedback', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const whereClause = { userId: req.user.id };
    if (status) {
      whereClause.status = status;
    }

    const feedbacks = await Feedback.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['createdAt', 'DESC']],
      attributes: [
        'id',
        'feature',
        'feedbackType',
        'rating',
        'title',
        'description',
        'category',
        'priority',
        'status',
        'createdAt',
        'acknowledgedAt',
        'resolvedAt'
      ]
    });

    res.json({
      feedbacks: feedbacks.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(feedbacks.count / parseInt(limit)),
        totalItems: feedbacks.count,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching user feedback:', error);
    res.status(500).json({
      error: 'Failed to fetch your feedback'
    });
  }
});

/**
 * PUT /api/feedback/:id/status
 * Update feedback status (admin only)
 */
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    // Check if user has admin privileges
    if (!req.user.roles?.includes('admin') && req.user.userType !== 'executive') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to update feedback status'
      });
    }

    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['acknowledged', 'in_review', 'addressed', 'closed'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: 'Status must be one of: acknowledged, in_review, addressed, closed'
      });
    }

    const feedback = await Feedback.findByPk(id);
    if (!feedback) {
      return res.status(404).json({
        error: 'Feedback not found'
      });
    }

    // Update status
    if (status === 'acknowledged') {
      await feedback.acknowledge();
    } else if (status === 'addressed') {
      await feedback.resolve();
    } else if (status === 'closed') {
      await feedback.close();
    } else {
      feedback.status = status;
      await feedback.save();
    }

    res.json({
      message: 'Feedback status updated successfully',
      feedback: {
        id: feedback.id,
        status: feedback.status,
        updatedAt: feedback.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating feedback status:', error);
    res.status(500).json({
      error: 'Failed to update feedback status'
    });
  }
});

/**
 * GET /api/feedback/export
 * Export feedback data for analysis (admin only)
 */
router.get('/export', authenticateToken, async (req, res) => {
  try {
    // Check if user has admin privileges
    if (!req.user.roles?.includes('admin') && req.user.userType !== 'executive') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to export feedback data'
      });
    }

    const { feature, startDate, endDate, format = 'json' } = req.query;

    const whereClause = {};
    if (feature) whereClause.feature = feature;
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Feedback.sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const feedbacks = await Feedback.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      attributes: [
        'id',
        'userId',
        'userType',
        'feature',
        'feedbackType',
        'rating',
        'title',
        'description',
        'category',
        'priority',
        'status',
        'createdAt',
        'acknowledgedAt',
        'resolvedAt'
      ]
    });

    if (format === 'csv') {
      // Convert to CSV format
      const csvData = feedbacks.map(f => ({
        ...f.dataValues,
        createdAt: f.createdAt.toISOString(),
        acknowledgedAt: f.acknowledgedAt?.toISOString(),
        resolvedAt: f.resolvedAt?.toISOString()
      }));

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="epic21-feedback-export.csv"');

      // Simple CSV conversion (in production, use a proper CSV library)
      const headers = Object.keys(csvData[0] || {}).join(',');
      const rows = csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','));
      res.send([headers, ...rows].join('\n'));
    } else {
      res.json({
        exportDate: new Date().toISOString(),
        totalRecords: feedbacks.length,
        filters: { feature, startDate, endDate },
        data: feedbacks
      });
    }

  } catch (error) {
    console.error('Error exporting feedback:', error);
    res.status(500).json({
      error: 'Failed to export feedback data'
    });
  }
});

module.exports = router;