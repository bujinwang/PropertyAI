/**
 * TypeScript types for AI-Powered Reporting System
 */

export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  type: 'monthly' | 'quarterly' | 'weekly' | 'daily' | 'custom';
  category: 'executive' | 'operational' | 'financial' | 'compliance' | 'custom';
  sections: string[];
  dataSources: string[];
  visualizations: string[];
  filters: Record<string, any>;
  styling: {
    theme: string;
    colors: {
      primary: string;
      secondary: string;
      success: string;
      warning: string;
      error: string;
    };
    fonts: {
      primary: string;
      secondary: string;
    };
    [key: string]: any;
  };
  isActive: boolean;
  isPublic: boolean;
  createdBy: string;
  updatedBy?: string;
  version: number;
  tags: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface GeneratedReport {
  id: string;
  templateId: string;
  templateName: string;
  generatedAt: Date;
  parameters: ReportParameters;
  data: Record<string, any>;
  insights: ReportInsights[];
  recommendations: ReportRecommendations[];
  metadata: {
    dataSources: string[];
    confidence: number;
    processingTime?: number;
    [key: string]: any;
  };
  status: 'generating' | 'completed' | 'failed' | 'expired';
  format: 'json' | 'pdf' | 'csv' | 'excel';
  fileSize?: number;
  downloadCount: number;
  lastAccessedAt?: Date;
  expiresAt?: Date;
  isPublic: boolean;
  accessToken?: string;
  createdBy: string;
  recipientEmails: string[];
  tags: string[];
  version: number;
  processingTime?: number;
  errorMessage?: string;
  auditTrail: AuditEntry[];
}

export interface ReportParameters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  propertyIds?: string[];
  tenantIds?: string[];
  includeInactive?: boolean;
  aggregationLevel?: 'property' | 'portfolio' | 'region';
  currency?: string;
  timezone?: string;
  [key: string]: any;
}

export interface ReportInsights {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  impact: number; // 1-10 scale
  confidence: number; // 0-1 scale
  data: Record<string, any>;
  recommendations?: string[];
  category?: string;
  trend?: 'increasing' | 'decreasing' | 'stable';
  changePercent?: number;
  generatedAt: Date;
}

export interface ReportRecommendations {
  id: string;
  insightId: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  impact: number;
  effort: number; // 1-5 scale (effort required)
  timeline: string; // e.g., "1-2 weeks", "2-4 weeks"
  actions: string[];
  metrics: string[]; // Success metrics
  generatedAt: Date;
  confidence: number;
}

export interface AuditEntry {
  timestamp: Date;
  action: string;
  userId: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface ReportGenerationRequest {
  templateId: string;
  parameters: ReportParameters;
  format?: 'json' | 'pdf' | 'csv' | 'excel';
  emailDelivery?: boolean;
  recipientEmails?: string[];
}

export interface ReportExportRequest {
  format: 'pdf' | 'csv' | 'excel' | 'json';
  options?: {
    includeInsights?: boolean;
    includeRecommendations?: boolean;
    customStyling?: Record<string, any>;
  };
}

export interface ReportTemplateCustomization {
  name: string;
  sections?: string[];
  visualizations?: string[];
  filters?: Record<string, any>;
  styling?: Record<string, any>;
  tags?: string[];
}

export interface ScheduledReport {
  id: string;
  templateId: string;
  templateName: string;
  parameters: ReportParameters;
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    time: string; // HH:MM format
    dayOfWeek?: number; // 0-6 for weekly
    dayOfMonth?: number; // 1-31 for monthly
    timezone: string;
  };
  recipients: string[];
  isActive: boolean;
  lastRun?: Date;
  nextRun: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportAnalytics {
  totalReports: number;
  reportsByTemplate: Record<string, number>;
  reportsByStatus: Record<string, number>;
  averageGenerationTime: number;
  mostUsedTemplates: Array<{
    templateId: string;
    templateName: string;
    count: number;
  }>;
  reportsByFormat: Record<string, number>;
  downloadTrends: Array<{
    date: string;
    downloads: number;
  }>;
  errorRate: number;
  userEngagement: {
    averageSessionTime: number;
    mostViewedReports: Array<{
      reportId: string;
      views: number;
    }>;
  };
}

export interface ReportPreview {
  insights: ReportInsights[];
  recommendations: ReportRecommendations[];
  confidence: number;
  estimatedGenerationTime: number;
  dataCompleteness: number; // 0-1 scale
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'text' | 'chart' | 'table' | 'metric' | 'insights' | 'recommendations';
  content: any;
  position: number;
  isVisible: boolean;
  styling?: Record<string, any>;
}

export interface ReportVisualization {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'heatmap' | 'gauge' | 'table';
  title: string;
  data: any;
  config: {
    xAxis?: string;
    yAxis?: string;
    colors?: string[];
    showLegend?: boolean;
    showGrid?: boolean;
    [key: string]: any;
  };
  styling?: Record<string, any>;
}

export interface ReportFilter {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in';
  value: any;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'select';
  options?: Array<{ label: string; value: any }>;
}

export interface ReportCustomizationOptions {
  sections: ReportSection[];
  visualizations: ReportVisualization[];
  filters: ReportFilter[];
  styling: {
    theme: string;
    colors: Record<string, string>;
    fonts: Record<string, string>;
    layout: 'single' | 'grid' | 'tabs';
  };
  exportOptions: {
    formats: string[];
    includeInsights: boolean;
    includeRecommendations: boolean;
    customHeader?: string;
    customFooter?: string;
  };
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// Error Types
export interface ReportGenerationError extends Error {
  code: 'TEMPLATE_NOT_FOUND' | 'INSUFFICIENT_DATA' | 'GENERATION_FAILED' | 'EXPORT_FAILED';
  details?: Record<string, any>;
}

export interface ValidationError extends Error {
  field: string;
  code: string;
  details?: Record<string, any>;
}

// Event Types for Real-time Updates
export interface ReportGenerationProgress {
  reportId: string;
  status: 'queued' | 'processing' | 'insights_generated' | 'recommendations_generated' | 'formatting' | 'completed';
  progress: number; // 0-100
  currentStep: string;
  estimatedTimeRemaining?: number;
}

export interface ReportNotification {
  id: string;
  type: 'generation_complete' | 'generation_failed' | 'export_ready' | 'scheduled_report_generated';
  title: string;
  message: string;
  reportId?: string;
  templateId?: string;
  timestamp: Date;
  isRead: boolean;
}

// Utility Types
export type ReportStatus = GeneratedReport['status'];
export type ReportFormat = GeneratedReport['format'];
export type InsightPriority = ReportInsights['priority'];
export type RecommendationPriority = ReportRecommendations['priority'];
export type ScheduleFrequency = ScheduledReport['schedule']['frequency'];

// Form Types for UI Components
export interface ReportGenerationForm {
  templateId: string;
  parameters: ReportParameters;
  format: ReportFormat;
  emailDelivery: boolean;
  recipientEmails: string[];
}

export interface TemplateCustomizationForm {
  baseTemplateId: string;
  customizations: ReportTemplateCustomization;
}

export interface ScheduleForm {
  templateId: string;
  parameters: ReportParameters;
  schedule: ScheduledReport['schedule'];
  recipients: string[];
}