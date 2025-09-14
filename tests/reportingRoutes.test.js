const request = require('supertest');
const express = require('express');
const reportingRoutes = require('../src/routes/reports');
const { sequelize } = require('../src/models');
const ReportTemplate = require('../src/models/ReportTemplate');
const GeneratedReport = require('../src/models/GeneratedReport');
const ReportAuditLog = require('../src/models/ReportAuditLog');

// Mock authentication middleware
jest.mock('../src/middleware/authMiddleware', () => (req, res, next) => {
  req.user = { id: 'test-user-id', email: 'test@example.com' };
  next();
});

// Mock validation middleware
jest.mock('../src/middleware/validationMiddleware', () => () => (req, res, next) => next());

describe('Reporting Routes Integration Tests', () => {
  let app;
  let server;

  beforeAll(async () => {
    // Set up test database
    await sequelize.authenticate();

    // Create test app
    app = express();
    app.use(express.json());
    app.use('/api/v1/reports', reportingRoutes);

    server = app.listen(0);
  });

  afterAll(async () => {
    await server.close();
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clean up test data
    await ReportAuditLog.destroy({ where: {} });
    await GeneratedReport.destroy({ where: {} });
    await ReportTemplate.destroy({ where: {} });
  });

  describe('POST /api/v1/reports/generate', () => {
    it('should generate a report successfully', async () => {
      // Create test template
      const template = await ReportTemplate.create({
        id: 'test-template-1',
        name: 'Test Template',
        sections: [
          { type: 'summary', dataSource: 'financial', visualization: 'text' }
        ],
        ownerId: 'test-user-id'
      });

      const response = await request(app)
        .post('/api/v1/reports/generate')
        .send({
          templateId: 'test-template-1',
          parameters: {
            periodStart: '2025-01-01',
            periodEnd: '2025-01-31'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('reportId');
      expect(response.body).toHaveProperty('aiConfidence');
    });

    it('should return 400 for invalid template ID', async () => {
      const response = await request(app)
        .post('/api/v1/reports/generate')
        .send({
          templateId: 'non-existent-template',
          parameters: {
            periodStart: '2025-01-01',
            periodEnd: '2025-01-31'
          }
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle missing parameters', async () => {
      const response = await request(app)
        .post('/api/v1/reports/generate')
        .send({
          templateId: 'test-template-1'
          // Missing parameters
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/v1/reports', () => {
    beforeEach(async () => {
      // Create test data
      const template = await ReportTemplate.create({
        id: 'test-template-1',
        name: 'Test Template',
        sections: [],
        ownerId: 'test-user-id'
      });

      await GeneratedReport.create({
        id: 'test-report-1',
        templateId: 'test-template-1',
        status: 'generated',
        aiConfidence: 85,
        content: { test: 'data' },
        periodStart: '2025-01-01',
        periodEnd: '2025-01-31'
      });
    });

    it('should retrieve reports list', async () => {
      const response = await request(app)
        .get('/api/v1/reports')
        .query({ limit: 10, offset: 0 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('reports');
      expect(Array.isArray(response.body.reports)).toBe(true);
      expect(response.body.reports.length).toBeGreaterThan(0);
    });

    it('should filter reports by status', async () => {
      const response = await request(app)
        .get('/api/v1/reports')
        .query({ status: 'generated', limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.reports.every(report => report.status === 'generated')).toBe(true);
    });

    it('should handle pagination', async () => {
      const response = await request(app)
        .get('/api/v1/reports')
        .query({ limit: 1, offset: 0 });

      expect(response.status).toBe(200);
      expect(response.body.reports.length).toBeLessThanOrEqual(1);
    });
  });

  describe('GET /api/v1/reports/:id', () => {
    let testReport;

    beforeEach(async () => {
      const template = await ReportTemplate.create({
        id: 'test-template-1',
        name: 'Test Template',
        sections: [],
        ownerId: 'test-user-id'
      });

      testReport = await GeneratedReport.create({
        id: 'test-report-1',
        templateId: 'test-template-1',
        status: 'generated',
        aiConfidence: 85,
        content: { test: 'data' },
        periodStart: '2025-01-01',
        periodEnd: '2025-01-31'
      });
    });

    it('should retrieve specific report', async () => {
      const response = await request(app)
        .get('/api/v1/reports/test-report-1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 'test-report-1');
      expect(response.body).toHaveProperty('status', 'generated');
      expect(response.body).toHaveProperty('aiConfidence', 85);
    });

    it('should return 404 for non-existent report', async () => {
      const response = await request(app)
        .get('/api/v1/reports/non-existent-report');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/v1/reports/:id/export', () => {
    let testReport;

    beforeEach(async () => {
      const template = await ReportTemplate.create({
        id: 'test-template-1',
        name: 'Test Template',
        sections: [],
        ownerId: 'test-user-id'
      });

      testReport = await GeneratedReport.create({
        id: 'test-report-1',
        templateId: 'test-template-1',
        status: 'generated',
        aiConfidence: 85,
        content: { test: 'data' },
        periodStart: '2025-01-01',
        periodEnd: '2025-01-31'
      });
    });

    it('should export report as PDF', async () => {
      const response = await request(app)
        .post('/api/v1/reports/test-report-1/export')
        .send({ format: 'pdf' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('fileName');
      expect(response.body).toHaveProperty('format', 'pdf');
      expect(response.body).toHaveProperty('downloadUrl');
    });

    it('should export report as CSV', async () => {
      const response = await request(app)
        .post('/api/v1/reports/test-report-1/export')
        .send({ format: 'csv' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('format', 'csv');
    });

    it('should default to PDF format', async () => {
      const response = await request(app)
        .post('/api/v1/reports/test-report-1/export')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('format', 'pdf');
    });

    it('should return 404 for non-existent report', async () => {
      const response = await request(app)
        .post('/api/v1/reports/non-existent-report/export')
        .send({ format: 'pdf' });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/v1/reports/schedule', () => {
    beforeEach(async () => {
      await ReportTemplate.create({
        id: 'test-template-1',
        name: 'Test Template',
        sections: [],
        ownerId: 'test-user-id'
      });
    });

    it('should create report schedule', async () => {
      const response = await request(app)
        .post('/api/v1/reports/schedule')
        .send({
          templateId: 'test-template-1',
          frequency: 'monthly',
          recipients: ['test@example.com'],
          format: 'pdf'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/reports/schedule')
        .send({
          templateId: 'test-template-1'
          // Missing required fields
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/v1/reports/:id/audit', () => {
    beforeEach(async () => {
      const template = await ReportTemplate.create({
        id: 'test-template-1',
        name: 'Test Template',
        sections: [],
        ownerId: 'test-user-id'
      });

      await GeneratedReport.create({
        id: 'test-report-1',
        templateId: 'test-template-1',
        status: 'generated',
        aiConfidence: 85,
        content: { test: 'data' }
      });

      // Create test audit log
      await ReportAuditLog.create({
        id: 'test-audit-1',
        action: 'viewed',
        resourceType: 'report',
        resourceId: 'test-report-1',
        userId: 'test-user-id',
        details: { viewedAt: new Date() },
        riskLevel: 'low',
        dataSensitivity: 'internal'
      });
    });

    it('should retrieve audit trail', async () => {
      const response = await request(app)
        .get('/api/v1/reports/test-report-1/audit')
        .query({ limit: 10, offset: 0 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('auditTrail');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.auditTrail)).toBe(true);
    });

    it('should filter audit trail by action', async () => {
      const response = await request(app)
        .get('/api/v1/reports/test-report-1/audit')
        .query({ action: 'viewed', limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.auditTrail.every(log => log.action === 'viewed')).toBe(true);
    });

    it('should handle date range filters', async () => {
      const response = await request(app)
        .get('/api/v1/reports/test-report-1/audit')
        .query({
          dateFrom: '2025-01-01',
          dateTo: '2025-12-31',
          limit: 10
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('auditTrail');
    });
  });

  describe('POST /api/v1/reports/:id/compliance-check', () => {
    beforeEach(async () => {
      const template = await ReportTemplate.create({
        id: 'test-template-1',
        name: 'Test Template',
        sections: [],
        ownerId: 'test-user-id'
      });

      await GeneratedReport.create({
        id: 'test-report-1',
        templateId: 'test-template-1',
        status: 'generated',
        aiConfidence: 85,
        content: { test: 'data' }
      });
    });

    it('should run compliance checks', async () => {
      const response = await request(app)
        .post('/api/v1/reports/test-report-1/compliance-check')
        .send({ checkTypes: ['gdpr', 'hipaa'] });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('complianceChecks');
      expect(Array.isArray(response.body.complianceChecks)).toBe(true);
    });

    it('should handle empty check types', async () => {
      const response = await request(app)
        .post('/api/v1/reports/test-report-1/compliance-check')
        .send({ checkTypes: [] });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/v1/reports/:id/compliance', () => {
    beforeEach(async () => {
      const template = await ReportTemplate.create({
        id: 'test-template-1',
        name: 'Test Template',
        sections: [],
        ownerId: 'test-user-id'
      });

      await GeneratedReport.create({
        id: 'test-report-1',
        templateId: 'test-template-1',
        status: 'generated',
        aiConfidence: 85,
        content: { test: 'data' }
      });
    });

    it('should retrieve compliance status', async () => {
      const response = await request(app)
        .get('/api/v1/reports/test-report-1/compliance');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('complianceChecks');
      expect(Array.isArray(response.body.complianceChecks)).toBe(true);
    });
  });

  describe('GET /api/v1/reports/:id/versions', () => {
    beforeEach(async () => {
      const template = await ReportTemplate.create({
        id: 'test-template-1',
        name: 'Test Template',
        sections: [],
        ownerId: 'test-user-id'
      });

      await GeneratedReport.create({
        id: 'test-report-1',
        templateId: 'test-template-1',
        status: 'generated',
        aiConfidence: 85,
        content: { test: 'data' }
      });
    });

    it('should retrieve report versions', async () => {
      const response = await request(app)
        .get('/api/v1/reports/test-report-1/versions')
        .query({ limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('versions');
      expect(Array.isArray(response.body.versions)).toBe(true);
    });
  });

  describe('POST /api/admin/cleanup-audit-logs', () => {
    it('should trigger data cleanup', async () => {
      const response = await request(app)
        .post('/api/admin/cleanup-audit-logs');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('cleanupResults');
    });
  });

  describe('GET /api/admin/retention-stats', () => {
    it('should retrieve retention statistics', async () => {
      const response = await request(app)
        .get('/api/admin/retention-stats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('statistics');
      expect(response.body.statistics).toHaveProperty('auditLogs');
      expect(response.body.statistics).toHaveProperty('reportVersions');
      expect(response.body.statistics).toHaveProperty('complianceChecks');
      expect(response.body.statistics).toHaveProperty('generatedReports');
      expect(response.body.statistics).toHaveProperty('scheduledReports');
    });
  });
});