const { reportingService } = require('../src/services/reportingService');
const ReportAuditLog = require('../src/models/ReportAuditLog');
const ReportVersion = require('../src/models/ReportVersion');
const ComplianceCheck = require('../src/models/ComplianceCheck');
const GeneratedReport = require('../src/models/GeneratedReport');
const ReportTemplate = require('../src/models/ReportTemplate');

// Mock dependencies
jest.mock('../src/services/auditService');
jest.mock('../src/models/ReportAuditLog');
jest.mock('../src/models/ReportVersion');
jest.mock('../src/models/ComplianceCheck');
jest.mock('../src/models/GeneratedReport');
jest.mock('../src/models/ReportTemplate');

// Mock AI service for insight generation
jest.mock('../src/services/aiService', () => ({
  generateInsights: jest.fn(),
  analyzeData: jest.fn(),
  createSummary: jest.fn()
}));

describe('ReportingService - AI Enhanced', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AI Insight Generation', () => {
    it('should generate AI insights with confidence scores', async () => {
      const mockTemplate = {
        id: 'template-1',
        name: 'AI Enhanced Template',
        sections: [
          { type: 'summary', dataSource: 'financial', visualization: 'text' },
          { type: 'insights', dataSource: 'ai', visualization: 'text' }
        ]
      };

      const mockAIInsights = {
        summary: 'AI-generated executive summary with key insights',
        insights: [
          {
            type: 'trend',
            title: 'Revenue Growth Trend',
            description: 'Revenue has increased by 15% compared to last period',
            confidence: 0.92,
            dataSource: 'financial'
          },
          {
            type: 'anomaly',
            title: 'Maintenance Cost Anomaly',
            description: 'Maintenance costs are 25% higher than expected',
            confidence: 0.88,
            dataSource: 'maintenance'
          }
        ],
        recommendations: [
          {
            priority: 'high',
            action: 'Investigate maintenance cost increase',
            rationale: 'Potential efficiency improvements available',
            impact: 'Cost savings of $5,000/month',
            confidence: 0.85
          }
        ]
      };

      const mockAIService = require('../src/services/aiService');
      mockAIService.generateInsights.mockResolvedValue(mockAIInsights);
      mockAIService.analyzeData.mockResolvedValue({ trends: [], anomalies: [] });
      mockAIService.createSummary.mockResolvedValue(mockAIInsights.summary);

      ReportTemplate.findByPk.mockResolvedValue(mockTemplate);
      GeneratedReport.create.mockResolvedValue({
        id: 'report-1',
        templateId: 'template-1',
        status: 'generated',
        aiConfidence: 87,
        content: mockAIInsights
      });

      const params = {
        templateId: 'template-1',
        parameters: {
          periodStart: '2025-01-01',
          periodEnd: '2025-01-31',
          includeAI: true
        }
      };

      const result = await reportingService.generateReport(params);

      expect(mockAIService.generateInsights).toHaveBeenCalled();
      expect(mockAIService.analyzeData).toHaveBeenCalled();
      expect(mockAIService.createSummary).toHaveBeenCalled();
      expect(result.aiConfidence).toBeGreaterThan(80);
      expect(result.content.insights).toHaveLength(2);
      expect(result.content.recommendations).toHaveLength(1);
    });

    it('should handle AI service failures gracefully', async () => {
      const mockTemplate = {
        id: 'template-1',
        name: 'Template with AI',
        sections: [{ type: 'insights', dataSource: 'ai', visualization: 'text' }]
      };

      const mockAIService = require('../src/services/aiService');
      mockAIService.generateInsights.mockRejectedValue(new Error('AI service unavailable'));

      ReportTemplate.findByPk.mockResolvedValue(mockTemplate);
      GeneratedReport.create.mockResolvedValue({
        id: 'report-1',
        templateId: 'template-1',
        status: 'generated',
        aiConfidence: 0,
        content: {
          summary: 'Report generated without AI insights due to service unavailability',
          insights: [],
          recommendations: []
        }
      });

      const params = {
        templateId: 'template-1',
        parameters: { periodStart: '2025-01-01', periodEnd: '2025-01-31' }
      };

      const result = await reportingService.generateReport(params);

      expect(result.aiConfidence).toBe(0);
      expect(result.content.insights).toHaveLength(0);
      expect(result.status).toBe('generated');
    });

    it('should validate AI confidence thresholds', async () => {
      const mockTemplate = {
        id: 'template-1',
        name: 'High Confidence Template',
        sections: [{ type: 'insights', dataSource: 'ai', visualization: 'text' }]
      };

      const mockAIInsights = {
        summary: 'High confidence summary',
        insights: [
          {
            type: 'trend',
            title: 'High Confidence Insight',
            description: 'Very reliable insight',
            confidence: 0.95,
            dataSource: 'financial'
          }
        ],
        recommendations: []
      };

      const mockAIService = require('../src/services/aiService');
      mockAIService.generateInsights.mockResolvedValue(mockAIInsights);

      ReportTemplate.findByPk.mockResolvedValue(mockTemplate);
      GeneratedReport.create.mockResolvedValue({
        id: 'report-1',
        templateId: 'template-1',
        status: 'generated',
        aiConfidence: 95,
        content: mockAIInsights
      });

      const params = {
        templateId: 'template-1',
        parameters: {
          periodStart: '2025-01-01',
          periodEnd: '2025-01-31',
          minConfidence: 0.9
        }
      };

      const result = await reportingService.generateReport(params);

      expect(result.aiConfidence).toBeGreaterThanOrEqual(90);
      expect(result.content.insights[0].confidence).toBeGreaterThanOrEqual(0.9);
    });
  });

  describe('Predictive Analytics Integration', () => {
    it('should integrate churn prediction data into reports', async () => {
      const mockTemplate = {
        id: 'template-1',
        name: 'Predictive Report Template',
        sections: [
          { type: 'churn_analysis', dataSource: 'predictive', visualization: 'chart' }
        ]
      };

      const mockPredictiveData = {
        churnRisk: {
          high: 15,
          medium: 25,
          low: 60
        },
        predictions: [
          {
            tenantId: 'tenant-1',
            churnProbability: 0.85,
            riskFactors: ['late_payments', 'complaints'],
            recommendedActions: ['personal_contact', 'discount_offer']
          }
        ]
      };

      // Mock predictive service
      jest.doMock('../src/services/predictiveService', () => ({
        getChurnPredictions: jest.fn().mockResolvedValue(mockPredictiveData)
      }));

      ReportTemplate.findByPk.mockResolvedValue(mockTemplate);
      GeneratedReport.create.mockResolvedValue({
        id: 'report-1',
        templateId: 'template-1',
        status: 'generated',
        aiConfidence: 82,
        content: { predictiveData: mockPredictiveData }
      });

      const params = {
        templateId: 'template-1',
        parameters: {
          periodStart: '2025-01-01',
          periodEnd: '2025-01-31',
          includePredictive: true
        }
      };

      const result = await reportingService.generateReport(params);

      expect(result.content.predictiveData).toBeDefined();
      expect(result.content.predictiveData.churnRisk).toBeDefined();
      expect(result.content.predictiveData.predictions).toHaveLength(1);
    });

    it('should integrate maintenance forecasting', async () => {
      const mockTemplate = {
        id: 'template-1',
        name: 'Maintenance Forecast Template',
        sections: [
          { type: 'maintenance_forecast', dataSource: 'predictive', visualization: 'chart' }
        ]
      };

      const mockMaintenanceData = {
        forecasts: [
          {
            propertyId: 'prop-1',
            predictedIssues: [
              { type: 'plumbing', probability: 0.7, estimatedCost: 2500, timeframe: '3_months' },
              { type: 'electrical', probability: 0.4, estimatedCost: 1800, timeframe: '6_months' }
            ]
          }
        ],
        preventiveActions: [
          {
            action: 'Regular inspection',
            cost: 500,
            expectedSavings: 3000,
            roi: 6.0
          }
        ]
      };

      jest.doMock('../src/services/maintenanceService', () => ({
        getMaintenanceForecasts: jest.fn().mockResolvedValue(mockMaintenanceData)
      }));

      ReportTemplate.findByPk.mockResolvedValue(mockTemplate);
      GeneratedReport.create.mockResolvedValue({
        id: 'report-1',
        templateId: 'template-1',
        status: 'generated',
        aiConfidence: 78,
        content: { maintenanceData: mockMaintenanceData }
      });

      const params = {
        templateId: 'template-1',
        parameters: {
          periodStart: '2025-01-01',
          periodEnd: '2025-01-31',
          includeMaintenance: true
        }
      };

      const result = await reportingService.generateReport(params);

      expect(result.content.maintenanceData).toBeDefined();
      expect(result.content.maintenanceData.forecasts).toHaveLength(1);
      expect(result.content.maintenanceData.preventiveActions).toHaveLength(1);
    });
  });

  describe('Email Delivery with AI Insights', () => {
    it('should send reports with AI-generated email content', async () => {
      const mockReport = {
        id: 'report-1',
        templateId: 'template-1',
        content: {
          summary: 'Monthly performance report',
          insights: [{ title: 'Key Insight', description: 'Important finding' }]
        }
      };

      const mockEmailData = {
        to: ['recipient@example.com'],
        subject: 'AI-Enhanced Monthly Report',
        body: 'Dear recipient,\n\nHere is your AI-enhanced monthly report with key insights...',
        attachments: [{ filename: 'report.pdf', content: 'mock-pdf-content' }]
      };

      // Mock email service
      jest.doMock('../src/services/emailService', () => ({
        sendReportEmail: jest.fn().mockResolvedValue({ success: true, messageId: 'msg-123' })
      }));

      GeneratedReport.findByPk.mockResolvedValue(mockReport);

      const result = await reportingService.sendReportEmail('report-1', mockEmailData);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg-123');
    });

    it('should handle email delivery failures', async () => {
      const mockEmailData = {
        to: ['recipient@example.com'],
        subject: 'Report',
        body: 'Report content',
        attachments: []
      };

      jest.doMock('../src/services/emailService', () => ({
        sendReportEmail: jest.fn().mockRejectedValue(new Error('SMTP error'))
      }));

      await expect(reportingService.sendReportEmail('report-1', mockEmailData))
        .rejects
        .toThrow('SMTP error');
    });
  });

  describe('Audit Trail for AI Operations', () => {
    it('should create audit entries for AI insight generation', async () => {
      const mockAuditEntry = {
        id: 'audit-1',
        action: 'ai_insight_generated',
        resourceType: 'report',
        resourceId: 'report-1',
        userId: 'user-1',
        details: {
          aiModel: 'gpt-4',
          confidence: 0.87,
          insightsGenerated: 3,
          processingTime: 2500
        },
        riskLevel: 'low',
        dataSensitivity: 'internal'
      };

      ReportAuditLog.create.mockResolvedValue(mockAuditEntry);

      const auditData = {
        action: 'ai_insight_generated',
        resourceType: 'report',
        resourceId: 'report-1',
        userId: 'user-1',
        details: {
          aiModel: 'gpt-4',
          confidence: 0.87,
          insightsGenerated: 3,
          processingTime: 2500
        }
      };

      const result = await reportingService.createAuditEntry(auditData);

      expect(ReportAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ai_insight_generated',
          resourceType: 'report',
          details: expect.objectContaining({
            aiModel: 'gpt-4',
            confidence: 0.87
          })
        })
      );

      expect(result).toEqual(mockAuditEntry);
    });

    it('should audit AI recommendation acceptance', async () => {
      const mockAuditEntry = {
        id: 'audit-2',
        action: 'ai_recommendation_accepted',
        resourceType: 'report',
        resourceId: 'report-1',
        userId: 'user-1',
        details: {
          recommendationId: 'rec-1',
          recommendationType: 'cost_savings',
          estimatedImpact: 5000,
          acceptanceReason: 'Approved for implementation'
        },
        riskLevel: 'medium',
        dataSensitivity: 'confidential'
      };

      ReportAuditLog.create.mockResolvedValue(mockAuditEntry);

      const auditData = {
        action: 'ai_recommendation_accepted',
        resourceType: 'report',
        resourceId: 'report-1',
        userId: 'user-1',
        details: {
          recommendationId: 'rec-1',
          recommendationType: 'cost_savings',
          estimatedImpact: 5000,
          acceptanceReason: 'Approved for implementation'
        }
      };

      const result = await reportingService.createAuditEntry(auditData);

      expect(result.details.recommendationType).toBe('cost_savings');
      expect(result.riskLevel).toBe('medium');
    });
  });

  describe('Compliance Checks for AI Content', () => {
    it('should run compliance checks on AI-generated content', async () => {
      const mockComplianceChecks = [
        {
          id: 'check-1',
          checkType: 'gdpr',
          status: 'passed',
          severity: 'low',
          findings: [],
          violations: []
        },
        {
          id: 'check-2',
          checkType: 'ai_bias',
          status: 'passed',
          severity: 'low',
          findings: [],
          violations: []
        }
      ];

      ComplianceCheck.create
        .mockResolvedValueOnce(mockComplianceChecks[0])
        .mockResolvedValueOnce(mockComplianceChecks[1]);

      const result = await reportingService.runComplianceCheck('report-1', ['gdpr', 'ai_bias']);

      expect(ComplianceCheck.create).toHaveBeenCalledTimes(2);
      expect(result.complianceChecks).toHaveLength(2);
      expect(result.complianceChecks[0].checkType).toBe('gdpr');
      expect(result.complianceChecks[1].checkType).toBe('ai_bias');
    });

    it('should detect AI content compliance violations', async () => {
      const mockComplianceCheck = {
        id: 'check-1',
        checkType: 'ai_bias',
        status: 'failed',
        severity: 'high',
        findings: [
          {
            issue: 'Potential bias in tenant selection recommendations',
            description: 'AI model may favor certain demographic groups',
            recommendation: 'Implement bias detection and mitigation'
          }
        ],
        violations: ['ai_bias_detected']
      };

      ComplianceCheck.create.mockResolvedValue(mockComplianceCheck);

      const result = await reportingService.runComplianceCheck('report-1', ['ai_bias']);

      expect(result.complianceChecks[0].status).toBe('failed');
      expect(result.complianceChecks[0].severity).toBe('high');
      expect(result.complianceChecks[0].findings).toHaveLength(1);
      expect(result.complianceChecks[0].violations).toContain('ai_bias_detected');
    });
  });

  // ... existing tests ...
});