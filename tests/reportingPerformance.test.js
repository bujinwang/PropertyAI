const { reportingService } = require('../src/services/reportingService');
const ReportTemplate = require('../src/models/ReportTemplate');
const GeneratedReport = require('../src/models/GeneratedReport');
const ReportAuditLog = require('../src/models/ReportAuditLog');

// Performance test configuration for AI reporting
const AI_PERFORMANCE_THRESHOLDS = {
  aiReportGeneration: 8000, // 8 seconds max for AI processing
  predictiveReportGeneration: 6000, // 6 seconds max for predictive analytics
  aiInsightGeneration: 3000, // 3 seconds max for insight generation
  complianceCheckAI: 4000, // 4 seconds max for AI compliance checks
  concurrentAIReports: 15000, // 15 seconds max for 3 concurrent AI reports
  largeDatasetAI: 12000, // 12 seconds max for large dataset AI processing
  auditTrailAI: 2500, // 2.5 seconds max for AI audit queries
  emailDeliveryAI: 5000 // 5 seconds max for AI-enhanced email delivery
};

describe('AI-Powered Reporting System Performance Tests', () => {
  beforeAll(async () => {
    // Set up test data for AI performance testing
    await setupAIPerformanceTestData();
  });

  afterAll(async () => {
    // Clean up test data
    await cleanupAIPerformanceTestData();
  });

  describe('AI Report Generation Performance', () => {
    it('should generate AI reports within acceptable time limits', async () => {
      const templateId = 'ai-perf-test-template';
      const parameters = {
        periodStart: '2025-01-01',
        periodEnd: '2025-01-31',
        includeAI: true,
        minConfidence: 0.8,
        properties: ['prop-1', 'prop-2', 'prop-3']
      };

      const startTime = Date.now();

      const result = await reportingService.generateReport({
        templateId,
        parameters
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(AI_PERFORMANCE_THRESHOLDS.aiReportGeneration);
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('aiConfidence');
      expect(result.aiConfidence).toBeGreaterThanOrEqual(80);
      expect(result.content).toHaveProperty('insights');
      expect(result.content).toHaveProperty('recommendations');

      console.log(`AI report generation took ${duration}ms with ${result.aiConfidence}% confidence`);
    });

    it('should handle large datasets with AI processing efficiently', async () => {
      const templateId = 'ai-large-dataset-template';
      const parameters = {
        periodStart: '2025-01-01',
        periodEnd: '2025-12-31', // Full year
        includeAI: true,
        properties: Array.from({ length: 100 }, (_, i) => `prop-${i}`), // 100 properties
        includePredictive: true
      };

      const startTime = Date.now();

      const result = await reportingService.generateReport({
        templateId,
        parameters
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(AI_PERFORMANCE_THRESHOLDS.largeDatasetAI);
      expect(result).toHaveProperty('id');
      expect(result.content).toHaveProperty('insights');
      expect(result.content).toHaveProperty('predictiveData');

      console.log(`Large dataset AI report generation took ${duration}ms`);
    });

    it('should maintain performance with high confidence requirements', async () => {
      const templateId = 'ai-high-confidence-template';
      const parameters = {
        periodStart: '2025-01-01',
        periodEnd: '2025-01-31',
        includeAI: true,
        minConfidence: 0.95,
        properties: ['prop-1', 'prop-2']
      };

      const startTime = Date.now();

      const result = await reportingService.generateReport({
        templateId,
        parameters
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(AI_PERFORMANCE_THRESHOLDS.aiReportGeneration);
      expect(result.aiConfidence).toBeGreaterThanOrEqual(95);
      expect(result.content.insights.every(insight => insight.confidence >= 0.95)).toBe(true);

      console.log(`High confidence AI report generation took ${duration}ms`);
    });
  });

  describe('Predictive Analytics Performance', () => {
    it('should generate predictive reports within time limits', async () => {
      const templateId = 'predictive-perf-test-template';
      const parameters = {
        periodStart: '2025-01-01',
        periodEnd: '2025-01-31',
        includePredictive: true,
        includeAI: true
      };

      const startTime = Date.now();

      const result = await reportingService.generateReport({
        templateId,
        parameters
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(AI_PERFORMANCE_THRESHOLDS.predictiveReportGeneration);
      expect(result.content).toHaveProperty('predictiveData');
      expect(result.content.predictiveData).toHaveProperty('churnRisk');
      expect(result.content.predictiveData).toHaveProperty('maintenanceForecast');

      console.log(`Predictive analytics report generation took ${duration}ms`);
    });

    it('should handle concurrent predictive report generation', async () => {
      const templateId = 'predictive-perf-test-template';
      const parameters = {
        periodStart: '2025-01-01',
        periodEnd: '2025-01-31',
        includePredictive: true
      };

      const concurrentRequests = 3;
      const promises = [];

      const startTime = Date.now();

      // Create multiple concurrent requests
      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          reportingService.generateReport({
            templateId,
            parameters: {
              ...parameters,
              properties: [`prop-${i}`]
            }
          })
        );
      }

      const results = await Promise.all(promises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(AI_PERFORMANCE_THRESHOLDS.concurrentAIReports);
      expect(results).toHaveLength(concurrentRequests);
      results.forEach(result => {
        expect(result).toHaveProperty('id');
        expect(result.content).toHaveProperty('predictiveData');
      });

      console.log(`Concurrent predictive report generation took ${duration}ms for ${concurrentRequests} requests`);
    });
  });

  describe('AI Insight Generation Performance', () => {
    it('should generate AI insights quickly', async () => {
      const templateId = 'ai-insights-template';
      const parameters = {
        periodStart: '2025-01-01',
        periodEnd: '2025-01-31',
        includeAI: true,
        focusAreas: ['revenue', 'efficiency', 'risk']
      };

      const startTime = Date.now();

      const result = await reportingService.generateReport({
        templateId,
        parameters
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(AI_PERFORMANCE_THRESHOLDS.aiInsightGeneration);
      expect(result.content.insights).toHaveLength(3); // One insight per focus area
      expect(result.content.insights.every(insight => insight.confidence > 0)).toBe(true);

      console.log(`AI insight generation took ${duration}ms for ${result.content.insights.length} insights`);
    });

    it('should handle complex AI insight generation', async () => {
      const templateId = 'ai-complex-insights-template';
      const parameters = {
        periodStart: '2025-01-01',
        periodEnd: '2025-01-31',
        includeAI: true,
        focusAreas: ['revenue', 'efficiency', 'risk', 'market_trends', 'operational'],
        includeRecommendations: true,
        detailLevel: 'comprehensive'
      };

      const startTime = Date.now();

      const result = await reportingService.generateReport({
        templateId,
        parameters
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(AI_PERFORMANCE_THRESHOLDS.aiInsightGeneration * 1.5);
      expect(result.content.insights.length).toBeGreaterThanOrEqual(5);
      expect(result.content).toHaveProperty('recommendations');
      expect(result.content.recommendations.length).toBeGreaterThan(0);

      console.log(`Complex AI insight generation took ${duration}ms`);
    });
  });

  describe('Compliance Check Performance with AI', () => {
    it('should run AI compliance checks within time limits', async () => {
      const reportId = 'ai-perf-test-report';
      const checkTypes = ['gdpr', 'ai_bias', 'data_privacy', 'content_accuracy'];

      const startTime = Date.now();

      const result = await reportingService.runComplianceCheck(reportId, checkTypes);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(AI_PERFORMANCE_THRESHOLDS.complianceCheckAI);
      expect(result.complianceChecks).toHaveLength(checkTypes.length);
      expect(result.complianceChecks.every(check => check.status !== undefined)).toBe(true);

      console.log(`AI compliance check took ${duration}ms for ${checkTypes.length} checks`);
    });

    it('should handle multiple AI compliance checks efficiently', async () => {
      const reportId = 'ai-perf-test-report';
      const checkTypes = ['gdpr', 'hipaa', 'ccpa', 'ai_bias', 'content_accuracy', 'data_lineage'];

      const startTime = Date.now();

      const result = await reportingService.runComplianceCheck(reportId, checkTypes);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(AI_PERFORMANCE_THRESHOLDS.complianceCheckAI * 1.5);
      expect(result.complianceChecks).toHaveLength(checkTypes.length);

      console.log(`Multiple AI compliance checks took ${duration}ms`);
    });
  });

  describe('Audit Trail Performance with AI Operations', () => {
    it('should retrieve AI audit trails quickly', async () => {
      const reportId = 'ai-perf-test-report';

      const startTime = Date.now();

      const result = await reportingService.getAuditTrail(reportId, {
        limit: 100,
        offset: 0
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(AI_PERFORMANCE_THRESHOLDS.auditTrailAI);
      expect(result).toHaveProperty('auditTrail');
      expect(Array.isArray(result.auditTrail)).toBe(true);

      console.log(`AI audit trail query took ${duration}ms for ${result.auditTrail.length} entries`);
    });

    it('should handle filtered AI audit queries efficiently', async () => {
      const reportId = 'ai-perf-test-report';

      const startTime = Date.now();

      const result = await reportingService.getAuditTrail(reportId, {
        action: 'ai_insight_generated',
        dateFrom: '2025-01-01',
        dateTo: '2025-01-31',
        limit: 50
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(AI_PERFORMANCE_THRESHOLDS.auditTrailAI);
      expect(result.auditTrail.every(log => log.action === 'ai_insight_generated')).toBe(true);

      console.log(`Filtered AI audit query took ${duration}ms`);
    });
  });

  describe('Email Delivery Performance with AI Content', () => {
    it('should send AI-enhanced emails within time limits', async () => {
      const reportId = 'ai-perf-test-report';
      const emailData = {
        to: ['recipient1@example.com', 'recipient2@example.com'],
        subject: 'AI-Enhanced Performance Report',
        body: 'Please find your AI-enhanced report with key insights and recommendations.',
        format: 'pdf',
        includeInsights: true,
        priority: 'high'
      };

      const startTime = Date.now();

      const result = await reportingService.sendReportEmail(reportId, emailData);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(AI_PERFORMANCE_THRESHOLDS.emailDeliveryAI);
      expect(result.success).toBe(true);
      expect(result).toHaveProperty('messageId');

      console.log(`AI-enhanced email delivery took ${duration}ms`);
    });

    it('should handle bulk AI email delivery efficiently', async () => {
      const reportId = 'ai-perf-test-report';
      const bulkEmails = [
        {
          to: ['group1@example.com'],
          subject: 'AI Report for Group 1',
          body: 'Group 1 AI report',
          format: 'pdf'
        },
        {
          to: ['group2@example.com'],
          subject: 'AI Report for Group 2',
          body: 'Group 2 AI report',
          format: 'excel'
        },
        {
          to: ['group3@example.com'],
          subject: 'AI Report for Group 3',
          body: 'Group 3 AI report',
          format: 'csv'
        }
      ];

      const startTime = Date.now();

      const results = await Promise.all(
        bulkEmails.map(emailData => reportingService.sendReportEmail(reportId, emailData))
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(AI_PERFORMANCE_THRESHOLDS.emailDeliveryAI * 2);
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      console.log(`Bulk AI email delivery took ${duration}ms for ${results.length} emails`);
    });
  });

  describe('Memory Usage with AI Processing', () => {
    it('should not have memory leaks during AI report generation', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      const iterations = 25;

      for (let i = 0; i < iterations; i++) {
        await reportingService.generateReport({
          templateId: 'ai-memory-test-template',
          parameters: {
            periodStart: '2025-01-01',
            periodEnd: '2025-01-31',
            includeAI: true
          }
        });

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

      // Allow for some memory increase but not excessive
      expect(memoryIncreaseMB).toBeLessThan(100); // Less than 100MB increase

      console.log(`Memory usage: ${memoryIncreaseMB.toFixed(2)}MB increase after ${iterations} AI report generations`);
    });
  });

  describe('Concurrent AI Operations Performance', () => {
    it('should handle multiple concurrent AI operations efficiently', async () => {
      const operations = [
        // AI report generation
        reportingService.generateReport({
          templateId: 'ai-concurrent-template',
          parameters: { periodStart: '2025-01-01', periodEnd: '2025-01-31', includeAI: true }
        }),
        // Compliance check
        reportingService.runComplianceCheck('ai-concurrent-report', ['gdpr', 'ai_bias']),
        // Audit trail query
        reportingService.getAuditTrail('ai-concurrent-report', { limit: 50 }),
        // Email delivery
        reportingService.sendReportEmail('ai-concurrent-report', {
          to: ['test@example.com'],
          subject: 'Concurrent Test',
          body: 'Test email'
        })
      ];

      const startTime = Date.now();

      const results = await Promise.all(operations);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(AI_PERFORMANCE_THRESHOLDS.concurrentAIReports);
      expect(results).toHaveLength(4);

      // Verify each operation succeeded
      expect(results[0]).toHaveProperty('id'); // Report generation
      expect(results[1]).toHaveProperty('complianceChecks'); // Compliance check
      expect(results[2]).toHaveProperty('auditTrail'); // Audit trail
      expect(results[3]).toHaveProperty('success', true); // Email delivery

      console.log(`Concurrent AI operations took ${duration}ms for ${operations.length} operations`);
    });
  });

  describe('Database Query Performance with AI Data', () => {
    it('should execute complex AI data queries efficiently', async () => {
      const reportId = 'ai-db-perf-test-report';

      // Test complex query with AI data filters
      const startTime = Date.now();

      const result = await reportingService.getAuditTrail(reportId, {
        action: 'ai_insight_generated',
        dateFrom: '2025-01-01',
        dateTo: '2025-01-31',
        limit: 100,
        includeDetails: true
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(AI_PERFORMANCE_THRESHOLDS.auditTrailAI * 1.5);
      expect(result.auditTrail.length).toBeLessThanOrEqual(100);
      expect(result.auditTrail.every(log => log.action === 'ai_insight_generated')).toBe(true);

      console.log(`Complex AI data query took ${duration}ms`);
    });
  });
});

// Helper functions for AI performance test setup
async function setupAIPerformanceTestData() {
  try {
    // Create AI performance test templates
    await ReportTemplate.bulkCreate([
      {
        id: 'ai-perf-test-template',
        name: 'AI Performance Test Template',
        sections: [
          { type: 'summary', dataSource: 'financial', visualization: 'text' },
          { type: 'insights', dataSource: 'ai', visualization: 'text' },
          { type: 'recommendations', dataSource: 'ai', visualization: 'list' }
        ],
        ownerId: 'ai-perf-test-user'
      },
      {
        id: 'ai-large-dataset-template',
        name: 'AI Large Dataset Template',
        sections: [
          { type: 'summary', dataSource: 'financial', visualization: 'text' },
          { type: 'insights', dataSource: 'ai', visualization: 'text' },
          { type: 'predictive', dataSource: 'predictive', visualization: 'chart' }
        ],
        ownerId: 'ai-perf-test-user'
      },
      {
        id: 'ai-high-confidence-template',
        name: 'AI High Confidence Template',
        sections: [
          { type: 'insights', dataSource: 'ai', visualization: 'text' }
        ],
        ownerId: 'ai-perf-test-user'
      },
      {
        id: 'predictive-perf-test-template',
        name: 'Predictive Performance Template',
        sections: [
          { type: 'churn_analysis', dataSource: 'predictive', visualization: 'chart' },
          { type: 'maintenance_forecast', dataSource: 'predictive', visualization: 'table' }
        ],
        ownerId: 'ai-perf-test-user'
      },
      {
        id: 'ai-insights-template',
        name: 'AI Insights Template',
        sections: [
          { type: 'insights', dataSource: 'ai', visualization: 'text' }
        ],
        ownerId: 'ai-perf-test-user'
      },
      {
        id: 'ai-complex-insights-template',
        name: 'AI Complex Insights Template',
        sections: [
          { type: 'insights', dataSource: 'ai', visualization: 'text' },
          { type: 'recommendations', dataSource: 'ai', visualization: 'list' }
        ],
        ownerId: 'ai-perf-test-user'
      },
      {
        id: 'ai-memory-test-template',
        name: 'AI Memory Test Template',
        sections: [
          { type: 'insights', dataSource: 'ai', visualization: 'text' }
        ],
        ownerId: 'ai-perf-test-user'
      },
      {
        id: 'ai-concurrent-template',
        name: 'AI Concurrent Template',
        sections: [
          { type: 'insights', dataSource: 'ai', visualization: 'text' }
        ],
        ownerId: 'ai-perf-test-user'
      }
    ]);

    // Create AI performance test reports
    await GeneratedReport.bulkCreate([
      {
        id: 'ai-perf-test-report',
        templateId: 'ai-perf-test-template',
        status: 'generated',
        aiConfidence: 87,
        content: {
          summary: 'AI performance test report',
          insights: [
            { type: 'trend', title: 'Test Insight', description: 'Test description', confidence: 0.87 }
          ],
          recommendations: [
            { priority: 'high', action: 'Test action', confidence: 0.85 }
          ]
        },
        periodStart: '2025-01-01',
        periodEnd: '2025-01-31'
      },
      {
        id: 'ai-concurrent-report',
        templateId: 'ai-concurrent-template',
        status: 'generated',
        aiConfidence: 85,
        content: { summary: 'Concurrent AI test report' },
        periodStart: '2025-01-01',
        periodEnd: '2025-01-31'
      },
      {
        id: 'ai-db-perf-test-report',
        templateId: 'ai-perf-test-template',
        status: 'generated',
        aiConfidence: 90,
        content: { summary: 'Database performance test report' },
        periodStart: '2025-01-01',
        periodEnd: '2025-01-31'
      }
    ]);

    // Create AI performance test audit logs
    const aiAuditLogs = [];
    for (let i = 0; i < 500; i++) {
      aiAuditLogs.push({
        id: `ai-audit-${i}`,
        action: i % 3 === 0 ? 'ai_insight_generated' : (i % 3 === 1 ? 'viewed' : 'exported'),
        resourceType: 'report',
        resourceId: i % 2 === 0 ? 'ai-perf-test-report' : 'ai-db-perf-test-report',
        userId: 'ai-perf-test-user',
        details: {
          aiModel: i % 2 === 0 ? 'gpt-4' : 'claude-3',
          confidence: 0.8 + Math.random() * 0.2,
          processingTime: 1000 + Math.random() * 2000
        },
        riskLevel: i % 10 === 0 ? 'high' : 'low',
        dataSensitivity: i % 5 === 0 ? 'confidential' : 'internal',
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
      });
    }

    await ReportAuditLog.bulkCreate(aiAuditLogs);

    console.log('AI performance test data setup completed');
  } catch (error) {
    console.error('Failed to setup AI performance test data:', error);
    throw error;
  }
}

async function cleanupAIPerformanceTestData() {
  try {
    await ReportAuditLog.destroy({ where: { userId: 'ai-perf-test-user' } });
    await GeneratedReport.destroy({ where: { templateId: ['ai-perf-test-template', 'ai-large-dataset-template', 'ai-high-confidence-template', 'predictive-perf-test-template', 'ai-insights-template', 'ai-complex-insights-template', 'ai-memory-test-template', 'ai-concurrent-template'] } });
    await ReportTemplate.destroy({ where: { ownerId: 'ai-perf-test-user' } });

    console.log('AI performance test data cleanup completed');
  } catch (error) {
    console.error('Failed to cleanup AI performance test data:', error);
    throw error;
  }
}