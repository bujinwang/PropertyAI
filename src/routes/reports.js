/**
 * Reports API Routes
 * Handles AI-powered report generation, management, and delivery
 */

const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { authenticate, authorize } = require('../middleware/auth');
const reportingService = require('../services/reportingService');
const auditService = require('../services/auditService');
const { ReportTemplate, GeneratedReport } = require('../models');
const rateLimit = require('express-rate-limit');

// Rate limiting for report generation
const reportGenerationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each user to 10 report generations per windowMs
  message: 'Too many report generation requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation schemas
const generateReportSchema = Joi.object({
  templateId: Joi.string().required(),
  parameters: Joi.object().default({}),
  format: Joi.string().valid('json', 'pdf', 'csv', 'excel').default('json'),
  emailDelivery: Joi.boolean().default(false),
  recipientEmails: Joi.array().items(Joi.string().email()).when('emailDelivery', {
    is: true,
    then: Joi.required()
  })
});

const createTemplateSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().allow('').optional(),
  type: Joi.string().valid('monthly', 'quarterly', 'weekly', 'daily', 'custom').default('monthly'),
  category: Joi.string().valid('executive', 'operational', 'financial', 'compliance', 'custom').default('executive'),
  sections: Joi.array().items(Joi.string()).default([]),
  dataSources: Joi.array().items(Joi.string()).default([]),
  visualizations: Joi.array().items(Joi.string()).default([]),
  filters: Joi.object().default({}),
  styling: Joi.object().default({}),
  isPublic: Joi.boolean().default(false),
  tags: Joi.array().items(Joi.string()).default([])
});

const updateTemplateSchema = createTemplateSchema.keys({
  isActive: Joi.boolean().optional()
});

/**
 * GET /api/reports/templates
 * Get all available report templates
 */
router.get('/templates', authenticate, async (req, res) => {
  try {
    const { category, type, isPublic } = req.query;
    const userId = req.user.id;

    const whereClause = {};

    // Filter by category if provided
    if (category) {
      whereClause.category = category;
    }

    // Filter by type if provided
    if (type) {
      whereClause.type = type;
    }

    // Show public templates or user's own templates
    whereClause[Op.or] = [
      { isPublic: true },
      { createdBy: userId }
    ];

    // Only show active templates
    whereClause.isActive = true;

    const templates = await ReportTemplate.findAll({
      where: whereClause,
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: templates,
      count: templates.length
    });
  } catch (error) {
    console.error('Error fetching report templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch report templates'
    });
  }
});

/**
 * GET /api/reports/templates/:id
 * Get a specific report template
 */
router.get('/templates/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const template = await ReportTemplate.findOne({
      where: {
        id,
        [Op.or]: [
          { isPublic: true },
          { createdBy: userId }
        ],
        isActive: true
      }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Report template not found'
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error fetching report template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch report template'
    });
  }
});

/**
 * POST /api/reports/templates
 * Create a new report template
 */
router.post('/templates', authenticate, authorize(['admin', 'manager']), async (req, res) => {
  try {
    const { error, value } = createTemplateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const templateData = {
      ...value,
      createdBy: req.user.id
    };

    const template = await ReportTemplate.create(templateData);

    res.status(201).json({
      success: true,
      data: template,
      message: 'Report template created successfully'
    });
  } catch (error) {
    console.error('Error creating report template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create report template'
    });
  }
});

/**
 * PUT /api/reports/templates/:id
 * Update a report template
 */
router.put('/templates/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { error, value } = updateTemplateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const template = await ReportTemplate.findOne({
      where: {
        id,
        createdBy: userId,
        isActive: true
      }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Report template not found or access denied'
      });
    }

    await template.update({
      ...value,
      updatedBy: userId
    });

    res.json({
      success: true,
      data: template,
      message: 'Report template updated successfully'
    });
  } catch (error) {
    console.error('Error updating report template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update report template'
    });
  }
});

/**
 * DELETE /api/reports/templates/:id
 * Deactivate a report template (soft delete)
 */
router.delete('/templates/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const template = await ReportTemplate.findOne({
      where: {
        id,
        createdBy: userId,
        isActive: true
      }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Report template not found or access denied'
      });
    }

    await template.update({
      isActive: false,
      updatedBy: userId
    });

    res.json({
      success: true,
      message: 'Report template deactivated successfully'
    });
  } catch (error) {
    console.error('Error deactivating report template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate report template'
    });
  }
});

/**
 * POST /api/reports/generate
 * Generate a report from a template
 */
router.post('/generate', authenticate, reportGenerationLimiter, async (req, res) => {
  try {
    const { error, value } = generateReportSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { templateId, parameters, format, emailDelivery, recipientEmails } = value;
    const userId = req.user.id;

    // Verify template access
    const template = await ReportTemplate.findOne({
      where: {
        id: templateId,
        [Op.or]: [
          { isPublic: true },
          { createdBy: userId }
        ],
        isActive: true
      }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Report template not found or access denied'
      });
    }

    // Start report generation (async)
    const auditContext = {
      userId,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };

    const reportId = await reportingService.generateReport(templateId, {
      ...parameters,
      userId,
      format
    }, auditContext);

    // If email delivery requested, schedule it
    if (emailDelivery && recipientEmails) {
      try {
        // Deliver report by email asynchronously
        setImmediate(async () => {
          try {
            await reportingService.deliverReportByEmail(reportId, recipientEmails, {
              subject: `AI Report: ${template.name}`,
              message: 'Your requested AI-generated report is ready.',
              priority: 'normal'
            });
            console.log(`Report ${reportId} successfully delivered to:`, recipientEmails);
          } catch (emailError) {
            console.error(`Failed to deliver report ${reportId} by email:`, emailError);
          }
        });
      } catch (error) {
        console.error('Error initiating email delivery:', error);
      }
    }

    res.status(202).json({
      success: true,
      data: {
        reportId,
        status: 'generating',
        message: 'Report generation started. Check status with GET /api/reports/{id}'
      }
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate report'
    });
  }
});

/**
 * GET /api/reports
 * Get user's generated reports
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, templateId, limit = 20, offset = 0 } = req.query;

    const whereClause = {
      createdBy: userId
    };

    if (status) {
      whereClause.status = status;
    }

    if (templateId) {
      whereClause.templateId = templateId;
    }

    const reports = await GeneratedReport.findAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['generatedAt', 'DESC']]
    });

    const total = await GeneratedReport.count({ where: whereClause });

    res.json({
      success: true,
      data: reports,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: offset + reports.length < total
      }
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reports'
    });
  }
});

/**
 * GET /api/reports/:id
 * Get a specific generated report
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const report = await GeneratedReport.findOne({
      where: {
        id,
        [Op.or]: [
          { isPublic: true },
          { createdBy: userId }
        ]
      }
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found or access denied'
      });
    }

    // Check if report is expired
    if (report.isExpired()) {
      return res.status(410).json({
        success: false,
        error: 'Report has expired'
      });
    }

    // Mark as accessed
    await report.markAsAccessed();

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch report'
    });
  }
});

/**
 * POST /api/reports/:id/export
 * Export a report in specified format
 */
router.post('/:id/export', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'pdf' } = req.body;
    const userId = req.user.id;

    const report = await GeneratedReport.findOne({
      where: {
        id,
        createdBy: userId,
        status: 'completed'
      }
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found or not ready for export'
      });
    }

    if (report.isExpired()) {
      return res.status(410).json({
        success: false,
        error: 'Report has expired'
      });
    }

    const auditContext = {
      userId: req.user.id,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };

    const exportResult = await reportingService.exportReport(id, format, auditContext);

    // Mark as accessed
    await report.markAsAccessed();

    res.json({
      success: true,
      data: exportResult
    });
  } catch (error) {
    console.error('Error exporting report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export report'
    });
  }
});

/**
 * DELETE /api/reports/:id
 * Delete a generated report
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const report = await GeneratedReport.findOne({
      where: {
        id,
        createdBy: userId
      }
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found or access denied'
      });
    }

    await report.destroy();

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete report'
    });
  }
});

/**
 * GET /api/reports/scheduled
 * Get scheduled reports
 */
router.get('/scheduled/list', authenticate, async (req, res) => {
  try {
    // This would integrate with a scheduling service
    // For now, return empty array
    res.json({
      success: true,
      data: [],
      message: 'Scheduled reports feature coming soon'
    });
  } catch (error) {
    console.error('Error fetching scheduled reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scheduled reports'
    });
  }
});

/**
 * POST /api/reports/:id/deliver
 * Deliver a generated report by email
 */
router.post('/:id/deliver', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const deliverSchema = Joi.object({
      recipientEmails: Joi.array().items(Joi.string().email()).min(1).required(),
      subject: Joi.string().max(200).optional(),
      message: Joi.string().max(1000).optional(),
      priority: Joi.string().valid('low', 'normal', 'high', 'urgent').default('normal'),
      includeInsights: Joi.boolean().default(true),
      includeRecommendations: Joi.boolean().default(true)
    });

    const { error, value } = deliverSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const report = await GeneratedReport.findOne({
      where: {
        id,
        createdBy: userId,
        status: 'completed'
      }
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found or not ready for delivery'
      });
    }

    if (report.isExpired()) {
      return res.status(410).json({
        success: false,
        error: 'Report has expired'
      });
    }

    const auditContext = {
      userId: req.user.id,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };

    // Deliver report by email
    const deliveryResult = await reportingService.deliverReportByEmail(
      id,
      value.recipientEmails,
      {
        subject: value.subject,
        message: value.message,
        priority: value.priority,
        includeInsights: value.includeInsights,
        includeRecommendations: value.includeRecommendations
      },
      auditContext
    );

    res.json({
      success: true,
      data: deliveryResult,
      message: 'Report delivery initiated successfully'
    });
  } catch (error) {
    console.error('Error delivering report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deliver report'
    });
  }
});

/**
 * POST /api/reports/schedule
 * Schedule a report for automatic generation
 */
router.post('/schedule', authenticate, async (req, res) => {
  try {
    const scheduleSchema = Joi.object({
      reportId: Joi.string().required(),
      frequency: Joi.string().valid('daily', 'weekly', 'monthly').required(),
      recipients: Joi.array().items(Joi.string().email()).min(1).required(),
      time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
      timezone: Joi.string().default('UTC'),
      enabled: Joi.boolean().default(true)
    });

    const { error, value } = scheduleSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const scheduledReport = await reportingService.scheduleReportDelivery(
      value.reportId,
      value
    );

    res.status(201).json({
      success: true,
      data: scheduledReport,
      message: 'Report delivery scheduled successfully'
    });
  } catch (error) {
    console.error('Error scheduling report delivery:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to schedule report delivery'
    });
  }
});

/**
 * GET /api/reports/:id/audit
 * Get audit trail for a specific report
 */
router.get('/:id/audit', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { actions, startDate, endDate, limit = 50, offset = 0 } = req.query;

    // Verify report access
    const report = await GeneratedReport.findOne({
      where: {
        id,
        [Op.or]: [
          { isPublic: true },
          { createdBy: userId }
        ]
      }
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found or access denied'
      });
    }

    const auditTrail = await auditService.getReportAuditTrail(id, {
      actions: actions ? actions.split(',') : [],
      startDate,
      endDate,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: auditTrail
    });
  } catch (error) {
    console.error('Error fetching audit trail:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit trail'
    });
  }
});

/**
 * GET /api/reports/:id/versions
 * Get version history for a specific report
 */
router.get('/:id/versions', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { limit = 10, offset = 0 } = req.query;

    // Verify report access
    const report = await GeneratedReport.findOne({
      where: {
        id,
        [Op.or]: [
          { isPublic: true },
          { createdBy: userId }
        ]
      }
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found or access denied'
      });
    }

    const versions = await auditService.getReportVersions(id, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: versions
    });
  } catch (error) {
    console.error('Error fetching report versions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch report versions'
    });
  }
});

/**
 * GET /api/reports/audit/compliance
 * Generate compliance report
 */
router.get('/audit/compliance', authenticate, authorize(['admin', 'manager']), async (req, res) => {
  try {
    const { startDate, endDate, reportType = 'summary' } = req.query;

    const complianceReport = await auditService.generateComplianceReport({
      startDate,
      endDate,
      reportType
    });

    res.json({
      success: true,
      data: complianceReport
    });
  } catch (error) {
    console.error('Error generating compliance report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate compliance report'
    });
  }
});

/**
 * POST /api/reports/audit/cleanup
 * Clean up expired audit logs (admin only)
 */
router.post('/audit/cleanup', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const cleanupResult = await auditService.cleanupExpiredAuditLogs();

    res.json({
      success: true,
      data: cleanupResult,
      message: `Cleaned up ${cleanupResult.deletedCount} expired audit logs`
    });
  } catch (error) {
    console.error('Error during audit cleanup:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup audit logs'
    });
  }
});

/**
 * POST /api/reports/:id/compliance-check
 * Run compliance check on a specific report
 */
router.post('/:id/compliance-check', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify report access
    const report = await GeneratedReport.findOne({
      where: {
        id,
        [Op.or]: [
          { isPublic: true },
          { createdBy: userId }
        ]
      }
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found or access denied'
      });
    }

    // Parse report content for compliance check
    const reportContent = {
      ...JSON.parse(report.data || '{}'),
      metadata: JSON.parse(report.metadata || '{}')
    };

    const complianceResult = await auditService.runComplianceChecks(reportContent, 'compliance_check');

    // Log compliance check
    await auditService.logReportEvent({
      reportId: id,
      userId,
      action: 'compliance_check',
      resourceType: 'report',
      resourceId: id,
      details: {
        complianceStatus: complianceResult.status,
        issuesFound: complianceResult.issues.length,
        checkType: 'manual'
      },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      data: {
        reportId: id,
        complianceStatus: complianceResult.status,
        issues: complianceResult.issues,
        checkedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error running compliance check:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run compliance check'
    });
  }
});

module.exports = router;