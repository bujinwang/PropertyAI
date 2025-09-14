const request = require('supertest');
const { sequelize } = require('../src/models');
const ReportTemplate = require('../src/models/ReportTemplate');
const GeneratedReport = require('../src/models/GeneratedReport');
const ReportAuditLog = require('../src/models/ReportAuditLog');
const User = require('../src/models/User');

// Mock authentication for E2E tests
const mockAuth = (userId = 'e2e-test-user') => {
  return (req, res, next) => {
    req.user = { id: userId, email: 'e2e-test@example.com' };
    next();
  };
};

describe('AI-Powered Reporting System End-to-End Tests', () => {
  let app;
  let server;
  let testUser;
  let aiTemplate;
  let predictiveTemplate;
  let authToken;

  beforeAll(async () => {
    // Set up test database
    await sequelize.authenticate();

    // Create test user
    testUser = await User.create({
      id: 'e2e-test-user',
      email: 'e2e-test@example.com',
      firstName: 'E2E',
      lastName: 'Test',
      role: 'user'
    });

    // Mock JWT token for authentication
    authToken = 'mock-jwt-token-for-e2e-tests';

    // Create Express app for testing
    const express = require('express');
    const reportingRoutes = require('../src/routes/reports');

    app = express();
    app.use(express.json());

    // Mock authentication middleware
    app.use('/api/v1/reports', mockAuth('e2e-test-user'));
    app.use('/api/v1/reports', reportingRoutes);

    server = app.listen(0);
  });

  afterAll(async () => {
    await server.close();
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clean up test data between tests
    await ReportAuditLog.destroy({ where: {} });
    await GeneratedReport.destroy({ where: {} });
    await ReportTemplate.destroy({ where: {} });

    // Create AI-enhanced template
    aiTemplate = await ReportTemplate.create({
      id: `e2e-ai-template-${Date.now()}`,
      name: 'AI Executive Summary Template',
      sections: [
        { type: 'summary', dataSource: 'financial', visualization: 'text' },
        { type: 'insights', dataSource: 'ai', visualization: 'text' },
        { type: 'recommendations', dataSource: 'ai', visualization: 'list' }
      ],
      ownerId: 'e2e-test-user'
    });

    // Create predictive analytics template
    predictiveTemplate = await ReportTemplate.create({
      id: `e2e-predictive-template-${Date.now()}`,
      name: 'Predictive Analytics Template',
      sections: [
        { type: 'churn_analysis', dataSource: 'predictive', visualization: 'chart' },
        { type: 'maintenance_forecast', dataSource: 'predictive', visualization: 'table' }
      ],
      ownerId: 'e2e-test-user'
    });
  });

  describe('Complete AI Report Generation Workflow', () => {
    it('should complete full AI-enhanced report generation cycle', async () => {
      // Step 1: Generate AI report
      const reportParams = {
        templateId: aiTemplate.id,
        parameters: {
          periodStart: '2025-01-01',
          periodEnd: '2025-01-31',
          includeAI: true,
          minConfidence: 0.8
        }
      };

      const generateResponse = await request(app)
        .post('/api/v1/reports/generate')
        .send(reportParams);

      expect(generateResponse.status).toBe(200);
      expect(generateResponse.body).toHaveProperty('reportId');
      expect(generateResponse.body).toHaveProperty('aiConfidence');
      expect(generateResponse.body.aiConfidence).toBeGreaterThanOrEqual(80);

      const reportId = generateResponse.body.reportId;

      // Step 2: Retrieve the AI-generated report
      const getReportResponse = await request(app)
        .get(`/api/v1/reports/${reportId}`);

      expect(getReportResponse.status).toBe(200);
      expect(getReportResponse.body.id).toBe(reportId);
      expect(getReportResponse.body.status).toBe('generated');
      expect(getReportResponse.body.content).toHaveProperty('insights');
      expect(getReportResponse.body.content).toHaveProperty('recommendations');
      expect(getReportResponse.body.content.insights).toHaveLength(2); // Mock AI insights

      // Step 3: Check audit trail for AI operations
      const auditResponse = await request(app)
        .get(`/api/v1/reports/${reportId}/audit`)
        .query({ limit: 10 });

      expect(auditResponse.status).toBe(200);
      expect(auditResponse.body).toHaveProperty('auditTrail');
      expect(auditResponse.body.auditTrail.length).toBeGreaterThan(0);

      // Should include AI insight generation audit
      const aiAudit = auditResponse.body.auditTrail.find(
        log => log.action === 'ai_insight_generated' || log.action === 'generated'
      );
      expect(aiAudit).toBeDefined();

      // Step 4: Run compliance checks on AI content
      const complianceResponse = await request(app)
        .post(`/api/v1/reports/${reportId}/compliance-check`)
        .send({ checkTypes: ['gdpr', 'ai_bias'] });

      expect(complianceResponse.status).toBe(200);
      expect(complianceResponse.body).toHaveProperty('complianceChecks');
      expect(complianceResponse.body.complianceChecks.length).toBe(2);

      // Step 5: Export AI report in multiple formats
      const exportPdfResponse = await request(app)
        .post(`/api/v1/reports/${reportId}/export`)
        .send({ format: 'pdf' });

      expect(exportPdfResponse.status).toBe(200);
      expect(exportPdfResponse.body).toHaveProperty('fileName');
      expect(exportPdfResponse.body.format).toBe('pdf');

      const exportJsonResponse = await request(app)
        .post(`/api/v1/reports/${reportId}/export`)
        .send({ format: 'json' });

      expect(exportJsonResponse.status).toBe(200);
      expect(exportJsonResponse.body.format).toBe('json');
      expect(exportJsonResponse.body).toHaveProperty('data');
      expect(exportJsonResponse.body.data).toHaveProperty('insights');

      console.log(`✅ Complete AI report workflow successful for report ${reportId}`);
    });

    it('should handle predictive analytics integration', async () => {
      // Step 1: Generate predictive report
      const predictiveParams = {
        templateId: predictiveTemplate.id,
        parameters: {
          periodStart: '2025-01-01',
          periodEnd: '2025-01-31',
          includePredictive: true
        }
      };

      const generateResponse = await request(app)
        .post('/api/v1/reports/generate')
        .send(predictiveParams);

      expect(generateResponse.status).toBe(200);
      const reportId = generateResponse.body.reportId;

      // Step 2: Verify predictive data in report
      const getReportResponse = await request(app)
        .get(`/api/v1/reports/${reportId}`);

      expect(getReportResponse.status).toBe(200);
      expect(getReportResponse.body.content).toHaveProperty('predictiveData');
      expect(getReportResponse.body.content.predictiveData).toHaveProperty('churnRisk');
      expect(getReportResponse.body.content.predictiveData).toHaveProperty('maintenanceForecast');

      // Step 3: Check predictive data audit
      const auditResponse = await request(app)
        .get(`/api/v1/reports/${reportId}/audit`);

      const predictiveAudit = auditResponse.body.auditTrail.find(
        log => log.action === 'predictive_data_accessed'
      );
      expect(predictiveAudit).toBeDefined();

      console.log(`✅ Predictive analytics integration successful`);
    });
  });

  describe('AI Confidence and Quality Assurance', () => {
    it('should validate AI confidence thresholds', async () => {
      const highConfidenceParams = {
        templateId: aiTemplate.id,
        parameters: {
          periodStart: '2025-01-01',
          periodEnd: '2025-01-31',
          includeAI: true,
          minConfidence: 0.95
        }
      };

      const response = await request(app)
        .post('/api/v1/reports/generate')
        .send(highConfidenceParams);

      expect(response.status).toBe(200);
      expect(response.body.aiConfidence).toBeGreaterThanOrEqual(95);

      // Verify high confidence insights
      const reportResponse = await request(app)
        .get(`/api/v1/reports/${response.body.reportId}`);

      reportResponse.body.content.insights.forEach(insight => {
        expect(insight.confidence).toBeGreaterThanOrEqual(0.95);
      });
    });

    it('should handle AI service degradation gracefully', async () => {
      // Simulate AI service failure by mocking low confidence
      const degradedParams = {
        templateId: aiTemplate.id,
        parameters: {
          periodStart: '2025-01-01',
          periodEnd: '2025-01-31',
          includeAI: true,
          allowDegradedAI: true
        }
      };

      const response = await request(app)
        .post('/api/v1/reports/generate')
        .send(degradedParams);

      expect(response.status).toBe(200);
      expect(response.body.aiConfidence).toBeLessThan(80); // Degraded confidence

      // Should still generate report with fallback content
      const reportResponse = await request(app)
        .get(`/api/v1/reports/${response.body.reportId}`);

      expect(reportResponse.body.content).toHaveProperty('summary');
      expect(reportResponse.body.content.summary).toContain('degraded');
    });
  });

  describe('Email Delivery with AI Content', () => {
    it('should send AI-enhanced reports via email', async () => {
      // Generate AI report
      const generateResponse = await request(app)
        .post('/api/v1/reports/generate')
        .send({
          templateId: aiTemplate.id,
          parameters: {
            periodStart: '2025-01-01',
            periodEnd: '2025-01-31',
            includeAI: true
          }
        });

      const reportId = generateResponse.body.reportId;

      // Send email with AI insights
      const emailData = {
        to: ['recipient@example.com', 'manager@example.com'],
        subject: 'AI-Enhanced Monthly Report',
        body: 'Please find your AI-enhanced monthly report attached.',
        format: 'pdf',
        includeInsights: true,
        priority: 'high'
      };

      const emailResponse = await request(app)
        .post(`/api/v1/reports/${reportId}/send-email`)
        .send(emailData);

      expect(emailResponse.status).toBe(200);
      expect(emailResponse.body).toHaveProperty('success', true);
      expect(emailResponse.body).toHaveProperty('messageId');

      // Verify email audit
      const auditResponse = await request(app)
        .get(`/api/v1/reports/${reportId}/audit`);

      const emailAudit = auditResponse.body.auditTrail.find(
        log => log.action === 'email_sent'
      );
      expect(emailAudit).toBeDefined();
      expect(emailAudit.details.recipients).toContain('recipient@example.com');
      expect(emailAudit.details.recipients).toContain('manager@example.com');

      console.log(`✅ AI-enhanced email delivery successful`);
    });

    it('should handle email delivery failures', async () => {
      const reportId = 'non-existent-report';
      const emailData = {
        to: ['recipient@example.com'],
        subject: 'Test Report',
        body: 'Test content'
      };

      const response = await request(app)
        .post(`/api/v1/reports/${reportId}/send-email`)
        .send(emailData);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Scheduled AI Reports', () => {
    it('should create and execute scheduled AI reports', async () => {
      const scheduleData = {
        templateId: aiTemplate.id,
        frequency: 'weekly',
        recipients: ['weekly@example.com'],
        format: 'pdf',
        parameters: {
          includeAI: true,
          periodStart: '2025-01-01',
          periodEnd: '2025-01-31'
        }
      };

      const scheduleResponse = await request(app)
        .post('/api/v1/reports/schedule')
        .send(scheduleData);

      expect(scheduleResponse.status).toBe(200);
      expect(scheduleResponse.body).toHaveProperty('scheduleId');

      const scheduleId = scheduleResponse.body.scheduleId;

      // Get scheduled reports
      const getSchedulesResponse = await request(app)
        .get('/api/v1/reports/scheduled');

      expect(getSchedulesResponse.status).toBe(200);
      expect(getSchedulesResponse.body.schedules.length).toBeGreaterThan(0);

      const createdSchedule = getSchedulesResponse.body.schedules.find(
        s => s.id === scheduleId
      );
      expect(createdSchedule).toBeDefined();
      expect(createdSchedule.frequency).toBe('weekly');
      expect(createdSchedule.recipients).toContain('weekly@example.com');

      console.log(`✅ Scheduled AI reports setup successful`);
    });
  });

  describe('Data Retention and Cleanup', () => {
    it('should handle data retention for AI reports', async () => {
      // Generate multiple AI reports
      const reportIds = [];
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post('/api/v1/reports/generate')
          .send({
            templateId: aiTemplate.id,
            parameters: {
              periodStart: '2025-01-01',
              periodEnd: '2025-01-31',
              includeAI: true
            }
          });
        reportIds.push(response.body.reportId);
      }

      // Get retention statistics
      const statsResponse = await request(app)
        .get('/api/admin/retention-stats');

      expect(statsResponse.status).toBe(200);
      expect(statsResponse.body).toHaveProperty('statistics');
      expect(statsResponse.body.statistics.generatedReports.total).toBeGreaterThanOrEqual(5);

      // Trigger cleanup
      const cleanupResponse = await request(app)
        .post('/api/admin/cleanup-ai-reports')
        .send({ olderThanDays: 0 }); // Clean all for test

      expect(cleanupResponse.status).toBe(200);
      expect(cleanupResponse.body).toHaveProperty('cleanupResults');
      expect(cleanupResponse.body.cleanupResults.aiReports).toBeGreaterThanOrEqual(5);

      console.log(`✅ AI report data retention and cleanup successful`);
    });
  });

  describe('Performance with AI Processing', () => {
    it('should handle concurrent AI report generation', async () => {
      const concurrentRequests = 3;
      const promises = [];

      const startTime = Date.now();

      // Generate multiple AI reports concurrently
      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          request(app)
            .post('/api/v1/reports/generate')
            .send({
              templateId: aiTemplate.id,
              parameters: {
                periodStart: '2025-01-01',
                periodEnd: '2025-01-31',
                includeAI: true,
                properties: [`property-${i}`]
              }
            })
        );
      }

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('reportId');
        expect(response.body).toHaveProperty('aiConfidence');
      });

      // Should complete within reasonable time (allowing for AI processing)
      expect(duration).toBeLessThan(10000); // Less than 10 seconds for 3 concurrent AI reports

      console.log(`✅ Concurrent AI report generation: ${concurrentRequests} reports in ${duration}ms`);
    });

    it('should maintain performance with large datasets', async () => {
      const largeDatasetParams = {
        templateId: predictiveTemplate.id,
        parameters: {
          periodStart: '2025-01-01',
          periodEnd: '2025-12-31', // Full year
          properties: Array.from({ length: 50 }, (_, i) => `property-${i}`), // 50 properties
          includePredictive: true,
          includeAI: true
        }
      };

      const startTime = Date.now();

      const response = await request(app)
        .post('/api/v1/reports/generate')
        .send(largeDatasetParams);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(15000); // Should complete within 15 seconds for large dataset

      console.log(`✅ Large dataset AI report generation took ${duration}ms`);
    });
  });

  describe('Security and Access Control', () => {
    it('should enforce access control for AI reports', async () => {
      // Generate report as test user
      const generateResponse = await request(app)
        .post('/api/v1/reports/generate')
        .send({
          templateId: aiTemplate.id,
          parameters: {
            periodStart: '2025-01-01',
            periodEnd: '2025-01-31',
            includeAI: true
          }
        });

      const reportId = generateResponse.body.reportId;

      // Try to access with different user (should fail)
      const differentUserApp = express();
      differentUserApp.use(express.json());
      differentUserApp.use('/api/v1/reports', mockAuth('different-user'));
      differentUserApp.use('/api/v1/reports', require('../src/routes/reports'));

      const accessResponse = await request(differentUserApp)
        .get(`/api/v1/reports/${reportId}`);

      expect(accessResponse.status).toBe(403);
      expect(accessResponse.body).toHaveProperty('error', 'Access denied');
    });

    it('should audit unauthorized access attempts', async () => {
      const reportId = 'test-report-id';

      // Attempt unauthorized access
      const differentUserApp = express();
      differentUserApp.use(express.json());
      differentUserApp.use('/api/v1/reports', mockAuth('unauthorized-user'));
      differentUserApp.use('/api/v1/reports', require('../src/routes/reports'));

      await request(differentUserApp)
        .get(`/api/v1/reports/${reportId}`);

      // Check if unauthorized access was audited
      const auditResponse = await request(app)
        .get(`/api/v1/reports/${reportId}/audit`);

      const unauthorizedAudit = auditResponse.body.auditTrail.find(
        log => log.action === 'unauthorized_access'
      );
      expect(unauthorizedAudit).toBeDefined();
      expect(unauthorizedAudit.details.userId).toBe('unauthorized-user');
    });
  });
});