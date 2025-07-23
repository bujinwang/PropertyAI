/**
 * React Query hooks for AI services
 * Provides data fetching, caching, and optimistic updates for AI features
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, cacheUtils } from '../config/queryClient';
import { 
  aiCommunicationService, 
  aiRiskAssessmentService, 
  emergencyResponseService 
} from '../services/aiService';
import type {
  ResponseSettings,
  CommunicationScenario,
  ToneStyleConfig,
  CommunicationTemplate,
  PreviewConfig
} from '../types/communication-training';
import type {
  RiskAssessmentMetrics,
  Applicant,
  RiskAssessment,
  ApplicantComparison
} from '../types/risk-assessment';
import type { AISuggestion, AIFeedback, AIExplanation } from '../types/ai';

// ============================================================================
// AI Communication Training Hooks
// ============================================================================

export const useResponseSettings = () => {
  return useQuery({
    queryKey: queryKeys.communication.settings(),
    queryFn: () => aiCommunicationService.getResponseSettings(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useUpdateResponseSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (settings: Partial<ResponseSettings>) =>
      aiCommunicationService.updateResponseSettings(settings),
    onMutate: async (newSettings) => {
      // Cancel outgoing queries
      await cacheUtils.cancelQueries(queryKeys.communication.settings());
      
      // Snapshot previous value
      const previousSettings = queryClient.getQueryData(queryKeys.communication.settings());
      
      // Optimistically update
      cacheUtils.setOptimisticData(
        queryKeys.communication.settings(),
        (old: ResponseSettings | undefined) => ({
          ...old,
          ...newSettings,
        } as ResponseSettings)
      );
      
      return { previousSettings };
    },
    onError: (err, newSettings, context) => {
      // Rollback on error
      if (context?.previousSettings) {
        queryClient.setQueryData(queryKeys.communication.settings(), context.previousSettings);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.communication.settings() });
    },
  });
};

export const useCommunicationScenarios = (category?: string) => {
  return useQuery({
    queryKey: queryKeys.communication.scenarios(category),
    queryFn: () => aiCommunicationService.getScenarios(category),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateScenario = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ scenarioId, updates }: { scenarioId: string; updates: Partial<CommunicationScenario> }) =>
      aiCommunicationService.updateScenario(scenarioId, updates),
    onSuccess: (updatedScenario) => {
      // Update all scenario queries
      queryClient.setQueriesData(
        { queryKey: queryKeys.communication.all },
        (oldData: CommunicationScenario[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map(scenario =>
            scenario.id === updatedScenario.id ? updatedScenario : scenario
          );
        }
      );
    },
  });
};

export const useToneStyleConfig = () => {
  return useQuery({
    queryKey: queryKeys.communication.toneStyle(),
    queryFn: () => aiCommunicationService.getToneStyleConfig(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useUpdateToneStyleConfig = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (config: Partial<ToneStyleConfig>) =>
      aiCommunicationService.updateToneStyleConfig(config),
    onMutate: async (newConfig) => {
      await cacheUtils.cancelQueries(queryKeys.communication.toneStyle());
      
      const previousConfig = queryClient.getQueryData(queryKeys.communication.toneStyle());
      
      cacheUtils.setOptimisticData(
        queryKeys.communication.toneStyle(),
        (old: ToneStyleConfig | undefined) => ({
          ...old,
          ...newConfig,
        } as ToneStyleConfig)
      );
      
      return { previousConfig };
    },
    onError: (err, newConfig, context) => {
      if (context?.previousConfig) {
        queryClient.setQueryData(queryKeys.communication.toneStyle(), context.previousConfig);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.communication.toneStyle() });
    },
  });
};

export const usePendingTemplates = () => {
  return useQuery({
    queryKey: queryKeys.communication.pendingTemplates(),
    queryFn: () => aiCommunicationService.getPendingTemplates(),
    staleTime: 30 * 1000, // 30 seconds (more frequent updates for pending items)
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};

export const useApproveTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ templateId, comments }: { templateId: string; comments?: string }) =>
      aiCommunicationService.approveTemplate(templateId, comments),
    onSuccess: () => {
      // Refetch pending templates
      queryClient.invalidateQueries({ queryKey: queryKeys.communication.pendingTemplates() });
    },
  });
};

export const useRejectTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ templateId, reason }: { templateId: string; reason: string }) =>
      aiCommunicationService.rejectTemplate(templateId, reason),
    onSuccess: () => {
      // Refetch pending templates
      queryClient.invalidateQueries({ queryKey: queryKeys.communication.pendingTemplates() });
    },
  });
};

export const useGenerateSuggestion = () => {
  return useMutation({
    mutationFn: ({ scenario, config }: { scenario: string; config: PreviewConfig }) =>
      aiCommunicationService.generateSuggestion(scenario, config),
  });
};

export const useSubmitFeedback = () => {
  return useMutation({
    mutationFn: ({ suggestionId, feedback }: { suggestionId: string; feedback: AIFeedback }) =>
      aiCommunicationService.submitFeedback(suggestionId, feedback),
  });
};

// ============================================================================
// Risk Assessment Hooks
// ============================================================================

export const useRiskAssessmentMetrics = (
  propertyId?: string,
  dateRange?: { start: Date; end: Date }
) => {
  return useQuery({
    queryKey: queryKeys.riskAssessment.metrics(propertyId, dateRange),
    queryFn: () => aiRiskAssessmentService.getMetrics(propertyId, dateRange),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useApplicants = (filters?: {
  propertyId?: string;
  riskLevel?: string[];
  status?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) => {
  return useQuery({
    queryKey: queryKeys.riskAssessment.applicants(filters),
    queryFn: () => aiRiskAssessmentService.getApplicants(filters),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useRiskAssessment = (applicantId: string) => {
  return useQuery({
    queryKey: queryKeys.riskAssessment.assessment(applicantId),
    queryFn: () => aiRiskAssessmentService.getRiskAssessment(applicantId),
    enabled: !!applicantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCompareApplicants = () => {
  return useMutation({
    mutationFn: (applicantIds: string[]) =>
      aiRiskAssessmentService.compareApplicants(applicantIds),
  });
};

export const useUpdateAssessmentStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      assessmentId, 
      status, 
      reason 
    }: { 
      assessmentId: string; 
      status: 'approved' | 'rejected'; 
      reason?: string;
    }) => aiRiskAssessmentService.updateAssessmentStatus(assessmentId, status, reason),
    onSuccess: (updatedAssessment) => {
      // Update the specific assessment
      queryClient.setQueryData(
        queryKeys.riskAssessment.assessment(updatedAssessment.applicantId),
        updatedAssessment
      );
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.riskAssessment.applicants() });
      queryClient.invalidateQueries({ queryKey: queryKeys.riskAssessment.metrics() });
    },
  });
};

export const useSubmitAssessmentFeedback = () => {
  return useMutation({
    mutationFn: ({ assessmentId, feedback }: { assessmentId: string; feedback: AIFeedback }) =>
      aiRiskAssessmentService.submitAssessmentFeedback(assessmentId, feedback),
  });
};

// ============================================================================
// Emergency Response Hooks
// ============================================================================

export const useEmergencyAlerts = (propertyId?: string) => {
  return useQuery({
    queryKey: queryKeys.emergency.alerts(propertyId),
    queryFn: () => emergencyResponseService.getActiveAlerts(propertyId),
    staleTime: 10 * 1000, // 10 seconds (very fresh for emergency data)
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
};

export const useEmergencyAlert = (alertId: string) => {
  return useQuery({
    queryKey: queryKeys.emergency.alert(alertId),
    queryFn: () => emergencyResponseService.getAlertDetails(alertId),
    enabled: !!alertId,
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 15 * 1000, // Refetch every 15 seconds
  });
};

export const useUpdateAlertStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ alertId, status, notes }: { alertId: string; status: string; notes?: string }) =>
      emergencyResponseService.updateAlertStatus(alertId, status, notes),
    onSuccess: (updatedAlert) => {
      // Update the specific alert
      queryClient.setQueryData(queryKeys.emergency.alert(updatedAlert.id), updatedAlert);
      
      // Update alerts list
      queryClient.setQueriesData(
        { queryKey: queryKeys.emergency.alerts() },
        (oldData: any[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map(alert =>
            alert.id === updatedAlert.id ? updatedAlert : alert
          );
        }
      );
    },
  });
};

export const useEmergencyContacts = (propertyId?: string) => {
  return useQuery({
    queryKey: queryKeys.emergency.contacts(propertyId),
    queryFn: () => emergencyResponseService.getEmergencyContacts(propertyId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useResponseProtocols = (alertType?: string) => {
  return useQuery({
    queryKey: queryKeys.emergency.protocols(alertType),
    queryFn: () => emergencyResponseService.getResponseProtocols(alertType || ''),
    enabled: !!alertType,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useUpdateProtocolStep = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      protocolId, 
      stepId, 
      completed 
    }: { 
      protocolId: string; 
      stepId: string; 
      completed: boolean;
    }) => emergencyResponseService.updateProtocolStep(protocolId, stepId, completed),
    onSuccess: (_, variables) => {
      // Invalidate protocols to refetch updated data
      queryClient.invalidateQueries({ queryKey: queryKeys.emergency.protocols() });
    },
  });
};

export const useCreateEmergencyReport = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (report: any) => emergencyResponseService.createEmergencyReport(report),
    onSuccess: () => {
      // Invalidate alerts to show new report
      queryClient.invalidateQueries({ queryKey: queryKeys.emergency.alerts() });
    },
  });
};

export const useSendEmergencyNotification = () => {
  return useMutation({
    mutationFn: (notification: any) => emergencyResponseService.sendEmergencyNotification(notification),
  });
};

// ============================================================================
// AI Explanation Hook (shared across features)
// ============================================================================

export const useAIExplanation = (decisionId: string, service: 'communication' | 'riskAssessment') => {
  const serviceMap = {
    communication: aiCommunicationService,
    riskAssessment: aiRiskAssessmentService,
  };
  
  return useQuery({
    queryKey: ['ai-explanation', service, decisionId],
    queryFn: () => serviceMap[service].getExplanation(decisionId),
    enabled: !!decisionId,
    staleTime: 10 * 60 * 1000, // 10 minutes (explanations don't change often)
  });
};