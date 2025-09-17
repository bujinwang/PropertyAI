const ReportAuditLog = require('../models/ReportAuditLog');
const ReportVersion = require('../models/ReportVersion');
const ComplianceCheck = require('../models/ComplianceCheck');
const GeneratedReport = require('../models/GeneratedReport');
const ScheduledReport = require('../models/ScheduledReport');
const auditService = require('./auditService');

class DataRetentionService {
  constructor() {
    // Retention periods in days
    this.retentionPolicies = {
      auditLogs: {
        public: 365,      // 1 year
        internal: 1095,   // 3 years
        confidential: 2555, // 7 years
        restricted: 3650  // 10 years
      },
      reportVersions: {
        public: 365,
        internal: 730,    // 2 years
        confidential: 1095,
        restricted: 1825  // 5 years
      },
      complianceChecks: {
        public: 1095,
        internal: 1825,
        confidential: 2555,
        restricted: 3650
      },
      generatedReports: {
        public: 730,
        internal: 1095,
        confidential: 1825,
        restricted: 2555
      },
      scheduledReports: {
        public: 365,
        internal: 730,
        confidential: 1095,
        restricted: 1825
      }
    };
  }

  // Clean up expired audit logs
  async cleanupAuditLogs() {
    try {
      const now = new Date();
      let totalDeleted = 0;

      for (const [sensitivity, days] of Object.entries(this.retentionPolicies.auditLogs)) {
        const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        const deleted = await ReportAuditLog.destroy({
          where: {
            dataSensitivity: sensitivity,
            createdAt: {
              [require('sequelize').Op.lt]: cutoffDate
            }
          }
        });

        totalDeleted += deleted;
        if (deleted > 0) {
          console.log(`Cleaned up ${deleted} ${sensitivity} audit logs older than ${days} days`);
        }
      }

      return totalDeleted;
    } catch (error) {
      console.error('Audit log cleanup failed:', error);
      throw error;
    }
  }

  // Clean up old report versions (keep only recent versions)
  async cleanupReportVersions() {
    try {
      let totalDeleted = 0;

      // For each report, keep only the most recent versions
      const reports = await GeneratedReport.findAll({
        attributes: ['id']
      });

      for (const report of reports) {
        const versions = await ReportVersion.findAll({
          where: { reportId: report.id },
          order: [['createdAt', 'DESC']]
        });

        if (versions.length > 5) { // Keep only 5 most recent versions
          const versionsToDelete = versions.slice(5);
          const deleted = await ReportVersion.destroy({
            where: {
              id: versionsToDelete.map(v => v.id)
            }
          });

          totalDeleted += deleted;
          if (deleted > 0) {
            console.log(`Cleaned up ${deleted} old versions for report ${report.id}`);
          }
        }

        // Also clean up by retention policy
        const cutoffDate = new Date(Date.now() - this.retentionPolicies.reportVersions.internal * 24 * 60 * 60 * 1000);
        const expiredVersions = await ReportVersion.destroy({
          where: {
            reportId: report.id,
            createdAt: {
              [require('sequelize').Op.lt]: cutoffDate
            }
          }
        });

        totalDeleted += expiredVersions;
      }

      return totalDeleted;
    } catch (error) {
      console.error('Report version cleanup failed:', error);
      throw error;
    }
  }

  // Clean up old compliance checks
  async cleanupComplianceChecks() {
    try {
      const now = new Date();
      let totalDeleted = 0;

      for (const [sensitivity, days] of Object.entries(this.retentionPolicies.complianceChecks)) {
        const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        const deleted = await ComplianceCheck.destroy({
          where: {
            dataClassification: sensitivity,
            createdAt: {
              [require('sequelize').Op.lt]: cutoffDate
            }
          }
        });

        totalDeleted += deleted;
        if (deleted > 0) {
          console.log(`Cleaned up ${deleted} ${sensitivity} compliance checks older than ${days} days`);
        }
      }

      return totalDeleted;
    } catch (error) {
      console.error('Compliance check cleanup failed:', error);
      throw error;
    }
  }

  // Clean up old generated reports
  async cleanupGeneratedReports() {
    try {
      const now = new Date();
      let totalDeleted = 0;

      for (const [sensitivity, days] of Object.entries(this.retentionPolicies.generatedReports)) {
        const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        // Find reports that are old and not referenced by recent audit logs
        const oldReports = await GeneratedReport.findAll({
          where: {
            createdAt: {
              [require('sequelize').Op.lt]: cutoffDate
            }
          },
          include: [{
            model: require('../models/ReportTemplate'),
            as: 'template',
            where: { dataSensitivity: sensitivity }
          }]
        });

        for (const report of oldReports) {
          // Check if report has recent audit activity
          const recentActivity = await ReportAuditLog.findOne({
            where: {
              reportId: report.id,
              createdAt: {
                [require('sequelize').Op.gte]: cutoffDate
              }
            }
          });

          if (!recentActivity) {
            await report.destroy();
            totalDeleted++;
          }
        }
      }

      if (totalDeleted > 0) {
        console.log(`Cleaned up ${totalDeleted} old generated reports`);
      }

      return totalDeleted;
    } catch (error) {
      console.error('Generated report cleanup failed:', error);
      throw error;
    }
  }

  // Clean up inactive scheduled reports
  async cleanupScheduledReports() {
    try {
      const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days

      const deleted = await ScheduledReport.destroy({
        where: {
          isActive: false,
          updatedAt: {
            [require('sequelize').Op.lt]: cutoffDate
          }
        }
      });

      if (deleted > 0) {
        console.log(`Cleaned up ${deleted} inactive scheduled reports older than 90 days`);
      }

      return deleted;
    } catch (error) {
      console.error('Scheduled report cleanup failed:', error);
      throw error;
    }
  }

  // Run all cleanup operations
  async runFullCleanup() {
    try {
      console.log('Starting data retention cleanup...');

      const results = {
        auditLogs: await this.cleanupAuditLogs(),
        reportVersions: await this.cleanupReportVersions(),
        complianceChecks: await this.cleanupComplianceChecks(),
        generatedReports: await this.cleanupGeneratedReports(),
        scheduledReports: await this.cleanupScheduledReports()
      };

      const totalDeleted = Object.values(results).reduce((sum, count) => sum + count, 0);

      console.log(`Data retention cleanup completed. Total records deleted: ${totalDeleted}`);

      // Log cleanup operation
      await auditService.logEvent({
        userId: null, // System operation
        action: 'compliance_check',
        resourceType: 'system',
        resourceId: 'data-retention-cleanup',
        details: {
          cleanupResults: results,
          totalDeleted
        },
        riskLevel: 'low'
      });

      return results;
    } catch (error) {
      console.error('Full cleanup failed:', error);
      throw error;
    }
  }

  // Get retention policy for a data type and sensitivity
  getRetentionPolicy(dataType, sensitivity) {
    return this.retentionPolicies[dataType]?.[sensitivity] || 365; // Default 1 year
  }

  // Update retention policy (admin function)
  updateRetentionPolicy(dataType, sensitivity, days) {
    if (this.retentionPolicies[dataType]) {
      this.retentionPolicies[dataType][sensitivity] = days;
      console.log(`Updated retention policy: ${dataType}.${sensitivity} = ${days} days`);
      return true;
    }
    return false;
  }

  // Get cleanup statistics
  async getCleanupStatistics() {
    try {
      const stats = {
        auditLogs: {
          total: await ReportAuditLog.count(),
          expired: await ReportAuditLog.count({
            where: {
              retentionDate: {
                [require('sequelize').Op.lt]: new Date()
              }
            }
          })
        },
        reportVersions: {
          total: await ReportVersion.count()
        },
        complianceChecks: {
          total: await ComplianceCheck.count()
        },
        generatedReports: {
          total: await GeneratedReport.count()
        },
        scheduledReports: {
          total: await ScheduledReport.count(),
          inactive: await ScheduledReport.count({
            where: { isActive: false }
          })
        }
      };

      return stats;
    } catch (error) {
      console.error('Cleanup statistics retrieval failed:', error);
      throw error;
    }
  }
}

module.exports = new DataRetentionService();