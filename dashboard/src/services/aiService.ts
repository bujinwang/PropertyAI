/**
 * AI Service Integration Layer
 * Provides API clients for AI communication training, risk assessment, and emergency response
 */

import { apiService } from './apiService';
import { config } from '../config/environment';
import type {
  CommunicationTrainingState,
  ResponseSettings,
  CommunicationScenario,
  ToneStyleConfig,
  CommunicationTemplate,
  PreviewConfig,
  ResponseTrigger,
  EscalationRule
} from '../types/communication-training';
import type {
  RiskAssessment,
  RiskAssessmentMetrics,
  Applicant,
  ApplicantComparison,
  RiskFactor
} from '../types/risk-assessment';
import type {
  AISuggestion,
  AIFeedback,
  AIExplanation,
  ConfidenceScore
} from '../types/ai';

/**
 * AI Communication Training API Client
 */
export class AICommunicationService {
  private readonly baseUrl = '/ai/communication';

  /**
   * Get current response settings
   */
  async getResponseSettings(): Promise<ResponseSettings> {
    const response = await apiService.get<ResponseSettings>(`${this.baseUrl}/settings`);
    return response.data;
  }

  /**
   * Update response settings
   */
  async updateResponseSettings(settings: Partial<ResponseSettings>): Promise<ResponseSettings> {
    const response = await apiService.put<ResponseSettings>(`${this.baseUrl}/settings`, settings);
    return response.data;
  }

  /**
   * Get communication scenarios
   */
  async getScenarios(category?: string): Promise<CommunicationScenario[]> {
    const params = category ? { category } : undefined;
    const response = await apiService.get<CommunicationScenario[]>(`${this.baseUrl}/scenarios`, params);
    return response.data;
  }

  /**
   * Update scenario status
   */
  async updateScenario(scenarioId: string, updates: Partial<CommunicationScenario>): Promise<CommunicationScenario> {
    const response = await apiService.put<CommunicationScenario>(`${this.baseUrl}/scenarios/${scenarioId}`, updates);
    return response.data;
  }

  /**
   * Get tone and style configuration
   */
  async getToneStyleConfig(): Promise<ToneStyleConfig> {
    const response = await apiService.get<ToneStyleConfig>(`${this.baseUrl}/tone-style`);
    return response.data;
  }

  /**
   * Update tone and style configuration
   */
  async updateToneStyleConfig(config: Partial<ToneStyleConfig>): Promise<ToneStyleConfig> {
    const response = await apiService.put<ToneStyleConfig>(`${this.baseUrl}/tone-style`, config);
    return response.data;
  }

  /**
   * Get pending templates for approval
   */
  async getPendingTemplates(): Promise<CommunicationTemplate[]> {
    const response = await apiService.get<CommunicationTemplate[]>(`${this.baseUrl}/templates/pending`);
    return response.data;
  }

  /**
   * Approve template
   */
  async approveTemplate(templateId: string, comments?: string): Promise<CommunicationTemplate> {
    const response = await apiService.post<CommunicationTemplate>(`${this.baseUrl}/templates/${templateId}/approve`, {
      comments
    });
    return response.data;
  }

  /**
   * Reject template
   */
  async rejectTemplate(templateId: string, reason: string): Promise<CommunicationTemplate> {
    const response = await apiService.post<CommunicationTemplate>(`${this.baseUrl}/templates/${templateId}/reject`, {
      reason
    });
    return response.data;
  }

  /**
   * Generate AI suggestion for scenario
   */
  async generateSuggestion(scenario: string, config: PreviewConfig): Promise<AISuggestion> {
    const response = await apiService.post<AISuggestion>(`${this.baseUrl}/generate`, {
      scenario,
      config
    });
    return response.data;
  }

  /**
   * Submit feedback for AI suggestion
   */
  async submitFeedback(suggestionId: string, feedback: AIFeedback): Promise<void> {
    await apiService.post(`${this.baseUrl}/feedback`, {
      suggestionId,
      ...feedback
    });
  }

  /**
   * Get AI explanation for decision
   */
  async getExplanation(decisionId: string): Promise<AIExplanation> {
    const response = await apiService.get<AIExplanation>(`${this.baseUrl}/explanations/${decisionId}`);
    return response.data;
  }
}

/**
 * AI Risk Assessment API Client
 */
export class AIRiskAssessmentService {
  private readonly baseUrl = '/ai/risk-assessment';

  /**
   * Get dashboard metrics
   */
  async getMetrics(propertyId?: string, dateRange?: { start: Date; end: Date }): Promise<RiskAssessmentMetrics> {
    const params: any = {};
    if (propertyId) params.propertyId = propertyId;
    if (dateRange) {
      params.startDate = dateRange.start.toISOString();
      params.endDate = dateRange.end.toISOString();
    }

    const response = await apiService.get<RiskAssessmentMetrics>(`${this.baseUrl}/metrics`, params);
    return response.data;
  }

  /**
   * Get applicants list
   */
  async getApplicants(filters?: {
    propertyId?: string;
    riskLevel?: string[];
    status?: string[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<Applicant[]> {
    const response = await apiService.get<Applicant[]>(`${this.baseUrl}/applicants`, filters);
    return response.data;
  }

  /**
   * Get detailed risk assessment
   */
  async getRiskAssessment(applicantId: string): Promise<RiskAssessment> {
    const response = await apiService.get<RiskAssessment>(`${this.baseUrl}/assessments/${applicantId}`);
    return response.data;
  }

  /**
   * Compare multiple applicants
   */
  async compareApplicants(applicantIds: string[]): Promise<ApplicantComparison> {
    const response = await apiService.post<ApplicantComparison>(`${this.baseUrl}/compare`, {
      applicantIds
    });
    return response.data;
  }

  /**
   * Update assessment status
   */
  async updateAssessmentStatus(
    assessmentId: string, 
    status: 'approved' | 'rejected', 
    reason?: string
  ): Promise<RiskAssessment> {
    const response = await apiService.put<RiskAssessment>(`${this.baseUrl}/assessments/${assessmentId}/status`, {
      status,
      reason
    });
    return response.data;
  }

  /**
   * Get risk factor explanation
   */
  async getRiskFactorExplanation(factorId: string): Promise<AIExplanation> {
    const response = await apiService.get<AIExplanation>(`${this.baseUrl}/factors/${factorId}/explanation`);
    return response.data;
  }

  /**
   * Submit feedback on risk assessment
   */
  async submitAssessmentFeedback(assessmentId: string, feedback: AIFeedback): Promise<void> {
    await apiService.post(`${this.baseUrl}/assessments/${assessmentId}/feedback`, feedback);
  }
}

/**
 * Emergency Response API Client
 */
export class EmergencyResponseService {
  private readonly baseUrl = '/ai/emergency-response';

  /**
   * Get active alerts
   */
  async getActiveAlerts(propertyId?: string): Promise<EmergencyAlert[]> {
    const params = propertyId ? { propertyId } : undefined;
    const response = await apiService.get<EmergencyAlert[]>(`${this.baseUrl}/alerts`, params);
    return response.data;
  }

  /**
   * Get alert details
   */
  async getAlertDetails(alertId: string): Promise<EmergencyAlertDetails> {
    const response = await apiService.get<EmergencyAlertDetails>(`${this.baseUrl}/alerts/${alertId}`);
    return response.data;
  }

  /**
   * Update alert status
   */
  async updateAlertStatus(alertId: string, status: string, notes?: string): Promise<EmergencyAlert> {
    const response = await apiService.put<EmergencyAlert>(`${this.baseUrl}/alerts/${alertId}/status`, {
      status,
      notes
    });
    return response.data;
  }

  /**
   * Get emergency contacts
   */
  async getEmergencyContacts(propertyId?: string): Promise<EmergencyContact[]> {
    const params = propertyId ? { propertyId } : undefined;
    const response = await apiService.get<EmergencyContact[]>(`${this.baseUrl}/contacts`, params);
    return response.data;
  }

  /**
   * Create emergency report
   */
  async createEmergencyReport(report: EmergencyReportData): Promise<EmergencyReport> {
    const response = await apiService.post<EmergencyReport>(`${this.baseUrl}/reports`, report);
    return response.data;
  }

  /**
   * Get response protocols
   */
  async getResponseProtocols(alertType: string): Promise<ResponseProtocol[]> {
    const response = await apiService.get<ResponseProtocol[]>(`${this.baseUrl}/protocols`, {
      alertType
    });
    return response.data;
  }

  /**
   * Update protocol step
   */
  async updateProtocolStep(protocolId: string, stepId: string, completed: boolean): Promise<void> {
    await apiService.put(`${this.baseUrl}/protocols/${protocolId}/steps/${stepId}`, {
      completed
    });
  }

  /**
   * Send emergency notification
   */
  async sendEmergencyNotification(notification: EmergencyNotificationData): Promise<void> {
    await apiService.post(`${this.baseUrl}/notifications`, notification);
  }
}

// Emergency Response Types (to be moved to separate types file later)
export interface EmergencyAlert {
  id: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved';
  location: string;
  coordinates?: [number, number];
  timestamp: Date;
  description: string;
  propertyId: string;
}

export interface EmergencyAlertDetails extends EmergencyAlert {
  protocols: ResponseProtocol[];
  contacts: EmergencyContact[];
  timeline: AlertTimelineEvent[];
  attachments?: string[];
}

export interface EmergencyContact {
  id: string;
  name: string;
  role: string;
  phone: string;
  email?: string;
  available: boolean;
  propertyId?: string;
}

export interface ResponseProtocol {
  id: string;
  name: string;
  steps: ProtocolStep[];
  estimatedDuration: number;
}

export interface ProtocolStep {
  id: string;
  description: string;
  completed: boolean;
  assignedTo?: string;
  dueTime?: Date;
  priority: 'low' | 'medium' | 'high';
}

export interface AlertTimelineEvent {
  id: string;
  timestamp: Date;
  event: string;
  user?: string;
  notes?: string;
}

export interface EmergencyReportData {
  alertId: string;
  incidentType: string;
  description: string;
  location: string;
  coordinates?: [number, number];
  severity: 'low' | 'medium' | 'high' | 'critical';
  propertyId: string;
  reportedBy: string;
}

export interface EmergencyReport extends EmergencyReportData {
  id: string;
  reportNumber: string;
  timestamp: Date;
  status: 'submitted' | 'under_review' | 'completed';
}

export interface EmergencyNotificationData {
  recipients: string[];
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  channels: ('push' | 'sms' | 'email' | 'call')[];
  alertId?: string;
}

// Create service instances
export const aiCommunicationService = new AICommunicationService();
export const aiRiskAssessmentService = new AIRiskAssessmentService();
export const emergencyResponseService = new EmergencyResponseService();

// Export all services as default
export default {
  communication: aiCommunicationService,
  riskAssessment: aiRiskAssessmentService,
  emergencyResponse: emergencyResponseService,
};