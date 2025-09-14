const request = require('supertest');
const express = require('express');
const riskRoutes = require('../src/routes/risks');
const riskAssessmentService = require('../src/services/riskAssessmentService');
const riskAlertService = require('../src/services/riskAlertService');
const riskReportingService = require('../src/services/riskReportingService');
const { expect } = require('chai');
const sinon = require('sinon');

describe('Risk Assessment E2E Tests', () => {
  let app;
  let sandbox;
  let testPropertyId = 'test-property-e2e-001';
  let testTenantId = 'test-tenant-e2e-001';
  let testAssessmentId;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    // Mock authentication middleware
    sandbox.stub(require('../src/middleware/authMiddleware'), 'default').callsFake((req, res, next) => {
      req.user = { id: 'test-user-e2e', email: 'test@example.com' };
      next();
    });

    app = express();
    app.use(express.json());
    app.use('/api/risks', riskRoutes);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('Complete Risk Assessment Workflow', () => {
    it('should complete full property risk assessment workflow', async () => {
      // Step 1: Trigger property risk assessment
      const assessResponse = await request(app)
        .post('/api/risks/assess')
        .send({
          entityType: 'property',
          entityId: testPropertyId,
          assessmentType: 'comprehensive'
        });

      expect(assessResponse.status).to.equal(200);
      expect(assessResponse.body.success).to.be.true;
      expect(assessResponse.body.data).to.have.property('assessmentId');
      expect(assessResponse.body.data).to.have.property('overallScore');
      expect(assessResponse.body.data).to.have.property('riskLevel');
      expect(assessResponse.body.data).to.have.property('mitigationStrategies');

      testAssessmentId = assessResponse.body.data.assessmentId;

      // Step 2: Retrieve property risk data
      const propertyResponse = await request(app)
        .get(`/api/risks/property/${testPropertyId}`)
        .query({ detailed: true, limit: 5 });

      expect(propertyResponse.status).to.equal(200);
      expect(propertyResponse.body.success).to.be.true;
      expect(propertyResponse.body.data).to.have.property('propertyId', testPropertyId);
      expect(propertyResponse.body.data).to.have.property('assessments');
      expect(propertyResponse.body.data.assessments).to.be.an('array');

      // Step 3: Check risk trends
      const trendsResponse = await request(app)
        .get('/api/risks/trends')
        .query({
          entityType: 'property',
          entityId: testPropertyId,
          period: '30d'
        });

      expect(trendsResponse.status).to.equal(200);
      expect(trendsResponse.body.success).to.be.true;
      expect(trendsResponse.body.data).to.have.property('entityType', 'property');
      expect(trendsResponse.body.data).to.have.property('trends');

      // Step 4: Get specific assessment details
      const assessmentResponse = await request(app)
        .get(`/api/risks/assessment/${testAssessmentId}`);

      expect(assessmentResponse.status).to.equal(200);
      expect(assessmentResponse.body.success).to.be.true;
      expect(assessmentResponse.body.data).to.have.property('assessmentId', testAssessmentId);
      expect(assessmentResponse.body.data).to.have.property('entityType', 'property');
      expect(assessmentResponse.body.data).to.have.property('entityId', testPropertyId);
    });

    it('should complete full tenant risk assessment workflow', async () => {
      // Step 1: Trigger tenant risk assessment
      const assessResponse = await request(app)
        .post('/api/risks/assess')
        .send({
          entityType: 'tenant',
          entityId: testTenantId,
          assessmentType: 'comprehensive'
        });

      expect(assessResponse.status).to.equal(200);
      expect(assessResponse.body.success).to.be.true;
      expect(assessResponse.body.data).to.have.property('assessmentId');
      expect(assessResponse.body.data).to.have.property('overallScore');
      expect(assessResponse.body.data).to.have.property('riskLevel');

      const tenantAssessmentId = assessResponse.body.data.assessmentId;

      // Step 2: Retrieve tenant risk data
      const tenantResponse = await request(app)
        .get(`/api/risks/tenant/${testTenantId}`)
        .query({ detailed: true });

      expect(tenantResponse.status).to.equal(200);
      expect(tenantResponse.body.success).to.be.true;
      expect(tenantResponse.body.data).to.have.property('tenantId', testTenantId);
      expect(tenantResponse.body.data).to.have.property('assessments');

      // Step 3: Check tenant risk trends
      const trendsResponse = await request(app)
        .get('/api/risks/trends')
        .query({
          entityType: 'tenant',
          entityId: testTenantId,
          period: '30d'
        });

      expect(trendsResponse.status).to.equal(200);
      expect(trendsResponse.body.success).to.be.true;
      expect(trendsResponse.body.data).to.have.property('entityType', 'tenant');
      expect(trendsResponse.body.data).to.have.property('trends');
    });

    it('should complete portfolio risk assessment workflow', async () => {
      // Step 1: Trigger portfolio risk assessment
      const assessResponse = await request(app)
        .post('/api/risks/assess')
        .send({
          entityType: 'portfolio',
          assessmentType: 'portfolio'
        });

      expect(assessResponse.status).to.equal(200);
      expect(assessResponse.body.success).to.be.true;
      expect(assessResponse.body.data).to.have.property('assessmentId');
      expect(assessResponse.body.data).to.have.property('portfolioRisk');

      // Step 2: Retrieve portfolio risk summary
      const portfolioResponse = await request(app)
        .get('/api/risks/portfolio')
        .query({ detailed: true });

      expect(portfolioResponse.status).to.equal(200);
      expect(portfolioResponse.body.success).to.be.true;
      expect(portfolioResponse.body.data).to.have.property('overallScore');
      expect(portfolioResponse.body.data).to.have.property('riskLevel');
      expect(portfolioResponse.body.data).to.have.property('confidence');

      // Step 3: Get risk summary statistics
      const summaryResponse = await request(app)
        .get('/api/risks/summary')
        .query({ entityType: 'property', period: '30d' });

      expect(summaryResponse.status).to.equal(200);
      expect(summaryResponse.body.success).to.be.true;
      expect(summaryResponse.body.data).to.have.property('totalAssessments');
      expect(summaryResponse.body.data).to.have.property('riskLevelBreakdown');
      expect(summaryResponse.body.data).to.have.property('averageRiskScore');
    });
  });

  describe('Risk Alert Integration', () => {
    it('should generate and manage alerts through API', async () => {
      // Step 1: Create a high-risk assessment that should trigger alerts
      const highRiskAssessment = {
        entityType: 'property',
        entityId: testPropertyId,
        overallRiskScore: 4.5,
        riskLevel: 'critical',
        riskFactors: {
          maintenance: { score: 4.8, weight: 0.25, impact: 4.5, probability: 0.9 },
          market: { score: 4.2, weight: 0.15, impact: 4.0, probability: 0.8 }
        }
      };

      // Mock the service to return high-risk data
      sandbox.stub(riskAssessmentService, 'assessPropertyRisk').resolves(highRiskAssessment);

      // Step 2: Trigger assessment
      const assessResponse = await request(app)
        .post('/api/risks/assess')
        .send({
          entityType: 'property',
          entityId: testPropertyId,
          assessmentType: 'comprehensive'
        });

      expect(assessResponse.status).to.equal(200);
      expect(assessResponse.body.data.overallScore).to.equal(4.5);
      expect(assessResponse.body.data.riskLevel).to.equal('critical');
    });
  });

  describe('Risk Reporting Integration', () => {
    it('should generate and export reports', async () => {
      // Step 1: Generate portfolio summary report
      const reportData = await riskReportingService.generatePortfolioSummaryReport({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        includeTrends: true,
        includeMitigation: true
      });

      expect(reportData).to.have.property('reportType', 'portfolio_summary');
      expect(reportData).to.have.property('summary');
      expect(reportData).to.have.property('recommendations');

      // Step 2: Export report to different formats
      const formats = ['json', 'csv'];

      for (const format of formats) {
        const exportResult = await riskReportingService.exportReport(reportData, format, {
          fileName: `e2e-test-report-${format}`,
          outputPath: './test-exports'
        });

        expect(exportResult).to.have.property('success', true);
        expect(exportResult).to.have.property('format', format);
        expect(exportResult).to.have.property('fileName');
        expect(exportResult).to.have.property('filePath');
        expect(exportResult).to.have.property('size');
      }
    });

    it('should generate property detail report', async () => {
      const reportData = await riskReportingService.generatePropertyDetailReport(testPropertyId, {
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        includeHistory: true
      });

      expect(reportData).to.have.property('reportType', 'property_detail');
      expect(reportData).to.have.property('propertyId', testPropertyId);
      expect(reportData).to.have.property('property');
      expect(reportData).to.have.property('currentRisk');
      expect(reportData).to.have.property('recommendations');
    });

    it('should generate tenant detail report', async () => {
      const reportData = await riskReportingService.generateTenantDetailReport(testTenantId, {
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        includeHistory: true
      });

      expect(reportData).to.have.property('reportType', 'tenant_detail');
      expect(reportData).to.have.property('tenantId', testTenantId);
      expect(reportData).to.have.property('tenant');
      expect(reportData).to.have.property('currentRisk');
      expect(reportData).to.have.property('recommendations');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid entity IDs gracefully', async () => {
      const response = await request(app)
        .get('/api/risks/property/invalid-uuid')
        .query({ detailed: true });

      expect(response.status).to.equal(400);
      expect(response.body.success).to.be.false;
      expect(response.body.error).to.include('must be a valid UUID');
    });

    it('should handle missing required parameters', async () => {
      const response = await request(app)
        .post('/api/risks/assess')
        .send({
          entityType: 'property'
          // Missing entityId
        });

      expect(response.status).to.equal(400);
      expect(response.body.success).to.be.false;
      expect(response.body.error).to.include('entityId');
    });

    it('should handle invalid assessment types', async () => {
      const response = await request(app)
        .post('/api/risks/assess')
        .send({
          entityType: 'property',
          entityId: testPropertyId,
          assessmentType: 'invalid_type'
        });

      expect(response.status).to.equal(400);
      expect(response.body.success).to.be.false;
      expect(response.body.error).to.include('Invalid assessment type');
    });

    it('should handle invalid date ranges', async () => {
      const response = await request(app)
        .get('/api/risks/trends')
        .query({
          entityType: 'property',
          entityId: testPropertyId,
          period: 'invalid_period'
        });

      expect(response.status).to.equal(400);
      expect(response.body.success).to.be.false;
      expect(response.body.error).to.include('Period must be');
    });

    it('should handle non-existent assessments', async () => {
      const response = await request(app)
        .get('/api/risks/assessment/non-existent-id');

      expect(response.status).to.equal(404);
      expect(response.body.success).to.be.false;
      expect(response.body.error).to.include('not found');
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle multiple concurrent assessments', async () => {
      const assessmentPromises = [];

      // Create 5 concurrent assessment requests
      for (let i = 0; i < 5; i++) {
        const promise = request(app)
          .post('/api/risks/assess')
          .send({
            entityType: 'property',
            entityId: `concurrent-test-${i}`,
            assessmentType: 'comprehensive'
          });

        assessmentPromises.push(promise);
      }

      const responses = await Promise.all(assessmentPromises);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).to.equal(200);
        expect(response.body.success).to.be.true;
      });
    });

    it('should handle bulk data retrieval', async () => {
      const response = await request(app)
        .get('/api/risks/summary')
        .query({
          entityType: 'property',
          period: '90d',
          riskLevel: 'high'
        });

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('totalAssessments');
      expect(response.body.data).to.have.property('riskLevelBreakdown');
    });
  });

  describe('Data Consistency and Integrity', () => {
    it('should maintain data consistency across API calls', async () => {
      // Step 1: Create assessment
      const assessResponse = await request(app)
        .post('/api/risks/assess')
        .send({
          entityType: 'property',
          entityId: testPropertyId,
          assessmentType: 'comprehensive'
        });

      expect(assessResponse.status).to.equal(200);
      const assessmentId = assessResponse.body.data.assessmentId;

      // Step 2: Retrieve assessment details
      const detailResponse = await request(app)
        .get(`/api/risks/assessment/${assessmentId}`);

      expect(detailResponse.status).to.equal(200);
      expect(detailResponse.body.data.assessmentId).to.equal(assessmentId);
      expect(detailResponse.body.data.entityId).to.equal(testPropertyId);

      // Step 3: Verify assessment appears in property list
      const propertyResponse = await request(app)
        .get(`/api/risks/property/${testPropertyId}`);

      expect(propertyResponse.status).to.equal(200);
      const assessments = propertyResponse.body.data.assessments;
      const foundAssessment = assessments.find(a => a.assessmentId === assessmentId);
      expect(foundAssessment).to.exist;
      expect(foundAssessment.entityId).to.equal(testPropertyId);
    });

    it('should handle date range filtering correctly', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7); // 7 days ago
      const endDate = new Date();

      const response = await request(app)
        .get('/api/risks/trends')
        .query({
          entityType: 'property',
          entityId: testPropertyId,
          period: '7d'
        });

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;

      // Verify date range in response
      const responseData = response.body.data;
      expect(responseData).to.have.property('dateRange');
      expect(responseData.dateRange).to.have.property('start');
      expect(responseData.dateRange).to.have.property('end');
    });
  });

  describe('Security and Authentication', () => {
    it('should require authentication for all endpoints', async () => {
      // Temporarily remove auth middleware mock
      sandbox.restore();

      const endpoints = [
        { method: 'post', path: '/api/risks/assess', data: { entityType: 'property', entityId: testPropertyId } },
        { method: 'get', path: '/api/risks/portfolio' },
        { method: 'get', path: `/api/risks/property/${testPropertyId}` },
        { method: 'get', path: '/api/risks/summary' }
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)[endpoint.method](endpoint.path)
          .send(endpoint.data || {});

        // Should fail without authentication
        expect(response.status).to.be.oneOf([401, 403, 500]);
      }
    });

    it('should validate input data properly', async () => {
      const maliciousData = {
        entityType: 'property',
        entityId: testPropertyId,
        assessmentType: 'comprehensive',
        maliciousField: '<script>alert("xss")</script>'
      };

      const response = await request(app)
        .post('/api/risks/assess')
        .send(maliciousData);

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      // Malicious field should be ignored or sanitized
      expect(response.body.data).to.not.have.property('maliciousField');
    });
  });

  describe('Integration with Alert System', () => {
    it('should trigger alerts for high-risk assessments', async () => {
      // Mock alert service to track calls
      const alertStub = sandbox.stub(riskAlertService, 'generateAlertsFromAssessment').resolves([
        {
          id: 'alert-test-1',
          alertType: 'maintenance_critical',
          riskScore: 4.5,
          priority: 'immediate',
          status: 'active'
        }
      ]);

      // Trigger high-risk assessment
      await request(app)
        .post('/api/risks/assess')
        .send({
          entityType: 'property',
          entityId: testPropertyId,
          assessmentType: 'comprehensive'
        });

      // Verify alert service was called
      expect(alertStub.calledOnce).to.be.true;
    });
  });

  describe('Report Generation Integration', () => {
    it('should generate reports with consistent data', async () => {
      // Generate multiple report types and verify consistency
      const [portfolioReport, propertyReport] = await Promise.all([
        riskReportingService.generatePortfolioSummaryReport(),
        riskReportingService.generatePropertyDetailReport(testPropertyId)
      ]);

      expect(portfolioReport).to.have.property('reportType', 'portfolio_summary');
      expect(propertyReport).to.have.property('reportType', 'property_detail');
      expect(propertyReport).to.have.property('propertyId', testPropertyId);

      // Both should have generated timestamps
      expect(portfolioReport).to.have.property('generatedAt');
      expect(propertyReport).to.have.property('generatedAt');
    });
  });

  describe('Workflow Completion', () => {
    it('should complete full risk management workflow', async () => {
      // 1. Assess risk
      const assessResponse = await request(app)
        .post('/api/risks/assess')
        .send({
          entityType: 'property',
          entityId: testPropertyId,
          assessmentType: 'comprehensive'
        });

      expect(assessResponse.status).to.equal(200);
      const assessmentId = assessResponse.body.data.assessmentId;

      // 2. View assessment details
      const detailResponse = await request(app)
        .get(`/api/risks/assessment/${assessmentId}`);
      expect(detailResponse.status).to.equal(200);

      // 3. Check trends
      const trendsResponse = await request(app)
        .get('/api/risks/trends')
        .query({
          entityType: 'property',
          entityId: testPropertyId,
          period: '30d'
        });
      expect(trendsResponse.status).to.equal(200);

      // 4. Generate report
      const reportData = await riskReportingService.generatePropertyDetailReport(testPropertyId);
      expect(reportData).to.have.property('reportType', 'property_detail');

      // 5. Export report
      const exportResult = await riskReportingService.exportReport(reportData, 'json', {
        fileName: 'workflow-test-report',
        outputPath: './test-exports'
      });
      expect(exportResult.success).to.be.true;

      // Workflow completed successfully
      expect(true).to.be.true;
    });
  });
});