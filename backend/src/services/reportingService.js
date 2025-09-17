/**
 * AI-Powered Reporting Service
 * Generates automated reports with predictive insights and actionable recommendations
 */

const { Op } = require('sequelize');
const fs = require('fs').promises;
const path = require('path');
const { ReportTemplate, GeneratedReport, Property, Tenant, MaintenanceHistory, User } = require('../models');
const analyticsService = require('./analyticsService');
const riskAssessmentService = require('./riskAssessmentService');
const marketDataService = require('../services/marketDataService');
const notificationService = require('./notificationService');
const auditService = require('./auditService');

class ReportingService {
  constructor() {
    this.templates = new Map();
    this.insightGenerators = new Map();
    this.reportCache = new Map();
    this.initializeTemplates();
    this.initializeInsightGenerators();
  }

  /**
   * Initialize default report templates
   */
  initializeTemplates() {
    this.templates.set('executive-summary', {
      name: 'Executive Summary',
      type: 'monthly',
      sections: [
        'portfolio-overview',
        'financial-performance',
        'risk-summary',
        'predictive-insights',
        'actionable-recommendations'
      ],
      dataSources: ['properties', 'tenants', 'maintenance', 'financial', 'market'],
      visualizations: ['kpi-dashboard', 'trend-charts', 'risk-heatmap']
    });

    this.templates.set('operational-report', {
      name: 'Operational Report',
      type: 'weekly',
      sections: [
        'maintenance-overview',
        'tenant-activity',
        'system-performance',
        'predictive-alerts'
      ],
      dataSources: ['maintenance', 'tenants', 'system-metrics'],
      visualizations: ['maintenance-timeline', 'tenant-churn-trends']
    });

    this.templates.set('financial-report', {
      name: 'Financial Performance Report',
      type: 'quarterly',
      sections: [
        'revenue-analysis',
        'expense-breakdown',
        'market-comparison',
        'forecast-projections'
      ],
      dataSources: ['financial', 'market', 'properties'],
      visualizations: ['revenue-trends', 'market-comparison-chart']
    });
  }

  /**
   * Initialize AI insight generators for different data types
   */
  initializeInsightGenerators() {
    this.insightGenerators.set('portfolio-performance', this.generatePortfolioInsights.bind(this));
    this.insightGenerators.set('maintenance-trends', this.generateMaintenanceInsights.bind(this));
    this.insightGenerators.set('tenant-behavior', this.generateTenantInsights.bind(this));
    this.insightGenerators.set('market-analysis', this.generateMarketInsights.bind(this));
    this.insightGenerators.set('risk-assessment', this.generateRiskInsights.bind(this));
  }

  /**
   * Generate comprehensive report with AI insights
   */
  async generateReport(templateId, parameters = {}, auditContext = {}) {
    const startTime = Date.now();
    let report = null;

    try {
      const template = this.templates.get(templateId);
      if (!template) {
        throw new Error(`Report template '${templateId}' not found`);
      }

      const reportData = await this.gatherReportData(template, parameters);
      const insights = await this.generateAIInsights(template, reportData);
      const recommendations = await this.generateRecommendations(insights, reportData);

      const processingTime = Date.now() - startTime;
      const overallConfidence = this.calculateOverallConfidence(insights);

      report = {
        id: this.generateReportId(),
        templateId,
        templateName: template.name,
        generatedAt: new Date(),
        parameters,
        data: reportData,
        insights,
        recommendations,
        metadata: {
          dataSources: template.dataSources,
          confidence: overallConfidence,
          processingTime,
          dataSensitivity: this.determineDataSensitivity(reportData),
          version: 1
        }
      };

      // Run compliance checks before saving
      const complianceResult = await auditService.runComplianceChecks(report, 'initial');
      report.metadata.complianceStatus = complianceResult.status;
      report.metadata.complianceIssues = complianceResult.issues;

      // Cache report for quick access
      this.reportCache.set(report.id, report);

      // Save to database
      await this.saveGeneratedReport(report);

      // Create initial version for change tracking
      await auditService.createReportVersion({
        reportId: report.id,
        content: report,
        changeType: 'initial',
        changeReason: 'Initial report generation',
        aiConfidence: overallConfidence,
        dataSources: template.dataSources,
        createdBy: auditContext.userId || 'system'
      });

      // Log audit event
      if (auditContext.userId) {
        await auditService.logReportEvent({
          reportId: report.id,
          templateId,
          userId: auditContext.userId,
          action: 'created',
          resourceType: 'report',
          resourceId: report.id,
          details: {
            templateName: template.name,
            dataSources: template.dataSources,
            insightCount: insights.length,
            recommendationCount: recommendations.length,
            complianceStatus: complianceResult.status
          },
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
          aiConfidence: overallConfidence,
          processingTime,
          dataSensitivity: report.metadata.dataSensitivity
        });
      }

      return report;
    } catch (error) {
      console.error('Error generating report:', error);

      // Log error audit event if we have context
      if (auditContext.userId && report) {
        await auditService.logReportEvent({
          reportId: report?.id,
          templateId,
          userId: auditContext.userId,
          action: 'created',
          resourceType: 'report',
          resourceId: report?.id || 'failed',
          details: {
            error: error.message,
            processingTime: Date.now() - startTime
          },
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
          riskLevel: 'medium'
        });
      }

      throw new Error(`Failed to generate report: ${error.message}`);
    }
  }

  /**
   * Gather data from multiple sources based on template requirements
   */
  async gatherReportData(template, parameters) {
    const data = {};

    for (const source of template.dataSources) {
      switch (source) {
        case 'properties':
          data.properties = await this.getPropertyData(parameters);
          break;
        case 'tenants':
          data.tenants = await this.getTenantData(parameters);
          break;
        case 'maintenance':
          data.maintenance = await this.getMaintenanceData(parameters);
          break;
        case 'financial':
          data.financial = await this.getFinancialData(parameters);
          break;
        case 'market':
          data.market = await this.getMarketData(parameters);
          break;
        default:
          console.warn(`Unknown data source: ${source}`);
      }
    }

    return data;
  }

  /**
   * Generate AI-powered insights from gathered data
   */
  async generateAIInsights(template, data) {
    const insights = [];

    for (const section of template.sections) {
      const generator = this.insightGenerators.get(section);
      if (generator) {
        try {
          const sectionInsights = await generator(data, template);
          insights.push(...sectionInsights);
        } catch (error) {
          console.error(`Error generating insights for section ${section}:`, error);
        }
      }
    }

    return insights;
  }

  /**
   * Generate actionable recommendations based on insights
   */
  async generateRecommendations(insights, data) {
    const recommendations = [];

    // Group insights by priority and impact
    const highPriorityInsights = insights.filter(i => i.priority === 'high');
    const mediumPriorityInsights = insights.filter(i => i.priority === 'medium');

    // Generate recommendations for high-priority insights
    for (const insight of highPriorityInsights) {
      const recommendation = await this.createRecommendation(insight, data);
      if (recommendation) {
        recommendations.push(recommendation);
      }
    }

    // Generate recommendations for medium-priority insights
    for (const insight of mediumPriorityInsights) {
      const recommendation = await this.createRecommendation(insight, data);
      if (recommendation) {
        recommendations.push(recommendation);
      }
    }

    // Sort by priority and impact
    return recommendations.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority === 'high' ? -1 : 1;
      }
      return b.impact - a.impact;
    });
  }

  /**
   * Generate portfolio performance insights
   */
  async generatePortfolioInsights(data, template) {
    const insights = [];

    if (data.properties && data.financial) {
      const portfolioMetrics = await analyticsService.calculatePortfolioMetrics(data.properties);

      // Occupancy rate insight
      if (portfolioMetrics.occupancyRate < 85) {
        insights.push({
          id: 'occupancy-low',
          type: 'portfolio-performance',
          title: 'Low Portfolio Occupancy Rate',
          description: `Current occupancy rate is ${portfolioMetrics.occupancyRate.toFixed(1)}%, below target of 95%.`,
          priority: 'high',
          impact: 8,
          confidence: 0.95,
          data: portfolioMetrics,
          recommendations: ['Implement targeted marketing campaigns', 'Review pricing strategy']
        });
      }

      // Revenue trend insight
      const revenueTrend = this.analyzeTrend(data.financial.revenue);
      if (revenueTrend.direction === 'declining') {
        insights.push({
          id: 'revenue-declining',
          type: 'portfolio-performance',
          title: 'Revenue Trend Declining',
          description: `Revenue has declined by ${Math.abs(revenueTrend.changePercent).toFixed(1)}% over the last period.`,
          priority: 'high',
          impact: 9,
          confidence: 0.88,
          data: revenueTrend,
          recommendations: ['Analyze market conditions', 'Review competitive positioning']
        });
      }
    }

    return insights;
  }

  /**
   * Generate maintenance-related insights
   */
  async generateMaintenanceInsights(data, template) {
    const insights = [];

    if (data.maintenance) {
      const maintenanceMetrics = await analyticsService.analyzeMaintenanceTrends(data.maintenance);

      // Preventive maintenance opportunity
      if (maintenanceMetrics.preventiveRatio < 0.6) {
        insights.push({
          id: 'preventive-maintenance-low',
          type: 'maintenance-trends',
          title: 'Low Preventive Maintenance Ratio',
          description: `Only ${maintenanceMetrics.preventiveRatio.toFixed(1)}% of maintenance is preventive, increasing risk of costly repairs.`,
          priority: 'medium',
          impact: 7,
          confidence: 0.92,
          data: maintenanceMetrics,
          recommendations: ['Implement predictive maintenance program', 'Schedule regular inspections']
        });
      }

      // Maintenance cost trend
      const costTrend = this.analyzeTrend(data.maintenance.map(m => m.cost));
      if (costTrend.direction === 'increasing' && costTrend.changePercent > 15) {
        insights.push({
          id: 'maintenance-costs-rising',
          type: 'maintenance-trends',
          title: 'Maintenance Costs Increasing',
          description: `Maintenance costs have increased by ${costTrend.changePercent.toFixed(1)}% over the analysis period.`,
          priority: 'medium',
          impact: 6,
          confidence: 0.85,
          data: costTrend,
          recommendations: ['Review maintenance contracts', 'Implement cost control measures']
        });
      }
    }

    return insights;
  }

  /**
   * Generate tenant behavior insights
   */
  async generateTenantInsights(data, template) {
    const insights = [];

    if (data.tenants) {
      // Analyze churn risk patterns
      const churnAnalysis = await analyticsService.analyzeChurnPatterns(data.tenants);

      if (churnAnalysis.highRiskCount > 0) {
        insights.push({
          id: 'high-churn-risk',
          type: 'tenant-behavior',
          title: 'High Churn Risk Detected',
          description: `${churnAnalysis.highRiskCount} tenants are at high risk of churning, representing potential revenue loss.`,
          priority: 'high',
          impact: 8,
          confidence: 0.90,
          data: churnAnalysis,
          recommendations: ['Implement retention campaigns', 'Address tenant satisfaction issues']
        });
      }

      // Lease renewal patterns
      const renewalRate = churnAnalysis.renewalRate;
      if (renewalRate < 80) {
        insights.push({
          id: 'low-renewal-rate',
          type: 'tenant-behavior',
          title: 'Low Lease Renewal Rate',
          description: `Lease renewal rate is ${renewalRate.toFixed(1)}%, below industry average of 85%.`,
          priority: 'medium',
          impact: 7,
          confidence: 0.87,
          data: { renewalRate },
          recommendations: ['Improve tenant experience', 'Review lease terms and incentives']
        });
      }
    }

    return insights;
  }

  /**
   * Generate market analysis insights
   */
  async generateMarketInsights(data, template) {
    const insights = [];

    if (data.market) {
      const marketAnalysis = await analyticsService.analyzeMarketTrends(data.market);

      // Market value changes
      if (marketAnalysis.averageValueChange > 10) {
        insights.push({
          id: 'market-value-increasing',
          type: 'market-analysis',
          title: 'Property Values Increasing',
          description: `Local property values have increased by ${marketAnalysis.averageValueChange.toFixed(1)}% in the last quarter.`,
          priority: 'medium',
          impact: 6,
          confidence: 0.82,
          data: marketAnalysis,
          recommendations: ['Consider rent increases', 'Review investment opportunities']
        });
      }

      // Competitive analysis
      if (marketAnalysis.competitivePosition === 'below-average') {
        insights.push({
          id: 'competitive-position-weak',
          type: 'market-analysis',
          title: 'Weak Competitive Position',
          description: 'Portfolio rental rates are below market average, indicating potential for rate optimization.',
          priority: 'medium',
          impact: 5,
          confidence: 0.78,
          data: marketAnalysis,
          recommendations: ['Conduct competitive analysis', 'Adjust pricing strategy']
        });
      }
    }

    return insights;
  }

  /**
   * Generate risk assessment insights
   */
  async generateRiskInsights(data, template) {
    const insights = [];

    if (data.properties) {
      const riskAnalysis = await riskAssessmentService.analyzePortfolioRisk(data.properties);

      // High-risk properties
      const highRiskProperties = riskAnalysis.properties.filter(p => p.riskLevel === 'high');
      if (highRiskProperties.length > 0) {
        insights.push({
          id: 'high-risk-properties',
          type: 'risk-assessment',
          title: 'High-Risk Properties Identified',
          description: `${highRiskProperties.length} properties have been identified as high-risk, requiring immediate attention.`,
          priority: 'high',
          impact: 9,
          confidence: 0.95,
          data: { highRiskProperties, totalProperties: riskAnalysis.properties.length },
          recommendations: ['Conduct detailed risk assessments', 'Implement mitigation strategies']
        });
      }

      // Risk trend analysis
      if (riskAnalysis.overallTrend === 'increasing') {
        insights.push({
          id: 'portfolio-risk-increasing',
          type: 'risk-assessment',
          title: 'Portfolio Risk Increasing',
          description: 'Overall portfolio risk has been trending upward, indicating need for proactive risk management.',
          priority: 'medium',
          impact: 7,
          confidence: 0.88,
          data: riskAnalysis,
          recommendations: ['Review risk mitigation strategies', 'Enhance monitoring systems']
        });
      }
    }

    return insights;
  }

  /**
   * Create specific recommendation from insight
   */
  async createRecommendation(insight, data) {
    const recommendation = {
      id: `rec-${insight.id}`,
      insightId: insight.id,
      title: `Action Required: ${insight.title}`,
      description: this.generateRecommendationDescription(insight),
      priority: insight.priority,
      impact: insight.impact,
      effort: this.estimateEffort(insight),
      timeline: this.estimateTimeline(insight),
      actions: insight.recommendations || [],
      metrics: this.defineSuccessMetrics(insight),
      generatedAt: new Date(),
      confidence: insight.confidence
    };

    return recommendation;
  }

  /**
   * Generate natural language description for recommendation
   */
  generateRecommendationDescription(insight) {
    // This would use AI/NLP to generate more sophisticated descriptions
    // For now, return a structured description
    return `Based on the insight "${insight.description}", we recommend taking the following actions to address this issue and improve performance.`;
  }

  /**
   * Estimate implementation effort for recommendation
   */
  estimateEffort(insight) {
    // Simple effort estimation based on insight type and impact
    const baseEffort = {
      'portfolio-performance': 3,
      'maintenance-trends': 2,
      'tenant-behavior': 2,
      'market-analysis': 1,
      'risk-assessment': 4
    };

    const typeEffort = baseEffort[insight.type] || 2;
    const impactMultiplier = insight.impact / 5;

    return Math.round(typeEffort * impactMultiplier);
  }

  /**
   * Estimate timeline for recommendation implementation
   */
  estimateTimeline(insight) {
    const effort = this.estimateEffort(insight);

    if (effort <= 2) return '1-2 weeks';
    if (effort <= 3) return '2-4 weeks';
    return '1-2 months';
  }

  /**
   * Define success metrics for recommendation
   */
  defineSuccessMetrics(insight) {
    const metrics = {
      'occupancy-low': ['occupancy_rate', 'marketing_roi'],
      'revenue-declining': ['revenue_growth', 'profit_margin'],
      'preventive-maintenance-low': ['maintenance_cost_ratio', 'downtime_reduction'],
      'high-churn-risk': ['churn_rate', 'retention_rate'],
      'market-value-increasing': ['rental_rate_vs_market', 'noi_growth']
    };

    return metrics[insight.id] || ['kpi_improvement'];
  }

  /**
   * Analyze trend in data series
   */
  analyzeTrend(data) {
    if (!Array.isArray(data) || data.length < 2) {
      return { direction: 'stable', changePercent: 0 };
    }

    const recent = data.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const previous = data.slice(-6, -3).reduce((a, b) => a + b, 0) / 3;

    const changePercent = ((recent - previous) / previous) * 100;
    const direction = changePercent > 5 ? 'increasing' :
                     changePercent < -5 ? 'declining' : 'stable';

    return { direction, changePercent, recent, previous };
  }

  /**
   * Calculate overall confidence score for insights
   */
  calculateOverallConfidence(insights) {
    if (insights.length === 0) return 0;

    const totalConfidence = insights.reduce((sum, insight) => sum + insight.confidence, 0);
    return totalConfidence / insights.length;
  }

  /**
   * Determine data sensitivity level based on content
   */
  determineDataSensitivity(data) {
    // Check for sensitive data patterns
    const dataString = JSON.stringify(data);

    // Restricted data patterns (highest sensitivity)
    if (/\b\d{3}-\d{2}-\d{4}\b/.test(dataString)) { // SSN
      return 'restricted';
    }

    // Confidential data patterns
    if (/\b\d{4} \d{4} \d{4} \d{4}\b/.test(dataString)) { // Credit card
      return 'confidential';
    }

    // Check for financial data
    if (data.financial && (data.financial.revenue || data.financial.expenses)) {
      return 'confidential';
    }

    // Check for personal tenant data
    if (data.tenants && data.tenants.length > 0) {
      const hasPersonalData = data.tenants.some(tenant =>
        tenant.email || tenant.phone || tenant.ssn
      );
      if (hasPersonalData) {
        return 'confidential';
      }
    }

    // Default to internal
    return 'internal';
  }

  /**
   * Generate unique report ID
   */
  generateReportId() {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save generated report to database
   */
  async saveGeneratedReport(report) {
    try {
      await GeneratedReport.create({
        id: report.id,
        templateId: report.templateId,
        templateName: report.templateName,
        generatedAt: report.generatedAt,
        parameters: JSON.stringify(report.parameters),
        data: JSON.stringify(report.data),
        insights: JSON.stringify(report.insights),
        recommendations: JSON.stringify(report.recommendations),
        metadata: JSON.stringify(report.metadata)
      });
    } catch (error) {
      console.error('Error saving generated report:', error);
      throw error;
    }
  }

  /**
   * Get property data for reporting
   */
  async getPropertyData(parameters) {
    const whereClause = {};
    if (parameters.propertyIds) {
      whereClause.id = { [Op.in]: parameters.propertyIds };
    }
    if (parameters.dateRange) {
      // Add date filtering logic
    }

    return await Property.findAll({ where: whereClause });
  }

  /**
   * Get tenant data for reporting
   */
  async getTenantData(parameters) {
    const whereClause = {};
    if (parameters.tenantIds) {
      whereClause.id = { [Op.in]: parameters.tenantIds };
    }

    return await Tenant.findAll({ where: whereClause });
  }

  /**
   * Get maintenance data for reporting
   */
  async getMaintenanceData(parameters) {
    const whereClause = {};
    if (parameters.propertyIds) {
      whereClause.propertyId = { [Op.in]: parameters.propertyIds };
    }
    if (parameters.dateRange) {
      whereClause.scheduledDate = {
        [Op.between]: [parameters.dateRange.start, parameters.dateRange.end]
      };
    }

    return await MaintenanceHistory.findAll({ where: whereClause });
  }

  /**
   * Get financial data for reporting
   */
  async getFinancialData(parameters) {
    // This would integrate with financial service
    // For now, return mock data structure
    return {
      revenue: [],
      expenses: [],
      profit: [],
      dateRange: parameters.dateRange
    };
  }

  /**
   * Get market data for reporting
   */
  async getMarketData(parameters) {
    // This would integrate with market data service
    // For now, return mock data structure
    return {
      propertyValues: [],
      rentalRates: [],
      marketTrends: [],
      comparables: []
    };
  }

  /**
   * Export report in specified format
   */
  async exportReport(reportId, format = 'pdf', auditContext = {}) {
    const report = this.reportCache.get(reportId) ||
                    await GeneratedReport.findByPk(reportId);

    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    let exportResult;
    const startTime = Date.now();

    try {
      switch (format) {
        case 'pdf':
          exportResult = await this.exportToPDF(report);
          break;
        case 'csv':
          exportResult = await this.exportToCSV(report);
          break;
        case 'excel':
          exportResult = await this.exportToExcel(report);
          break;
        case 'json':
          exportResult = await this.exportToJSON(report);
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      const processingTime = Date.now() - startTime;

      // Log export audit event
      if (auditContext.userId) {
        await auditService.logReportEvent({
          reportId,
          userId: auditContext.userId,
          action: 'exported',
          resourceType: 'export',
          resourceId: `${reportId}_${format}_${Date.now()}`,
          details: {
            format,
            fileSize: exportResult.size,
            exportType: 'download'
          },
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
          processingTime,
          dataSensitivity: report.metadata?.dataSensitivity || 'internal'
        });
      }

      return exportResult;
    } catch (error) {
      // Log failed export
      if (auditContext.userId) {
        await auditService.logReportEvent({
          reportId,
          userId: auditContext.userId,
          action: 'exported',
          resourceType: 'export',
          resourceId: `${reportId}_${format}_failed`,
          details: {
            format,
            error: error.message,
            exportType: 'download'
          },
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
          riskLevel: 'low'
        });
      }
      throw error;
    }
  }

  /**
   * Export report to PDF format
   */
  async exportToPDF(report) {
    // Implementation would use a PDF generation library like pdfkit or puppeteer
    // For now, return mock implementation
    return {
      format: 'pdf',
      filename: `${report.id}.pdf`,
      data: Buffer.from('PDF content would be generated here'),
      size: 1024
    };
  }

  /**
   * Export report to CSV format
   */
  async exportToCSV(report) {
    // Implementation would convert report data to CSV
    // For now, return mock implementation
    return {
      format: 'csv',
      filename: `${report.id}.csv`,
      data: Buffer.from('CSV content would be generated here'),
      size: 512
    };
  }

  /**
   * Export report to Excel format
   */
  async exportToExcel(report) {
    // Implementation would use a library like exceljs
    // For now, return mock implementation
    return {
      format: 'excel',
      filename: `${report.id}.xlsx`,
      data: Buffer.from('Excel content would be generated here'),
      size: 2048
    };
  }

  /**
   * Export report to JSON format
   */
  async exportToJSON(report) {
    return {
      format: 'json',
      filename: `${report.id}.json`,
      data: Buffer.from(JSON.stringify(report, null, 2)),
      size: JSON.stringify(report).length
    };
  }

  /**
   * Deliver report by email to specified recipients
   */
  async deliverReportByEmail(reportId, recipientEmails, options = {}, auditContext = {}) {
    const report = await GeneratedReport.findByPk(reportId, {
      include: [
        {
          model: ReportTemplate,
          as: 'template'
        },
        {
          model: User,
          as: 'generatedBy',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    if (!report) {
      throw new Error('Report not found');
    }

    const {
      subject = `AI Report: ${report.title}`,
      message = 'Please find your AI-generated report attached.',
      priority = 'normal',
      includeInsights = true,
      includeRecommendations = true
    } = options;

    // Generate report content
    const reportContent = await this.generateReportContent(report, {
      includeInsights,
      includeRecommendations
    });

    // Prepare email content
    const emailContent = {
      subject,
      html: this.generateReportEmailTemplate(report, reportContent, message),
      attachments: [{
        filename: `${report.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        content: reportContent.pdfBuffer,
        contentType: 'application/pdf'
      }]
    };

    // Send emails to all recipients
    const results = [];
    for (const email of recipientEmails) {
      try {
        const result = await notificationService.sendEmail(email, emailContent.subject, emailContent.html, {
          attachments: emailContent.attachments,
          priority,
          metadata: {
            reportId: report.id,
            reportTitle: report.title,
            generatedBy: report.generatedBy?.email,
            templateId: report.templateId
          },
          tags: ['report-delivery', 'ai-insights', report.template?.category || 'general']
        });

        results.push({
          email,
          success: true,
          notificationId: result.id
        });

        // Log successful email delivery
        if (auditContext.userId) {
          await auditService.logReportEvent({
            reportId: report.id,
            userId: auditContext.userId,
            action: 'emailed',
            resourceType: 'report',
            resourceId: report.id,
            details: {
              recipientEmail: email,
              subject: emailContent.subject,
              notificationId: result.id,
              deliveryType: 'email'
            },
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent,
            dataSensitivity: report.metadata?.dataSensitivity || 'internal'
          });
        }
      } catch (error) {
        console.error(`Failed to send report to ${email}:`, error);
        results.push({
          email,
          success: false,
          error: error.message
        });

        // Log failed email delivery
        if (auditContext.userId) {
          await auditService.logReportEvent({
            reportId: report.id,
            userId: auditContext.userId,
            action: 'emailed',
            resourceType: 'report',
            resourceId: report.id,
            details: {
              recipientEmail: email,
              error: error.message,
              deliveryType: 'email'
            },
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent,
            riskLevel: 'low'
          });
        }
      }
    }

    // Update report delivery metadata
    await report.update({
      metadata: {
        ...report.metadata,
        lastDeliveredAt: new Date().toISOString(),
        deliveryCount: (report.metadata.deliveryCount || 0) + results.filter(r => r.success).length,
        deliveryResults: results
      }
    });

    return {
      reportId,
      totalRecipients: recipientEmails.length,
      successfulDeliveries: results.filter(r => r.success).length,
      failedDeliveries: results.filter(r => !r.success).length,
      results
    };
  }

  /**
   * Generate report content for email delivery
   */
  async generateReportContent(report, options = {}) {
    const { includeInsights = true, includeRecommendations = true } = options;

    // Parse stored data
    const insights = includeInsights ? JSON.parse(report.insights || '[]') : [];
    const recommendations = includeRecommendations ? JSON.parse(report.recommendations || '[]') : [];

    // Generate PDF buffer (mock implementation)
    const pdfBuffer = await this.generateReportPDF(report, insights, recommendations);

    return {
      insights,
      recommendations,
      pdfBuffer,
      summary: this.generateReportSummary(insights, recommendations)
    };
  }

  /**
   * Generate HTML email template for report delivery
   */
  generateReportEmailTemplate(report, reportContent, customMessage) {
    const { insights, recommendations, summary } = reportContent;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${report.title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .content { margin: 20px 0; }
          .insights { background: #e3f2fd; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .recommendations { background: #f3e5f5; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          .priority-high { color: #d32f2f; font-weight: bold; }
          .priority-medium { color: #f57c00; font-weight: bold; }
          .priority-low { color: #388e3c; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${report.title}</h1>
          <p><strong>Generated:</strong> ${new Date(report.createdAt).toLocaleString()}</p>
          <p><strong>Report Type:</strong> ${report.templateName || 'Custom Report'}</p>
        </div>

        <div class="content">
          <p>${customMessage}</p>

          ${summary ? `<p><strong>Summary:</strong> ${summary}</p>` : ''}

          ${insights.length > 0 ? `
            <div class="insights">
              <h3>Key AI Insights</h3>
              ${insights.slice(0, 5).map(insight => `
                <div style="margin: 10px 0; padding: 10px; background: white; border-radius: 4px;">
                  <h4 class="priority-${insight.priority}">${insight.title}</h4>
                  <p>${insight.description}</p>
                  ${insight.recommendations ? `<p><strong>Recommendation:</strong> ${insight.recommendations[0]}</p>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${recommendations.length > 0 ? `
            <div class="recommendations">
              <h3>Actionable Recommendations</h3>
              <ul>
                ${recommendations.slice(0, 5).map(rec => `<li>${rec.title || rec}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          <p>The full report with detailed analysis and visualizations is attached to this email.</p>
        </div>

        <div class="footer">
          <p>This report was generated by PropertyAI's advanced analytics engine.</p>
          <p>For questions about this report, please contact your system administrator.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate PDF buffer for report (mock implementation)
   */
  async generateReportPDF(report, insights, recommendations) {
    // This would use a PDF generation library like pdfkit or puppeteer
    // For now, return a mock PDF buffer
    const pdfContent = `
      PropertyAI Report: ${report.title}

      Generated: ${new Date(report.createdAt).toLocaleString()}

      Key Insights:
      ${insights.map(i => `- ${i.title}: ${i.description}`).join('\n')}

      Recommendations:
      ${recommendations.map(r => `- ${r.title || r}`).join('\n')}
    `;

    return Buffer.from(pdfContent);
  }

  /**
   * Generate report summary from insights and recommendations
   */
  generateReportSummary(insights, recommendations) {
    if (insights.length === 0 && recommendations.length === 0) {
      return 'Report generated successfully with comprehensive analysis.';
    }

    const highPriorityInsights = insights.filter(i => i.priority === 'high');
    const totalRecommendations = recommendations.length;

    let summary = '';

    if (highPriorityInsights.length > 0) {
      summary += `${highPriorityInsights.length} high-priority insights identified. `;
    }

    if (totalRecommendations > 0) {
      summary += `${totalRecommendations} actionable recommendations provided.`;
    }

    return summary || 'Report contains detailed analysis and insights.';
  }

  /**
   * Schedule automated report delivery
   */
  async scheduleReportDelivery(reportId, scheduleConfig) {
    const { frequency, recipients, time, timezone = 'UTC', enabled = true } = scheduleConfig;

    const scheduledReport = await ScheduledReport.create({
      reportId,
      frequency,
      recipients,
      scheduleTime: time,
      timezone,
      enabled,
      nextRunAt: this.calculateNextRunTime(time, frequency, timezone),
      metadata: {
        createdAt: new Date().toISOString(),
        source: 'api'
      }
    });

    return scheduledReport;
  }

  /**
   * Calculate next run time for scheduled report
   */
  calculateNextRunTime(time, frequency, timezone) {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);

    let nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);

    if (nextRun <= now) {
      // Schedule for next occurrence
      switch (frequency) {
        case 'daily':
          nextRun.setDate(nextRun.getDate() + 1);
          break;
        case 'weekly':
          nextRun.setDate(nextRun.getDate() + 7);
          break;
        case 'monthly':
          nextRun.setMonth(nextRun.getMonth() + 1);
          break;
      }
    }

    return nextRun;
  }
}

module.exports = new ReportingService();