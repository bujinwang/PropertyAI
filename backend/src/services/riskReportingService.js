const fs = require('fs').promises;
const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

class RiskReportingService {
  constructor() {
    this.REPORT_TYPES = {
      portfolio_summary: 'Portfolio Risk Summary',
      property_detail: 'Property Risk Detail',
      tenant_detail: 'Tenant Risk Detail',
      compliance_audit: 'Compliance Audit Report',
      mitigation_tracking: 'Mitigation Tracking Report',
      trend_analysis: 'Risk Trend Analysis',
      alert_summary: 'Alert Summary Report'
    };

    this.EXPORT_FORMATS = {
      pdf: 'PDF',
      csv: 'CSV',
      excel: 'Excel',
      json: 'JSON'
    };
  }

  /**
   * Generate portfolio risk summary report
   * @param {Object} options - Report options
   * @returns {Promise<Object>} Report data
   */
  async generatePortfolioSummaryReport(options = {}) {
    try {
      const {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        endDate = new Date(),
        includeTrends = true,
        includeMitigation = true
      } = options;

      // In a real implementation, these would be database queries
      const portfolioData = await this.getPortfolioRiskData(startDate, endDate);
      const propertyRisks = await this.getPropertyRisksSummary(startDate, endDate);
      const tenantRisks = await this.getTenantRisksSummary(startDate, endDate);
      const alerts = await this.getAlertSummary(startDate, endDate);

      let trends = null;
      if (includeTrends) {
        trends = await this.calculateRiskTrends(portfolioData, startDate, endDate);
      }

      let mitigation = null;
      if (includeMitigation) {
        mitigation = await this.getMitigationSummary();
      }

      const report = {
        reportType: 'portfolio_summary',
        generatedAt: new Date().toISOString(),
        period: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        },
        summary: {
          totalProperties: propertyRisks.length,
          totalTenants: tenantRisks.length,
          portfolioRiskScore: portfolioData.overallScore,
          riskLevel: portfolioData.riskLevel,
          criticalAlerts: alerts.critical,
          highAlerts: alerts.high,
          activeMitigations: mitigation?.activeCount || 0
        },
        riskDistribution: this.calculateRiskDistribution(propertyRisks, tenantRisks),
        topRisks: this.identifyTopRisks(propertyRisks, tenantRisks),
        alerts: alerts,
        trends: trends,
        mitigation: mitigation,
        recommendations: this.generateRecommendations(portfolioData, alerts, trends)
      };

      return report;

    } catch (error) {
      console.error('Error generating portfolio summary report:', error);
      throw new Error(`Portfolio summary report generation failed: ${error.message}`);
    }
  }

  /**
   * Generate detailed property risk report
   * @param {string} propertyId - Property ID
   * @param {Object} options - Report options
   * @returns {Promise<Object>} Report data
   */
  async generatePropertyDetailReport(propertyId, options = {}) {
    try {
      const {
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
        endDate = new Date(),
        includeHistory = true
      } = options;

      // Get property data
      const property = await this.getPropertyData(propertyId);
      const riskAssessments = await this.getPropertyRiskAssessments(propertyId, startDate, endDate);
      const alerts = await this.getPropertyAlerts(propertyId, startDate, endDate);
      const maintenanceHistory = await this.getPropertyMaintenanceHistory(propertyId, startDate, endDate);

      const report = {
        reportType: 'property_detail',
        propertyId: propertyId,
        propertyName: property.name,
        generatedAt: new Date().toISOString(),
        period: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        },
        property: {
          name: property.name,
          address: property.address,
          type: property.propertyType,
          yearBuilt: property.yearBuilt,
          totalUnits: property.totalUnits
        },
        currentRisk: riskAssessments.length > 0 ? riskAssessments[0] : null,
        riskHistory: includeHistory ? riskAssessments : [],
        alerts: alerts,
        maintenanceHistory: maintenanceHistory,
        riskAnalysis: this.analyzePropertyRiskTrends(riskAssessments),
        recommendations: this.generatePropertyRecommendations(property, riskAssessments, alerts)
      };

      return report;

    } catch (error) {
      console.error('Error generating property detail report:', error);
      throw new Error(`Property detail report generation failed: ${error.message}`);
    }
  }

  /**
   * Generate detailed tenant risk report
   * @param {string} tenantId - Tenant ID
   * @param {Object} options - Report options
   * @returns {Promise<Object>} Report data
   */
  async generateTenantDetailReport(tenantId, options = {}) {
    try {
      const {
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        endDate = new Date(),
        includeHistory = true
      } = options;

      // Get tenant data
      const tenant = await this.getTenantData(tenantId);
      const riskAssessments = await this.getTenantRiskAssessments(tenantId, startDate, endDate);
      const alerts = await this.getTenantAlerts(tenantId, startDate, endDate);
      const paymentHistory = await this.getTenantPaymentHistory(tenantId, startDate, endDate);

      const report = {
        reportType: 'tenant_detail',
        tenantId: tenantId,
        tenantName: tenant.name,
        generatedAt: new Date().toISOString(),
        period: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        },
        tenant: {
          name: tenant.name,
          email: tenant.email,
          leaseStart: tenant.leaseStart,
          leaseEnd: tenant.leaseEnd,
          monthlyRent: tenant.monthlyRent
        },
        currentRisk: riskAssessments.length > 0 ? riskAssessments[0] : null,
        riskHistory: includeHistory ? riskAssessments : [],
        alerts: alerts,
        paymentHistory: paymentHistory,
        riskAnalysis: this.analyzeTenantRiskTrends(riskAssessments),
        recommendations: this.generateTenantRecommendations(tenant, riskAssessments, alerts)
      };

      return report;

    } catch (error) {
      console.error('Error generating tenant detail report:', error);
      throw new Error(`Tenant detail report generation failed: ${error.message}`);
    }
  }

  /**
   * Generate compliance audit report
   * @param {Object} options - Report options
   * @returns {Promise<Object>} Report data
   */
  async generateComplianceAuditReport(options = {}) {
    try {
      const {
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
        endDate = new Date(),
        includeRemediation = true
      } = options;

      const complianceData = await this.getComplianceData(startDate, endDate);
      const violations = await this.getComplianceViolations(startDate, endDate);
      const audits = await this.getComplianceAudits(startDate, endDate);

      const report = {
        reportType: 'compliance_audit',
        generatedAt: new Date().toISOString(),
        period: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        },
        summary: {
          totalAudits: audits.length,
          totalViolations: violations.length,
          complianceRate: this.calculateComplianceRate(audits, violations),
          criticalViolations: violations.filter(v => v.severity === 'critical').length
        },
        complianceData: complianceData,
        violations: violations,
        audits: audits,
        remediation: includeRemediation ? await this.getRemediationPlans(violations) : null,
        recommendations: this.generateComplianceRecommendations(violations, audits)
      };

      return report;

    } catch (error) {
      console.error('Error generating compliance audit report:', error);
      throw new Error(`Compliance audit report generation failed: ${error.message}`);
    }
  }

  /**
   * Export report to specified format
   * @param {Object} reportData - Report data
   * @param {string} format - Export format (pdf, csv, excel, json)
   * @param {Object} options - Export options
   * @returns {Promise<Object>} Export result
   */
  async exportReport(reportData, format, options = {}) {
    try {
      const {
        fileName = `risk_report_${Date.now()}`,
        outputPath = './exports'
      } = options;

      // Ensure output directory exists
      await fs.mkdir(outputPath, { recursive: true });

      let filePath;
      let buffer;

      switch (format.toLowerCase()) {
        case 'pdf':
          ({ filePath, buffer } = await this.exportToPDF(reportData, fileName, outputPath));
          break;
        case 'csv':
          ({ filePath, buffer } = await this.exportToCSV(reportData, fileName, outputPath));
          break;
        case 'excel':
          ({ filePath, buffer } = await this.exportToExcel(reportData, fileName, outputPath));
          break;
        case 'json':
          ({ filePath, buffer } = await this.exportToJSON(reportData, fileName, outputPath));
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      return {
        success: true,
        format: format,
        fileName: `${fileName}.${format.toLowerCase()}`,
        filePath: filePath,
        size: buffer.length,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error exporting report:', error);
      throw new Error(`Report export failed: ${error.message}`);
    }
  }

  /**
   * Export report to PDF
   * @param {Object} reportData - Report data
   * @param {string} fileName - File name
   * @param {string} outputPath - Output path
   * @returns {Promise<Object>} Export result
   */
  async exportToPDF(reportData, fileName, outputPath) {
    const filePath = path.join(outputPath, `${fileName}.pdf`);
    const doc = new PDFDocument();

    return new Promise((resolve, reject) => {
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const buffer = Buffer.concat(buffers);
        resolve({ filePath, buffer });
      });
      doc.on('error', reject);

      // Generate PDF content
      this.generatePDFContent(doc, reportData);

      doc.end();
    });
  }

  /**
   * Generate PDF content
   * @param {Object} doc - PDF document
   * @param {Object} reportData - Report data
   */
  generatePDFContent(doc, reportData) {
    // Header
    doc.fontSize(20).text('Risk Assessment Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Report Type: ${this.REPORT_TYPES[reportData.reportType]}`);
    doc.text(`Generated: ${new Date(reportData.generatedAt).toLocaleString()}`);
    doc.moveDown();

    // Summary section
    if (reportData.summary) {
      doc.fontSize(16).text('Executive Summary');
      doc.moveDown();
      doc.fontSize(10);

      Object.entries(reportData.summary).forEach(([key, value]) => {
        doc.text(`${this.formatKey(key)}: ${value}`);
      });
      doc.moveDown();
    }

    // Risk distribution
    if (reportData.riskDistribution) {
      doc.fontSize(14).text('Risk Distribution');
      doc.moveDown();
      doc.fontSize(10);

      Object.entries(reportData.riskDistribution).forEach(([level, count]) => {
        doc.text(`${level.charAt(0).toUpperCase() + level.slice(1)}: ${count}`);
      });
      doc.moveDown();
    }

    // Top risks
    if (reportData.topRisks) {
      doc.fontSize(14).text('Top Risks');
      doc.moveDown();
      doc.fontSize(10);

      reportData.topRisks.forEach((risk, index) => {
        doc.text(`${index + 1}. ${risk.entityName} (${risk.riskLevel}): ${risk.description}`);
      });
      doc.moveDown();
    }

    // Recommendations
    if (reportData.recommendations) {
      doc.fontSize(14).text('Recommendations');
      doc.moveDown();
      doc.fontSize(10);

      reportData.recommendations.forEach((rec, index) => {
        doc.text(`${index + 1}. ${rec}`);
      });
    }
  }

  /**
   * Export report to CSV
   * @param {Object} reportData - Report data
   * @param {string} fileName - File name
   * @param {string} outputPath - Output path
   * @returns {Promise<Object>} Export result
   */
  async exportToCSV(reportData, fileName, outputPath) {
    const filePath = path.join(outputPath, `${fileName}.csv`);

    // Flatten report data for CSV
    const csvData = this.flattenReportDataForCSV(reportData);

    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: Object.keys(csvData[0] || {}).map(key => ({ id: key, title: this.formatKey(key) }))
    });

    await csvWriter.writeRecords(csvData);

    const buffer = await fs.readFile(filePath);
    return { filePath, buffer };
  }

  /**
   * Export report to Excel
   * @param {Object} reportData - Report data
   * @param {string} fileName - File name
   * @param {string} outputPath - Output path
   * @returns {Promise<Object>} Export result
   */
  async exportToExcel(reportData, fileName, outputPath) {
    const filePath = path.join(outputPath, `${fileName}.xlsx`);
    const workbook = new ExcelJS.Workbook();

    // Summary sheet
    const summarySheet = workbook.addWorksheet('Summary');
    this.populateSummarySheet(summarySheet, reportData);

    // Details sheet
    const detailsSheet = workbook.addWorksheet('Details');
    this.populateDetailsSheet(detailsSheet, reportData);

    // Charts sheet if applicable
    if (reportData.trends) {
      const trendsSheet = workbook.addWorksheet('Trends');
      this.populateTrendsSheet(trendsSheet, reportData.trends);
    }

    await workbook.xlsx.writeFile(filePath);
    const buffer = await fs.readFile(filePath);
    return { filePath, buffer };
  }

  /**
   * Export report to JSON
   * @param {Object} reportData - Report data
   * @param {string} fileName - File name
   * @param {string} outputPath - Output path
   * @returns {Promise<Object>} Export result
   */
  async exportToJSON(reportData, fileName, outputPath) {
    const filePath = path.join(outputPath, `${fileName}.json`);
    const jsonData = JSON.stringify(reportData, null, 2);

    await fs.writeFile(filePath, jsonData);
    const buffer = Buffer.from(jsonData);

    return { filePath, buffer };
  }

  /**
   * Schedule automated report generation
   * @param {Object} scheduleConfig - Schedule configuration
   * @returns {Promise<Object>} Schedule result
   */
  async scheduleReport(scheduleConfig) {
    const {
      reportType,
      frequency, // daily, weekly, monthly
      recipients,
      format = 'pdf',
      options = {}
    } = scheduleConfig;

    // In a real implementation, this would integrate with a job scheduler
    // For now, we'll just return a mock schedule ID
    const scheduleId = `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log(`Scheduled ${reportType} report:`, {
      scheduleId,
      frequency,
      recipients,
      format,
      nextRun: this.calculateNextRun(frequency)
    });

    return {
      scheduleId,
      reportType,
      frequency,
      recipients,
      format,
      options,
      nextRun: this.calculateNextRun(frequency),
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Get scheduled reports
   * @returns {Promise<Array>} Scheduled reports
   */
  async getScheduledReports() {
    // In a real implementation, this would query the database
    // For now, return mock data
    return [
      {
        scheduleId: 'schedule_001',
        reportType: 'portfolio_summary',
        frequency: 'weekly',
        recipients: ['manager@company.com'],
        format: 'pdf',
        nextRun: '2025-09-21T09:00:00Z',
        lastRun: '2025-09-14T09:00:00Z'
      }
    ];
  }

  /**
   * Generate bulk reports for multiple entities
   * @param {Array} entityIds - Entity IDs
   * @param {string} entityType - Entity type
   * @param {Object} options - Report options
   * @returns {Promise<Array>} Generated reports
   */
  async generateBulkReports(entityIds, entityType, options = {}) {
    const reports = [];

    for (const entityId of entityIds) {
      try {
        let report;
        if (entityType === 'property') {
          report = await this.generatePropertyDetailReport(entityId, options);
        } else if (entityType === 'tenant') {
          report = await this.generateTenantDetailReport(entityId, options);
        }

        if (report) {
          reports.push(report);
        }
      } catch (error) {
        console.error(`Failed to generate report for ${entityType} ${entityId}:`, error);
        reports.push({
          entityId,
          entityType,
          error: error.message,
          generatedAt: new Date().toISOString()
        });
      }
    }

    return reports;
  }

  // Helper methods for data retrieval (mock implementations)

  async getPortfolioRiskData(startDate, endDate) {
    return {
      overallScore: 2.8,
      riskLevel: 'medium',
      confidence: 0.85
    };
  }

  async getPropertyRisksSummary(startDate, endDate) {
    return [
      { id: 'prop1', name: 'Property A', riskScore: 3.2, riskLevel: 'high' },
      { id: 'prop2', name: 'Property B', riskScore: 1.8, riskLevel: 'low' }
    ];
  }

  async getTenantRisksSummary(startDate, endDate) {
    return [
      { id: 'tenant1', name: 'John Doe', riskScore: 2.5, riskLevel: 'medium' },
      { id: 'tenant2', name: 'Jane Smith', riskScore: 4.1, riskLevel: 'critical' }
    ];
  }

  async getAlertSummary(startDate, endDate) {
    return {
      total: 15,
      critical: 3,
      high: 5,
      medium: 7,
      active: 12,
      resolved: 3
    };
  }

  async calculateRiskTrends(portfolioData, startDate, endDate) {
    return {
      direction: 'increasing',
      changePercent: 8.5,
      averageScore: 2.8,
      volatility: 0.3
    };
  }

  async getMitigationSummary() {
    return {
      activeCount: 8,
      completedCount: 12,
      totalBudget: 45000,
      averageCompletionTime: 15 // days
    };
  }

  calculateRiskDistribution(propertyRisks, tenantRisks) {
    const allRisks = [...propertyRisks, ...tenantRisks];
    const distribution = { critical: 0, high: 0, medium: 0, low: 0, minimal: 0 };

    allRisks.forEach(risk => {
      if (distribution.hasOwnProperty(risk.riskLevel)) {
        distribution[risk.riskLevel]++;
      }
    });

    return distribution;
  }

  identifyTopRisks(propertyRisks, tenantRisks) {
    const allRisks = [...propertyRisks, ...tenantRisks];
    return allRisks
      .filter(risk => risk.riskScore >= 3.0)
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 5)
      .map(risk => ({
        entityName: risk.name,
        riskLevel: risk.riskLevel,
        riskScore: risk.riskScore,
        description: `${risk.name} has a ${risk.riskLevel} risk score of ${risk.riskScore}`
      }));
  }

  generateRecommendations(portfolioData, alerts, trends) {
    const recommendations = [];

    if (alerts.critical > 0) {
      recommendations.push('Address critical alerts immediately - they require urgent attention');
    }

    if (trends && trends.direction === 'increasing') {
      recommendations.push('Risk levels are trending upward - implement additional monitoring');
    }

    if (portfolioData.overallScore >= 3.0) {
      recommendations.push('Overall portfolio risk is high - consider risk mitigation strategies');
    }

    return recommendations;
  }

  // Additional helper methods would be implemented here
  async getPropertyData(propertyId) {
    return { id: propertyId, name: 'Sample Property', address: '123 Main St', propertyType: 'apartment', yearBuilt: 2010, totalUnits: 50 };
  }

  async getTenantData(tenantId) {
    return { id: tenantId, name: 'Sample Tenant', email: 'tenant@example.com', leaseStart: '2024-01-01', leaseEnd: '2025-01-01', monthlyRent: 1500 };
  }

  async getPropertyRiskAssessments(propertyId, startDate, endDate) {
    return [{ overallRiskScore: 2.8, riskLevel: 'medium', assessmentDate: new Date().toISOString() }];
  }

  async getTenantRiskAssessments(tenantId, startDate, endDate) {
    return [{ overallRiskScore: 3.2, riskLevel: 'high', assessmentDate: new Date().toISOString() }];
  }

  async getPropertyAlerts(propertyId, startDate, endDate) {
    return [{ id: 'alert1', title: 'Maintenance Issue', riskScore: 3.5, status: 'active' }];
  }

  async getTenantAlerts(tenantId, startDate, endDate) {
    return [{ id: 'alert2', title: 'Payment Risk', riskScore: 4.1, status: 'active' }];
  }

  async getPropertyMaintenanceHistory(propertyId, startDate, endDate) {
    return [{ date: '2024-08-15', type: 'HVAC Repair', cost: 2500, description: 'AC unit replacement' }];
  }

  async getTenantPaymentHistory(tenantId, startDate, endDate) {
    return [{ date: '2024-09-01', amount: 1500, status: 'paid', daysLate: 0 }];
  }

  analyzePropertyRiskTrends(assessments) {
    return { trend: 'stable', averageRisk: 2.8, volatility: 0.2 };
  }

  analyzeTenantRiskTrends(assessments) {
    return { trend: 'increasing', averageRisk: 3.2, volatility: 0.4 };
  }

  generatePropertyRecommendations(property, assessments, alerts) {
    return ['Schedule regular maintenance inspections', 'Monitor vacancy rates closely', 'Review insurance coverage'];
  }

  generateTenantRecommendations(tenant, assessments, alerts) {
    return ['Implement payment reminders', 'Review lease terms', 'Consider tenant retention program'];
  }

  async getComplianceData(startDate, endDate) {
    return { auditsCompleted: 12, violationsFound: 3, complianceRate: 95.2 };
  }

  async getComplianceViolations(startDate, endDate) {
    return [
      { id: 'viol1', description: 'Missing fire inspection', severity: 'high', status: 'open' }
    ];
  }

  async getComplianceAudits(startDate, endDate) {
    return [
      { id: 'audit1', type: 'safety', date: '2024-08-15', result: 'pass', findings: 0 }
    ];
  }

  calculateComplianceRate(audits, violations) {
    return 95.2;
  }

  async getRemediationPlans(violations) {
    return violations.map(v => ({ violationId: v.id, plan: 'Schedule inspection within 30 days', deadline: '2024-10-15' }));
  }

  generateComplianceRecommendations(violations, audits) {
    return ['Increase audit frequency', 'Implement automated compliance monitoring'];
  }

  flattenReportDataForCSV(reportData) {
    // Simplified CSV flattening - in real implementation, this would be more comprehensive
    return [
      {
        reportType: reportData.reportType,
        generatedAt: reportData.generatedAt,
        totalProperties: reportData.summary?.totalProperties || 0,
        totalTenants: reportData.summary?.totalTenants || 0,
        portfolioRiskScore: reportData.summary?.portfolioRiskScore || 0,
        criticalAlerts: reportData.summary?.criticalAlerts || 0
      }
    ];
  }

  populateSummarySheet(sheet, reportData) {
    sheet.addRow(['Risk Assessment Report Summary']);
    sheet.addRow(['Report Type', this.REPORT_TYPES[reportData.reportType]]);
    sheet.addRow(['Generated At', reportData.generatedAt]);
    sheet.addRow(['Period Start', reportData.period?.start]);
    sheet.addRow(['Period End', reportData.period?.end]);

    if (reportData.summary) {
      sheet.addRow([]);
      sheet.addRow(['Summary Metrics']);
      Object.entries(reportData.summary).forEach(([key, value]) => {
        sheet.addRow([this.formatKey(key), value]);
      });
    }
  }

  populateDetailsSheet(sheet, reportData) {
    sheet.addRow(['Detailed Risk Data']);

    if (reportData.riskDistribution) {
      sheet.addRow([]);
      sheet.addRow(['Risk Distribution']);
      Object.entries(reportData.riskDistribution).forEach(([level, count]) => {
        sheet.addRow([level.charAt(0).toUpperCase() + level.slice(1), count]);
      });
    }
  }

  populateTrendsSheet(sheet, trends) {
    sheet.addRow(['Risk Trends Analysis']);
    sheet.addRow(['Direction', trends.direction]);
    sheet.addRow(['Change Percent', `${trends.changePercent}%`]);
    sheet.addRow(['Average Score', trends.averageScore]);
  }

  calculateNextRun(frequency) {
    const now = new Date();
    switch (frequency) {
      case 'daily':
        now.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        now.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        now.setMonth(now.getMonth() + 1);
        break;
    }
    return now.toISOString();
  }

  formatKey(key) {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/([a-z])([A-Z])/g, '$1 $2');
  }
}

module.exports = new RiskReportingService();