/**
 * Frontend Reporting Service
 * Handles communication with the AI-powered reporting backend
 */

import axios from 'axios';
import {
  ReportTemplate,
  GeneratedReport,
  ReportGenerationRequest,
  ReportExportRequest,
  ReportInsights,
  ReportRecommendations,
  ReportParameters
} from '../types/reporting';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class ReportingService {
  private api = axios.create({
    baseURL: `${API_BASE_URL}/reports`,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  constructor() {
    // Add request interceptor for authentication
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Template Management
  async getTemplates(category?: string, type?: string): Promise<ReportTemplate[]> {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (type) params.append('type', type);

      const response = await this.api.get(`/templates?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching report templates:', error);
      throw new Error('Failed to fetch report templates');
    }
  }

  async getTemplate(id: string): Promise<ReportTemplate> {
    try {
      const response = await this.api.get(`/templates/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching report template:', error);
      throw new Error('Failed to fetch report template');
    }
  }

  async createTemplate(template: Omit<ReportTemplate, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>): Promise<ReportTemplate> {
    try {
      const response = await this.api.post('/templates', template);
      return response.data.data;
    } catch (error) {
      console.error('Error creating report template:', error);
      throw new Error('Failed to create report template');
    }
  }

  async updateTemplate(id: string, updates: Partial<ReportTemplate>): Promise<ReportTemplate> {
    try {
      const response = await this.api.put(`/templates/${id}`, updates);
      return response.data.data;
    } catch (error) {
      console.error('Error updating report template:', error);
      throw new Error('Failed to update report template');
    }
  }

  async deleteTemplate(id: string): Promise<void> {
    try {
      await this.api.delete(`/templates/${id}`);
    } catch (error) {
      console.error('Error deleting report template:', error);
      throw new Error('Failed to delete report template');
    }
  }

  // Report Generation
  async generateReport(request: ReportGenerationRequest): Promise<{ reportId: string; status: string }> {
    try {
      const response = await this.api.post('/generate', request);
      return response.data.data;
    } catch (error) {
      console.error('Error generating report:', error);
      throw new Error('Failed to generate report');
    }
  }

  // Report Management
  async getReports(
    status?: string,
    templateId?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{
    reports: GeneratedReport[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }> {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (templateId) params.append('templateId', templateId);
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());

      const response = await this.api.get(`/?${params.toString()}`);
      return {
        reports: response.data.data,
        pagination: response.data.pagination
      };
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw new Error('Failed to fetch reports');
    }
  }

  async getReport(id: string): Promise<GeneratedReport> {
    try {
      const response = await this.api.get(`/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching report:', error);
      throw new Error('Failed to fetch report');
    }
  }

  async exportReport(id: string, format: 'pdf' | 'csv' | 'excel' | 'json'): Promise<{
    format: string;
    filename: string;
    data: Blob;
    size: number;
  }> {
    try {
      const response = await this.api.post(`/${id}/export`, { format }, {
        responseType: 'blob'
      });

      const contentDisposition = response.headers['content-disposition'];
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `${id}.${format}`;

      return {
        format,
        filename,
        data: response.data,
        size: response.data.size
      };
    } catch (error) {
      console.error('Error exporting report:', error);
      throw new Error('Failed to export report');
    }
  }

  async deleteReport(id: string): Promise<void> {
    try {
      await this.api.delete(`/${id}`);
    } catch (error) {
      console.error('Error deleting report:', error);
      throw new Error('Failed to delete report');
    }
  }

  // Scheduled Reports
  async getScheduledReports(): Promise<any[]> {
    try {
      const response = await this.api.get('/scheduled/list');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching scheduled reports:', error);
      throw new Error('Failed to fetch scheduled reports');
    }
  }

  async scheduleReport(scheduleData: {
    templateId: string;
    parameters: ReportParameters;
    schedule: {
      frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
      time: string; // HH:MM format
      dayOfWeek?: number; // 0-6 for weekly
      dayOfMonth?: number; // 1-31 for monthly
      recipients: string[];
    };
  }): Promise<any> {
    try {
      const response = await this.api.post('/schedule', scheduleData);
      return response.data.data;
    } catch (error) {
      console.error('Error scheduling report:', error);
      throw new Error('Failed to schedule report');
    }
  }

  // Utility Methods
  async getReportStatus(reportId: string): Promise<string> {
    try {
      const report = await this.getReport(reportId);
      return report.status;
    } catch (error) {
      return 'error';
    }
  }

  async waitForReportCompletion(
    reportId: string,
    maxWaitTime: number = 300000, // 5 minutes
    pollInterval: number = 5000 // 5 seconds
  ): Promise<GeneratedReport> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const report = await this.getReport(reportId);

          if (report.status === 'completed') {
            resolve(report);
          } else if (report.status === 'failed') {
            reject(new Error(report.errorMessage || 'Report generation failed'));
          } else if (Date.now() - startTime > maxWaitTime) {
            reject(new Error('Report generation timeout'));
          } else {
            setTimeout(poll, pollInterval);
          }
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }

  // Template Customization Helpers
  createCustomTemplate(baseTemplate: ReportTemplate, customizations: {
    name: string;
    sections?: string[];
    visualizations?: string[];
    filters?: Record<string, any>;
    styling?: Record<string, any>;
  }): Omit<ReportTemplate, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'> {
    return {
      name: customizations.name,
      description: baseTemplate.description,
      type: baseTemplate.type,
      category: baseTemplate.category,
      sections: customizations.sections || baseTemplate.sections,
      dataSources: baseTemplate.dataSources,
      visualizations: customizations.visualizations || baseTemplate.visualizations,
      filters: { ...baseTemplate.filters, ...customizations.filters },
      styling: { ...baseTemplate.styling, ...customizations.styling },
      isActive: true,
      isPublic: false,
      version: 1,
      tags: baseTemplate.tags,
      metadata: baseTemplate.metadata
    };
  }

  // Report Preview
  async previewReport(templateId: string, parameters: ReportParameters): Promise<{
    insights: ReportInsights[];
    recommendations: ReportRecommendations[];
    confidence: number;
  }> {
    try {
      // This would call a preview endpoint that generates insights without saving
      const response = await this.api.post('/preview', {
        templateId,
        parameters
      });
      return response.data.data;
    } catch (error) {
      console.error('Error previewing report:', error);
      throw new Error('Failed to preview report');
    }
  }

  // Bulk Operations
  async generateBulkReports(requests: ReportGenerationRequest[]): Promise<Array<{ reportId: string; status: string }>> {
    try {
      const response = await this.api.post('/generate/bulk', { requests });
      return response.data.data;
    } catch (error) {
      console.error('Error generating bulk reports:', error);
      throw new Error('Failed to generate bulk reports');
    }
  }

  // Report Analytics
  async getReportAnalytics(timeRange: { start: Date; end: Date }): Promise<{
    totalReports: number;
    reportsByTemplate: Record<string, number>;
    reportsByStatus: Record<string, number>;
    averageGenerationTime: number;
    mostUsedTemplates: Array<{ templateId: string; count: number }>;
  }> {
    try {
      const response = await this.api.get('/analytics', {
        params: {
          startDate: timeRange.start.toISOString(),
          endDate: timeRange.end.toISOString()
        }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching report analytics:', error);
      throw new Error('Failed to fetch report analytics');
    }
  }

  // Email Delivery
  async deliverReportByEmail(
    reportId: string,
    deliveryOptions: {
      recipientEmails: string[];
      subject?: string;
      message?: string;
      priority?: 'low' | 'normal' | 'high' | 'urgent';
      includeInsights?: boolean;
      includeRecommendations?: boolean;
    }
  ): Promise<{
    reportId: string;
    totalRecipients: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    results: Array<{
      email: string;
      success: boolean;
      notificationId?: string;
      error?: string;
    }>;
  }> {
    try {
      const response = await this.api.post(`/${reportId}/deliver`, deliveryOptions);
      return response.data.data;
    } catch (error) {
      console.error('Error delivering report by email:', error);
      throw new Error('Failed to deliver report by email');
    }
  }

  // Audit Trail
  async getReportAuditTrail(
    reportId: string,
    options: {
      actions?: string[];
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{
    logs: Array<{
      id: string;
      action: string;
      resourceType: string;
      details: Record<string, any>;
      ipAddress?: string;
      userAgent?: string;
      createdAt: string;
      user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
      };
    }>;
    total: number;
    hasMore: boolean;
  }> {
    try {
      const params = new URLSearchParams();
      if (options.actions?.length) {
        options.actions.forEach(action => params.append('actions', action));
      }
      if (options.startDate) params.append('startDate', options.startDate.toISOString());
      if (options.endDate) params.append('endDate', options.endDate.toISOString());
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.offset) params.append('offset', options.offset.toString());

      const response = await this.api.get(`/${reportId}/audit?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching audit trail:', error);
      throw new Error('Failed to fetch audit trail');
    }
  }

  // Report Versions
  async getReportVersions(
    reportId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{
    versions: Array<{
      id: string;
      version: number;
      changes: Record<string, any>;
      changeType: string;
      changeReason?: string;
      aiConfidence?: number;
      createdBy: string;
      createdAt: string;
    }>;
    total: number;
    hasMore: boolean;
  }> {
    try {
      const params = new URLSearchParams();
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.offset) params.append('offset', options.offset.toString());

      const response = await this.api.get(`/${reportId}/versions?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching report versions:', error);
      throw new Error('Failed to fetch report versions');
    }
  }

  // Compliance
  async runComplianceCheck(reportId: string): Promise<{
    reportId: string;
    complianceStatus: 'passed' | 'failed' | 'pending';
    issues: Array<{
      rule: string;
      severity: 'low' | 'medium' | 'high';
      message: string;
      details?: Record<string, any>;
    }>;
    checkedAt: string;
  }> {
    try {
      const response = await this.api.post(`/${reportId}/compliance-check`);
      return response.data.data;
    } catch (error) {
      console.error('Error running compliance check:', error);
      throw new Error('Failed to run compliance check');
    }
  }

  async getComplianceReport(options: {
    startDate?: Date;
    endDate?: Date;
    reportType?: 'summary' | 'detailed';
  } = {}): Promise<{
    period: { startDate?: string; endDate?: string };
    auditSummary: Array<{ action: string; count: number }>;
    complianceIssues: number;
    complianceDetails: any[];
    dataSensitivityStats: Array<{ dataSensitivity: string; count: number }>;
    generatedAt: string;
  }> {
    try {
      const params = new URLSearchParams();
      if (options.startDate) params.append('startDate', options.startDate.toISOString());
      if (options.endDate) params.append('endDate', options.endDate.toISOString());
      if (options.reportType) params.append('reportType', options.reportType);

      const response = await this.api.get(`/audit/compliance?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching compliance report:', error);
      throw new Error('Failed to fetch compliance report');
    }
  }

  // Enhanced Scheduling with Email Delivery
  async scheduleReportWithDelivery(scheduleData: {
    reportId: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    time: string;
    timezone?: string;
    enabled?: boolean;
    deliveryOptions?: {
      subject?: string;
      message?: string;
      priority?: 'low' | 'normal' | 'high' | 'urgent';
      includeInsights?: boolean;
      includeRecommendations?: boolean;
    };
  }): Promise<any> {
    try {
      const response = await this.api.post('/schedule', scheduleData);
      return response.data.data;
    } catch (error) {
      console.error('Error scheduling report with delivery:', error);
      throw new Error('Failed to schedule report with delivery');
    }
  }

  // Report Insights and Recommendations
  async getReportInsights(reportId: string): Promise<{
    insights: ReportInsights[];
    recommendations: ReportRecommendations[];
    confidence: number;
  }> {
    try {
      const report = await this.getReport(reportId);
      return {
        insights: report.insights || [],
        recommendations: report.recommendations || [],
        confidence: report.metadata?.confidence || 0
      };
    } catch (error) {
      console.error('Error fetching report insights:', error);
      throw new Error('Failed to fetch report insights');
    }
  }

  // Template Preview with AI Insights
  async previewTemplateWithInsights(
    templateId: string,
    parameters: ReportParameters
  ): Promise<{
    insights: ReportInsights[];
    recommendations: ReportRecommendations[];
    confidence: number;
    estimatedGenerationTime: number;
  }> {
    try {
      const response = await this.api.post('/preview/insights', {
        templateId,
        parameters
      });
      return response.data.data;
    } catch (error) {
      console.error('Error previewing template with insights:', error);
      throw new Error('Failed to preview template with insights');
    }
  }
}

export const reportingService = new ReportingService();
export default reportingService;