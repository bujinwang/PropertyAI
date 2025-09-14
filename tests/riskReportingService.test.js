const riskReportingService = require('../src/services/riskReportingService');
const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs').promises;

describe('RiskReportingService', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('generatePortfolioSummaryReport', () => {
    it('should generate portfolio summary report', async () => {
      const options = {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        includeTrends: true,
        includeMitigation: true
      };

      const report = await riskReportingService.generatePortfolioSummaryReport(options);

      expect(report).to.have.property('reportType', 'portfolio_summary');
      expect(report).to.have.property('generatedAt');
      expect(report).to.have.property('period');
      expect(report).to.have.property('summary');
      expect(report).to.have.property('riskDistribution');
      expect(report).to.have.property('topRisks');
      expect(report).to.have.property('recommendations');
      expect(report).to.have.property('trends');
      expect(report).to.have.property('mitigation');
    });

    it('should generate report without trends', async () => {
      const options = {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        includeTrends: false,
        includeMitigation: true
      };

      const report = await riskReportingService.generatePortfolioSummaryReport(options);

      expect(report).to.have.property('reportType', 'portfolio_summary');
      expect(report).to.not.have.property('trends');
      expect(report).to.have.property('mitigation');
    });
  });

  describe('generatePropertyDetailReport', () => {
    it('should generate property detail report', async () => {
      const propertyId = 'test-property-id';
      const options = {
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        includeHistory: true
      };

      const report = await riskReportingService.generatePropertyDetailReport(propertyId, options);

      expect(report).to.have.property('reportType', 'property_detail');
      expect(report).to.have.property('propertyId', propertyId);
      expect(report).to.have.property('property');
      expect(report).to.have.property('currentRisk');
      expect(report).to.have.property('riskHistory');
      expect(report).to.have.property('alerts');
      expect(report).to.have.property('maintenanceHistory');
      expect(report).to.have.property('riskAnalysis');
      expect(report).to.have.property('recommendations');
    });

    it('should generate report without history', async () => {
      const propertyId = 'test-property-id';
      const options = {
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        includeHistory: false
      };

      const report = await riskReportingService.generatePropertyDetailReport(propertyId, options);

      expect(report).to.have.property('reportType', 'property_detail');
      expect(report).to.have.property('riskHistory');
      expect(report.riskHistory).to.be.an('array');
    });
  });

  describe('generateTenantDetailReport', () => {
    it('should generate tenant detail report', async () => {
      const tenantId = 'test-tenant-id';
      const options = {
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        includeHistory: true
      };

      const report = await riskReportingService.generateTenantDetailReport(tenantId, options);

      expect(report).to.have.property('reportType', 'tenant_detail');
      expect(report).to.have.property('tenantId', tenantId);
      expect(report).to.have.property('tenant');
      expect(report).to.have.property('currentRisk');
      expect(report).to.have.property('riskHistory');
      expect(report).to.have.property('alerts');
      expect(report).to.have.property('paymentHistory');
      expect(report).to.have.property('riskAnalysis');
      expect(report).to.have.property('recommendations');
    });
  });

  describe('generateComplianceAuditReport', () => {
    it('should generate compliance audit report', async () => {
      const options = {
        startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        includeRemediation: true
      };

      const report = await riskReportingService.generateComplianceAuditReport(options);

      expect(report).to.have.property('reportType', 'compliance_audit');
      expect(report).to.have.property('generatedAt');
      expect(report).to.have.property('period');
      expect(report).to.have.property('summary');
      expect(report).to.have.property('complianceData');
      expect(report).to.have.property('violations');
      expect(report).to.have.property('audits');
      expect(report).to.have.property('remediation');
      expect(report).to.have.property('recommendations');
    });

    it('should generate report without remediation', async () => {
      const options = {
        startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        includeRemediation: false
      };

      const report = await riskReportingService.generateComplianceAuditReport(options);

      expect(report).to.have.property('reportType', 'compliance_audit');
      expect(report).to.have.property('remediation').that.is.null;
    });
  });

  describe('exportReport', () => {
    beforeEach(() => {
      // Mock fs operations
      sandbox.stub(fs, 'mkdir').resolves();
      sandbox.stub(fs, 'writeFile').resolves();
      sandbox.stub(fs, 'readFile').resolves(Buffer.from('test'));
    });

    it('should export report to PDF', async () => {
      const reportData = {
        reportType: 'portfolio_summary',
        generatedAt: new Date().toISOString(),
        summary: { totalProperties: 5, totalTenants: 10 }
      };

      const result = await riskReportingService.exportReport(reportData, 'pdf', {
        fileName: 'test-report',
        outputPath: './exports'
      });

      expect(result).to.have.property('success', true);
      expect(result).to.have.property('format', 'pdf');
      expect(result).to.have.property('fileName', 'test-report.pdf');
      expect(result).to.have.property('filePath');
      expect(result).to.have.property('size');
      expect(result).to.have.property('generatedAt');
    });

    it('should export report to CSV', async () => {
      const reportData = {
        reportType: 'portfolio_summary',
        generatedAt: new Date().toISOString(),
        summary: { totalProperties: 5, totalTenants: 10 }
      };

      const result = await riskReportingService.exportReport(reportData, 'csv', {
        fileName: 'test-report',
        outputPath: './exports'
      });

      expect(result).to.have.property('success', true);
      expect(result).to.have.property('format', 'csv');
      expect(result).to.have.property('fileName', 'test-report.csv');
    });

    it('should export report to Excel', async () => {
      const reportData = {
        reportType: 'portfolio_summary',
        generatedAt: new Date().toISOString(),
        summary: { totalProperties: 5, totalTenants: 10 }
      };

      const result = await riskReportingService.exportReport(reportData, 'excel', {
        fileName: 'test-report',
        outputPath: './exports'
      });

      expect(result).to.have.property('success', true);
      expect(result).to.have.property('format', 'excel');
      expect(result).to.have.property('fileName', 'test-report.xlsx');
    });

    it('should export report to JSON', async () => {
      const reportData = {
        reportType: 'portfolio_summary',
        generatedAt: new Date().toISOString(),
        summary: { totalProperties: 5, totalTenants: 10 }
      };

      const result = await riskReportingService.exportReport(reportData, 'json', {
        fileName: 'test-report',
        outputPath: './exports'
      });

      expect(result).to.have.property('success', true);
      expect(result).to.have.property('format', 'json');
      expect(result).to.have.property('fileName', 'test-report.json');
    });

    it('should throw error for unsupported format', async () => {
      const reportData = {
        reportType: 'portfolio_summary',
        generatedAt: new Date().toISOString()
      };

      try {
        await riskReportingService.exportReport(reportData, 'unsupported', {
          fileName: 'test-report',
          outputPath: './exports'
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Unsupported export format');
      }
    });
  });

  describe('scheduleReport', () => {
    it('should schedule automated report generation', async () => {
      const scheduleConfig = {
        reportType: 'portfolio_summary',
        frequency: 'weekly',
        recipients: ['test@example.com'],
        format: 'pdf',
        options: { includeTrends: true }
      };

      const result = await riskReportingService.scheduleReport(scheduleConfig);

      expect(result).to.have.property('scheduleId');
      expect(result).to.have.property('reportType', 'portfolio_summary');
      expect(result).to.have.property('frequency', 'weekly');
      expect(result).to.have.property('recipients');
      expect(result).to.have.property('format', 'pdf');
      expect(result).to.have.property('nextRun');
      expect(result).to.have.property('createdAt');
    });
  });

  describe('getScheduledReports', () => {
    it('should return scheduled reports', async () => {
      const reports = await riskReportingService.getScheduledReports();

      expect(reports).to.be.an('array');
      if (reports.length > 0) {
        expect(reports[0]).to.have.property('scheduleId');
        expect(reports[0]).to.have.property('reportType');
        expect(reports[0]).to.have.property('frequency');
        expect(reports[0]).to.have.property('recipients');
        expect(reports[0]).to.have.property('nextRun');
      }
    });
  });

  describe('generateBulkReports', () => {
    it('should generate bulk property reports', async () => {
      const entityIds = ['prop1', 'prop2', 'prop3'];
      const options = {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date()
      };

      const reports = await riskReportingService.generateBulkReports(entityIds, 'property', options);

      expect(reports).to.be.an('array');
      expect(reports).to.have.lengthOf(3);
      reports.forEach(report => {
        expect(report).to.have.property('reportType', 'property_detail');
      });
    });

    it('should generate bulk tenant reports', async () => {
      const entityIds = ['tenant1', 'tenant2'];
      const options = {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date()
      };

      const reports = await riskReportingService.generateBulkReports(entityIds, 'tenant', options);

      expect(reports).to.be.an('array');
      expect(reports).to.have.lengthOf(2);
      reports.forEach(report => {
        expect(report).to.have.property('reportType', 'tenant_detail');
      });
    });

    it('should handle errors in bulk report generation', async () => {
      const entityIds = ['invalid1', 'invalid2'];
      const options = {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date()
      };

      const reports = await riskReportingService.generateBulkReports(entityIds, 'property', options);

      expect(reports).to.be.an('array');
      expect(reports).to.have.lengthOf(2);
      reports.forEach(report => {
        expect(report).to.have.property('error');
      });
    });
  });

  describe('calculateRiskDistribution', () => {
    it('should calculate risk distribution correctly', () => {
      const propertyRisks = [
        { riskLevel: 'high' },
        { riskLevel: 'low' },
        { riskLevel: 'critical' }
      ];

      const tenantRisks = [
        { riskLevel: 'medium' },
        { riskLevel: 'high' }
      ];

      const distribution = riskReportingService.calculateRiskDistribution(propertyRisks, tenantRisks);

      expect(distribution).to.have.property('critical', 1);
      expect(distribution).to.have.property('high', 2);
      expect(distribution).to.have.property('medium', 1);
      expect(distribution).to.have.property('low', 1);
      expect(distribution).to.have.property('minimal', 0);
    });

    it('should handle empty risk arrays', () => {
      const distribution = riskReportingService.calculateRiskDistribution([], []);

      expect(distribution).to.have.property('critical', 0);
      expect(distribution).to.have.property('high', 0);
      expect(distribution).to.have.property('medium', 0);
      expect(distribution).to.have.property('low', 0);
      expect(distribution).to.have.property('minimal', 0);
    });
  });

  describe('identifyTopRisks', () => {
    it('should identify top risks by score', () => {
      const propertyRisks = [
        { name: 'Property A', riskScore: 4.5, riskLevel: 'critical', description: 'High risk property' },
        { name: 'Property B', riskScore: 2.0, riskLevel: 'medium', description: 'Medium risk property' },
        { name: 'Property C', riskScore: 3.8, riskLevel: 'high', description: 'Another high risk property' }
      ];

      const tenantRisks = [
        { name: 'Tenant X', riskScore: 4.2, riskLevel: 'critical', description: 'High risk tenant' }
      ];

      const topRisks = riskReportingService.identifyTopRisks(propertyRisks, tenantRisks);

      expect(topRisks).to.be.an('array');
      expect(topRisks).to.have.lengthOf(3);
      expect(topRisks[0].riskScore).to.be.greaterThanOrEqual(topRisks[1].riskScore);
      expect(topRisks[0]).to.have.property('entityName');
      expect(topRisks[0]).to.have.property('riskLevel');
      expect(topRisks[0]).to.have.property('description');
    });

    it('should limit results to top 5', () => {
      const risks = Array.from({ length: 10 }, (_, i) => ({
        name: `Entity ${i}`,
        riskScore: 5 - i * 0.1,
        riskLevel: 'high',
        description: `Risk ${i}`
      }));

      const topRisks = riskReportingService.identifyTopRisks(risks, []);

      expect(topRisks).to.have.lengthOf(5);
    });

    it('should only include risks with score >= 3.0', () => {
      const propertyRisks = [
        { name: 'Property A', riskScore: 4.5, riskLevel: 'critical' },
        { name: 'Property B', riskScore: 2.5, riskLevel: 'medium' },
        { name: 'Property C', riskScore: 1.8, riskLevel: 'low' }
      ];

      const topRisks = riskReportingService.identifyTopRisks(propertyRisks, []);

      expect(topRisks).to.have.lengthOf(1);
      expect(topRisks[0].name).to.equal('Property A');
    });
  });

  describe('generateRecommendations', () => {
    it('should generate recommendations based on data', () => {
      const portfolioData = { overallScore: 3.5, riskLevel: 'high' };
      const alerts = { critical: 2, high: 5 };
      const trends = { direction: 'increasing', changePercent: 15 };

      const recommendations = riskReportingService.generateRecommendations(portfolioData, alerts, trends);

      expect(recommendations).to.be.an('array');
      expect(recommendations.length).to.be.greaterThan(0);
      expect(recommendations[0]).to.be.a('string');
    });

    it('should include critical alert recommendations', () => {
      const portfolioData = { overallScore: 2.0, riskLevel: 'medium' };
      const alerts = { critical: 3, high: 0 };
      const trends = null;

      const recommendations = riskReportingService.generateRecommendations(portfolioData, alerts, trends);

      const criticalRec = recommendations.find(rec => rec.includes('critical'));
      expect(criticalRec).to.exist;
    });

    it('should include trend-based recommendations', () => {
      const portfolioData = { overallScore: 2.0, riskLevel: 'medium' };
      const alerts = { critical: 0, high: 0 };
      const trends = { direction: 'increasing', changePercent: 20 };

      const recommendations = riskReportingService.generateRecommendations(portfolioData, alerts, trends);

      const trendRec = recommendations.find(rec => rec.includes('trend'));
      expect(trendRec).to.exist;
    });
  });

  describe('flattenReportDataForCSV', () => {
    it('should flatten report data for CSV export', () => {
      const reportData = {
        reportType: 'portfolio_summary',
        generatedAt: '2024-09-14T12:00:00Z',
        summary: {
          totalProperties: 5,
          totalTenants: 10,
          portfolioRiskScore: 2.8,
          criticalAlerts: 2
        }
      };

      const csvData = riskReportingService.flattenReportDataForCSV(reportData);

      expect(csvData).to.be.an('array');
      expect(csvData).to.have.lengthOf(1);
      expect(csvData[0]).to.have.property('reportType', 'portfolio_summary');
      expect(csvData[0]).to.have.property('totalProperties', 5);
      expect(csvData[0]).to.have.property('totalTenants', 10);
    });
  });

  describe('calculateNextRun', () => {
    it('should calculate next run for daily frequency', () => {
      const nextRun = riskReportingService.calculateNextRun('daily');
      const expected = new Date();
      expected.setDate(expected.getDate() + 1);

      expect(new Date(nextRun).toDateString()).to.equal(expected.toDateString());
    });

    it('should calculate next run for weekly frequency', () => {
      const nextRun = riskReportingService.calculateNextRun('weekly');
      const expected = new Date();
      expected.setDate(expected.getDate() + 7);

      expect(new Date(nextRun).toDateString()).to.equal(expected.toDateString());
    });

    it('should calculate next run for monthly frequency', () => {
      const nextRun = riskReportingService.calculateNextRun('monthly');
      const expected = new Date();
      expected.setMonth(expected.getMonth() + 1);

      expect(new Date(nextRun).getMonth()).to.equal(expected.getMonth());
    });
  });

  describe('formatKey', () => {
    it('should format keys for display', () => {
      expect(riskReportingService.formatKey('totalProperties')).to.equal('Total Properties');
      expect(riskReportingService.formatKey('portfolioRiskScore')).to.equal('Portfolio Risk Score');
      expect(riskReportingService.formatKey('criticalAlerts')).to.equal('Critical Alerts');
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in report generation', async () => {
      // Mock a method to throw an error
      const originalMethod = riskReportingService.getPortfolioRiskData;
      riskReportingService.getPortfolioRiskData = sinon.stub().throws(new Error('Database error'));

      try {
        await riskReportingService.generatePortfolioSummaryReport();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Portfolio summary report generation failed');
      } finally {
        // Restore original method
        riskReportingService.getPortfolioRiskData = originalMethod;
      }
    });

    it('should handle export errors', async () => {
      // Mock fs.mkdir to throw an error
      sandbox.stub(fs, 'mkdir').throws(new Error('Permission denied'));

      const reportData = {
        reportType: 'portfolio_summary',
        generatedAt: new Date().toISOString()
      };

      try {
        await riskReportingService.exportReport(reportData, 'pdf', {
          fileName: 'test-report',
          outputPath: './exports'
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Report export failed');
      }
    });
  });

  describe('Data Validation', () => {
    it('should validate report data structure', async () => {
      const report = await riskReportingService.generatePortfolioSummaryReport();

      // Check required properties
      expect(report).to.have.property('reportType');
      expect(report).to.have.property('generatedAt');
      expect(report).to.have.property('period');
      expect(report).to.have.property('summary');
      expect(report).to.have.property('riskDistribution');
      expect(report).to.have.property('recommendations');

      // Check data types
      expect(report.reportType).to.be.a('string');
      expect(report.generatedAt).to.be.a('string');
      expect(report.period).to.be.an('object');
      expect(report.summary).to.be.an('object');
      expect(report.riskDistribution).to.be.an('object');
      expect(report.recommendations).to.be.an('array');
    });

    it('should validate export options', async () => {
      const reportData = {
        reportType: 'portfolio_summary',
        generatedAt: new Date().toISOString()
      };

      // Test with missing options
      const result = await riskReportingService.exportReport(reportData, 'json');

      expect(result).to.have.property('success', true);
      expect(result.fileName).to.include('risk_report_');
      expect(result.fileName).to.include('.json');
    });
  });
});