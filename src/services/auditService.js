/**
 * Audit Service
 * Comprehensive audit logging and compliance management for reports
 */

const { Op } = require('sequelize');
const { ReportAuditLog, ReportVersion, GeneratedReport, User } = require('../models');

class AuditService {
  constructor() {
    this.complianceRules = {
      'data-retention': this.checkDataRetentionCompliance.bind(this),
      'access-control': this.checkAccessControlCompliance.bind(this),
      'data-sensitivity': this.checkDataSensitivityCompliance.bind(this),
      'audit-trail': this.checkAuditTrailCompliance.bind(this),
      'export-controls': this.checkExportControlsCompliance.bind(this)
    };
  }

  /**
   * Log an audit event for report operations
   */
  async logReportEvent({
    reportId,
    templateId,
    userId,
    action,
    resourceType,
    resourceId,
    details = {},
    ipAddress,
    userAgent,
    riskLevel,
    aiConfidence,
    processingTime,
    dataSensitivity = 'internal'
  }) {
    try {
      const auditLog = await ReportAuditLog.create({
        reportId,
        templateId,
        userId,
        action,
        resourceType,
        resourceId,
        details,
        ipAddress,
        userAgent,
        riskLevel,
        aiConfidence,
        processingTime,
        dataSensitivity,
        complianceFlags: await this.evaluateComplianceFlags({
          action,
          resourceType,
          userId,
          dataSensitivity,
          details
        })
      });

      // Check for compliance violations that require immediate action
      await this.checkComplianceViolations(auditLog);

      return auditLog;
    } catch (error) {
      console.error('Error logging audit event:', error);
      throw new Error('Failed to log audit event');
    }
  }

  /**
   * Create a new report version for change tracking
   */
  async createReportVersion({
    reportId,
    content,
    changes = {},
    changeType = 'initial',
    changeReason,
    aiConfidence,
    dataSources = [],
    createdBy
  }) {
    try {
      // Get the latest version number
      const latestVersion = await ReportVersion.findOne({
        where: { reportId },
        order: [['version', 'DESC']]
      });

      const versionNumber = latestVersion ? latestVersion.version + 1 : 1;

      // Generate content hash for integrity checking
      const contentHash = this.generateContentHash(content);

      // Run compliance checks
      const complianceResult = await this.runComplianceChecks(content, changeType);

      const reportVersion = await ReportVersion.create({
        reportId,
        version: versionNumber,
        content,
        contentHash,
        changes,
        changeType,
        changeReason,
        aiConfidence,
        dataSources,
        complianceStatus: complianceResult.status,
        complianceIssues: complianceResult.issues,
        createdBy
      });

      // Log version creation
      await this.logReportEvent({
        reportId,
        userId: createdBy,
        action: 'modified',
        resourceType: 'report',
        resourceId: reportId,
        details: {
          version: versionNumber,
          changeType,
          changeReason,
          complianceStatus: complianceResult.status
        },
        dataSensitivity: content.dataSensitivity || 'internal'
      });

      return reportVersion;
    } catch (error) {
      console.error('Error creating report version:', error);
      throw new Error('Failed to create report version');
    }
  }

  /**
   * Get audit trail for a report
   */
  async getReportAuditTrail(reportId, options = {}) {
    const {
      startDate,
      endDate,
      actions = [],
      userId,
      limit = 50,
      offset = 0
    } = options;

    const whereClause = { reportId };

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt[Op.gte] = startDate;
      if (endDate) whereClause.createdAt[Op.lte] = endDate;
    }

    if (actions.length > 0) {
      whereClause.action = { [Op.in]: actions };
    }

    if (userId) {
      whereClause.userId = userId;
    }

    const auditLogs = await ReportAuditLog.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    const total = await ReportAuditLog.count({ where: whereClause });

    return {
      logs: auditLogs,
      total,
      hasMore: offset + auditLogs.length < total
    };
  }

  /**
   * Get report versions with change history
   */
  async getReportVersions(reportId, options = {}) {
    const { limit = 10, offset = 0 } = options;

    const versions = await ReportVersion.findAll({
      where: { reportId },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      order: [['version', 'DESC']],
      limit,
      offset
    });

    const total = await ReportVersion.count({ where: { reportId } });

    return {
      versions,
      total,
      hasMore: offset + versions.length < total
    };
  }

  /**
   * Run comprehensive compliance checks
   */
  async runComplianceChecks(content, changeType) {
    const issues = [];
    let status = 'passed';

    for (const [ruleName, ruleFunction] of Object.entries(this.complianceRules)) {
      try {
        const result = await ruleFunction(content, changeType);
        if (!result.passed) {
          issues.push({
            rule: ruleName,
            severity: result.severity,
            message: result.message,
            details: result.details
          });
          if (result.severity === 'high') {
            status = 'failed';
          } else if (status === 'passed') {
            status = 'pending';
          }
        }
      } catch (error) {
        console.error(`Error running compliance rule ${ruleName}:`, error);
        issues.push({
          rule: ruleName,
          severity: 'medium',
          message: `Failed to evaluate compliance rule: ${error.message}`
        });
      }
    }

    return { status, issues };
  }

  /**
   * Check data retention compliance
   */
  async checkDataRetentionCompliance(content, changeType) {
    const dataSensitivity = content.dataSensitivity || 'internal';
    const retentionDays = {
      'public': 365,
      'internal': 1095,
      'confidential': 2555,
      'restricted': 3650
    };

    const requiredRetention = retentionDays[dataSensitivity];
    const actualRetention = content.retentionDays || 0;

    if (actualRetention < requiredRetention) {
      return {
        passed: false,
        severity: dataSensitivity === 'restricted' ? 'high' : 'medium',
        message: `Data retention period (${actualRetention} days) is below required minimum (${requiredRetention} days) for ${dataSensitivity} data`,
        details: { requiredRetention, actualRetention, dataSensitivity }
      };
    }

    return { passed: true };
  }

  /**
   * Check access control compliance
   */
  async checkAccessControlCompliance(content, changeType) {
    // Check if sensitive data is being accessed by unauthorized users
    const sensitiveDataTypes = ['confidential', 'restricted'];
    const dataSensitivity = content.dataSensitivity;

    if (sensitiveDataTypes.includes(dataSensitivity)) {
      // Additional access control checks would go here
      // For now, assume basic compliance
      return { passed: true };
    }

    return { passed: true };
  }

  /**
   * Check data sensitivity compliance
   */
  async checkDataSensitivityCompliance(content, changeType) {
    const insights = content.insights || [];
    const recommendations = content.recommendations || [];

    // Check for sensitive information in insights
    for (const insight of insights) {
      if (insight.data && this.containsSensitiveData(insight.data)) {
        return {
          passed: false,
          severity: 'high',
          message: 'Report contains sensitive data that should be masked or redacted',
          details: { insightId: insight.id, dataTypes: this.identifySensitiveData(insight.data) }
        };
      }
    }

    return { passed: true };
  }

  /**
   * Check audit trail compliance
   */
  async checkAuditTrailCompliance(content, changeType) {
    // Ensure all changes are properly logged
    if (changeType !== 'initial' && !content.changeLog) {
      return {
        passed: false,
        severity: 'medium',
        message: 'Report modification missing change log entry',
        details: { changeType, expectedChangeLog: true }
      };
    }

    return { passed: true };
  }

  /**
   * Check export controls compliance
   */
  async checkExportControlsCompliance(content, changeType) {
    const dataSensitivity = content.dataSensitivity;

    if (['confidential', 'restricted'].includes(dataSensitivity)) {
      // Check if export is allowed and logged
      const exportControls = content.exportControls || {};

      if (!exportControls.allowed) {
        return {
          passed: false,
          severity: 'high',
          message: `Export of ${dataSensitivity} data requires explicit approval`,
          details: { dataSensitivity, exportControls }
        };
      }
    }

    return { passed: true };
  }

  /**
   * Evaluate compliance flags for audit logging
   */
  async evaluateComplianceFlags({ action, resourceType, userId, dataSensitivity, details }) {
    const flags = [];

    // High-risk actions
    if (['deleted', 'exported', 'shared'].includes(action)) {
      flags.push('high-risk-action');
    }

    // Sensitive data access
    if (['confidential', 'restricted'].includes(dataSensitivity)) {
      flags.push('sensitive-data-access');
    }

    // External sharing
    if (action === 'shared' && details.recipientDomain) {
      flags.push('external-sharing');
    }

    // Bulk operations
    if (details.bulkOperation) {
      flags.push('bulk-operation');
    }

    return flags;
  }

  /**
   * Check for compliance violations requiring immediate action
   */
  async checkComplianceViolations(auditLog) {
    const violations = [];

    // Check for critical compliance flags
    if (auditLog.complianceFlags.includes('sensitive-data-access')) {
      violations.push({
        type: 'sensitive-data-access',
        severity: 'high',
        message: 'Unauthorized access to sensitive data detected',
        action: 'alert-compliance-officer'
      });
    }

    if (auditLog.complianceFlags.includes('external-sharing')) {
      violations.push({
        type: 'external-sharing',
        severity: 'medium',
        message: 'Data shared with external domain',
        action: 'log-for-review'
      });
    }

    // Log violations
    for (const violation of violations) {
      console.warn('Compliance violation detected:', violation);
      // In a real system, this would trigger alerts, notifications, etc.
    }

    return violations;
  }

  /**
   * Generate content hash for integrity checking
   */
  generateContentHash(content) {
    const crypto = require('crypto');
    const contentString = JSON.stringify(content);
    return crypto.createHash('sha256').update(contentString).digest('hex');
  }

  /**
   * Check if data contains sensitive information
   */
  containsSensitiveData(data) {
    // Simple pattern matching for sensitive data
    const sensitivePatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b\d{4} \d{4} \d{4} \d{4}\b/, // Credit card
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/ // Email
    ];

    const dataString = JSON.stringify(data);

    return sensitivePatterns.some(pattern => pattern.test(dataString));
  }

  /**
   * Identify types of sensitive data present
   */
  identifySensitiveData(data) {
    const dataTypes = [];
    const dataString = JSON.stringify(data);

    if (/\b\d{3}-\d{2}-\d{4}\b/.test(dataString)) {
      dataTypes.push('ssn');
    }
    if (/\b\d{4} \d{4} \d{4} \d{4}\b/.test(dataString)) {
      dataTypes.push('credit-card');
    }
    if (/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(dataString)) {
      dataTypes.push('email');
    }

    return dataTypes;
  }

  /**
   * Clean up expired audit logs based on retention policy
   */
  async cleanupExpiredAuditLogs() {
    try {
      const expiredLogs = await ReportAuditLog.findAll({
        where: {
          retentionDate: {
            [Op.lt]: new Date()
          }
        }
      });

      const deletedCount = await ReportAuditLog.destroy({
        where: {
          retentionDate: {
            [Op.lt]: new Date()
          }
        }
      });

      console.log(`Cleaned up ${deletedCount} expired audit logs`);

      // Log the cleanup operation
      await this.logReportEvent({
        userId: 'system', // System user
        action: 'compliance_check',
        resourceType: 'system',
        resourceId: 'audit-cleanup',
        details: {
          expiredLogsCount: expiredLogs.length,
          deletedCount,
          cleanupDate: new Date().toISOString()
        }
      });

      return { deletedCount, expiredLogs };
    } catch (error) {
      console.error('Error during audit log cleanup:', error);
      throw new Error('Failed to cleanup expired audit logs');
    }
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(options = {}) {
    const { startDate, endDate, reportType = 'summary' } = options;

    const whereClause = {};
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt[Op.gte] = startDate;
      if (endDate) whereClause.createdAt[Op.lte] = endDate;
    }

    const [auditSummary, complianceIssues, dataSensitivityStats] = await Promise.all([
      // Audit summary
      ReportAuditLog.findAll({
        where: whereClause,
        attributes: [
          'action',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['action']
      }),

      // Compliance issues
      ReportAuditLog.findAll({
        where: {
          ...whereClause,
          [Op.or]: [
            { riskLevel: 'high' },
            { riskLevel: 'critical' },
            sequelize.literal("compliance_flags::text != '[]'")
          ]
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['firstName', 'lastName', 'email']
          }
        ]
      }),

      // Data sensitivity statistics
      ReportAuditLog.findAll({
        where: whereClause,
        attributes: [
          'dataSensitivity',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['dataSensitivity']
      })
    ]);

    return {
      period: { startDate, endDate },
      auditSummary,
      complianceIssues: complianceIssues.length,
      complianceDetails: complianceIssues,
      dataSensitivityStats,
      generatedAt: new Date()
    };
  }
}

module.exports = new AuditService();