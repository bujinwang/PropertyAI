/**
 * React Query hooks for emergency response service
 * Provides real-time data fetching and WebSocket integration
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { queryKeys } from '../config/queryClient';
import { emergencyResponseService } from '../services/emergencyResponseService';
import type {
  EmergencyAlert,
  AlertFilters,
  AlertSortOptions,
  EmergencyContact,
  ResponseProtocol,
  IncidentReport,
  ChatMessage,
  VoiceNote,
  PushNotificationConfig,
  EmergencyServicesReport,
  IncidentReportForm
} from '../types/emergency-response';

// ============================================================================
// Emergency Response Hooks
// ============================================================================

export const useEmergencyAlerts = (filters?: AlertFilters, sort?: AlertSortOptions) => {
  return useQuery({
    queryKey: ['emergency-alerts', filters, sort],
    queryFn: () => emergencyResponseService.getAlerts(filters, sort),
    staleTime: 10 * 1000, // 10 seconds (very fresh for emergency data)
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    retry: 3,
  });
};

export const useEmergencyAlert = (alertId: string) => {
  return useQuery({
    queryKey: ['emergency-alert', alertId],
    queryFn: () => emergencyResponseService.getAlert(alertId),
    enabled: !!alertId,
    staleTime: 5 * 1000, // 5 seconds
    refetchInterval: 15 * 1000, // Refetch every 15 seconds
  });
};

export const useUpdateAlertStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ alertId, status, message }: { 
      alertId: string; 
      status: EmergencyAlert['status']; 
      message?: string;
    }) => emergencyResponseService.updateAlertStatus(alertId, status, message),
    onMutate: async ({ alertId, status, message }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['emergency-alert', alertId] });
      
      // Snapshot previous value
      const previousAlert = queryClient.getQueryData(['emergency-alert', alertId]);
      
      // Optimistically update alert status
      queryClient.setQueryData(['emergency-alert', alertId], (old: EmergencyAlert | undefined) => {
        if (!old) return old;
        return {
          ...old,
          status,
          updates: [
            ...old.updates,
            {
              id: `temp-${Date.now()}`,
              timestamp: new Date(),
              message: message || `Status changed to ${status}`,
              userId: 'current-user', // This should come from auth context
              type: 'status_change' as const,
            },
          ],
        };
      });
      
      return { previousAlert, alertId };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousAlert && context?.alertId) {
        queryClient.setQueryData(['emergency-alert', context.alertId], context.previousAlert);
      }
    },
    onSuccess: (_, { alertId }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['emergency-alert', alertId] });
      queryClient.invalidateQueries({ queryKey: ['emergency-alerts'] });
    },
  });
};

export const useAssignAlert = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ alertId, assigneeId }: { alertId: string; assigneeId: string }) =>
      emergencyResponseService.assignAlert(alertId, assigneeId),
    onSuccess: (_, { alertId }) => {
      queryClient.invalidateQueries({ queryKey: ['emergency-alert', alertId] });
      queryClient.invalidateQueries({ queryKey: ['emergency-alerts'] });
    },
  });
};

export const useEmergencyContacts = (search?: string) => {
  return useQuery({
    queryKey: ['emergency-contacts', search],
    queryFn: () => emergencyResponseService.getEmergencyContacts(search),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCreateEmergencyContact = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (contact: Omit<EmergencyContact, 'id'>) =>
      emergencyResponseService.createEmergencyContact(contact),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergency-contacts'] });
    },
  });
};

export const useUpdateEmergencyContact = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, contact }: { id: string; contact: Partial<EmergencyContact> }) =>
      emergencyResponseService.updateEmergencyContact(id, contact),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergency-contacts'] });
    },
  });
};

export const useDeleteEmergencyContact = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => emergencyResponseService.deleteEmergencyContact(id),
    onMutate: async (id) => {
      // Optimistically remove from cache
      queryClient.setQueriesData(
        { queryKey: ['emergency-contacts'] },
        (oldData: EmergencyContact[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.filter(contact => contact.id !== id);
        }
      );
    },
    onError: () => {
      // Refetch on error to restore correct state
      queryClient.invalidateQueries({ queryKey: ['emergency-contacts'] });
    },
  });
};

export const useResponseProtocols = () => {
  return useQuery({
    queryKey: ['response-protocols'],
    queryFn: () => emergencyResponseService.getResponseProtocols(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useUpdateResponseStep = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ protocolId, stepId, completed }: { 
      protocolId: string; 
      stepId: string; 
      completed: boolean;
    }) => emergencyResponseService.updateResponseStep(protocolId, stepId, completed),
    onMutate: async ({ protocolId, stepId, completed }) => {
      // Optimistically update protocol step
      queryClient.setQueryData(['response-protocols'], (oldData: ResponseProtocol[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(protocol => {
          if (protocol.id === protocolId) {
            return {
              ...protocol,
              steps: protocol.steps.map(step => 
                step.id === stepId ? { ...step, completed } : step
              ),
            };
          }
          return protocol;
        });
      });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['response-protocols'] });
    },
  });
};

export const useCreateIncidentReport = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (report: Omit<IncidentReport, 'id' | 'reportTime' | 'status'>) =>
      emergencyResponseService.createIncidentReport(report),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergency-alerts'] });
    },
  });
};

export const useChatMessages = (alertId: string) => {
  return useQuery({
    queryKey: ['chat-messages', alertId],
    queryFn: () => emergencyResponseService.getChatMessages(alertId),
    enabled: !!alertId,
    staleTime: 5 * 1000, // 5 seconds
    refetchInterval: 10 * 1000, // Refetch every 10 seconds
  });
};

export const useSendChatMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ alertId, message, type }: { 
      alertId: string; 
      message: string; 
      type?: ChatMessage['type'];
    }) => emergencyResponseService.sendChatMessage(alertId, message, type),
    onMutate: async ({ alertId, message, type = 'text' }) => {
      // Optimistically add message
      const tempMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        alertId,
        message,
        type,
        senderId: 'current-user', // This should come from auth context
        senderName: 'You',
        timestamp: new Date(),
        readBy: [],
      };
      
      queryClient.setQueryData(['chat-messages', alertId], (old: ChatMessage[] | undefined) => {
        if (!old) return [tempMessage];
        return [...old, tempMessage];
      });
      
      return { tempMessage };
    },
    onError: (err, { alertId }, context) => {
      // Remove optimistic message on error
      if (context?.tempMessage) {
        queryClient.setQueryData(['chat-messages', alertId], (old: ChatMessage[] | undefined) => {
          if (!old) return old;
          return old.filter(msg => msg.id !== context.tempMessage.id);
        });
      }
    },
    onSuccess: (newMessage, { alertId }) => {
      // Replace temp message with real message
      queryClient.setQueryData(['chat-messages', alertId], (old: ChatMessage[] | undefined) => {
        if (!old) return [newMessage];
        return old.map(msg => 
          msg.id.startsWith('temp-') && msg.message === newMessage.message 
            ? newMessage 
            : msg
        );
      });
    },
  });
};

export const useUploadVoiceNote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ alertId, audioBlob }: { alertId: string; audioBlob: Blob }) =>
      emergencyResponseService.uploadVoiceNote(alertId, audioBlob),
    onSuccess: (voiceNote, { alertId }) => {
      // Add voice note as chat message
      const chatMessage: ChatMessage = {
        id: voiceNote.id,
        alertId,
        message: 'Voice note',
        type: 'voice',
        senderId: voiceNote.senderId,
        senderName: voiceNote.senderName,
        timestamp: voiceNote.timestamp,
        readBy: [],
        voiceNote,
      };
      
      queryClient.setQueryData(['chat-messages', alertId], (old: ChatMessage[] | undefined) => {
        if (!old) return [chatMessage];
        return [...old, chatMessage];
      });
    },
  });
};

export const useNotificationConfig = (userId: string) => {
  return useQuery({
    queryKey: ['notification-config', userId],
    queryFn: () => emergencyResponseService.getNotificationConfig(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateNotificationConfig = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (config: PushNotificationConfig) =>
      emergencyResponseService.updateNotificationConfig(config),
    onSuccess: (_, config) => {
      queryClient.setQueryData(['notification-config', config.userId], config);
    },
  });
};

export const useReportToEmergencyServices = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (reportData: IncidentReportForm) =>
      emergencyResponseService.reportToEmergencyServices(reportData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergency-alerts'] });
    },
  });
};

export const useEmergencyServicesReport = (alertId: string) => {
  return useQuery({
    queryKey: ['emergency-services-report', alertId],
    queryFn: () => emergencyResponseService.getEmergencyServicesReport(alertId),
    enabled: !!alertId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};

// ============================================================================
// Real-time WebSocket Hook
// ============================================================================

export const useEmergencyWebSocket = () => {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  
  useEffect(() => {
    const handleNewAlert = (alert: EmergencyAlert) => {
      // Add new alert to cache
      queryClient.setQueryData(['emergency-alerts'], (oldData: EmergencyAlert[] | undefined) => {
        if (!oldData) return [alert];
        return [alert, ...oldData];
      });
      
      // Set individual alert data
      queryClient.setQueryData(['emergency-alert', alert.id], alert);
    };
    
    const handleAlertUpdate = (update: any) => {
      // Update specific alert
      if (update.alertId) {
        queryClient.invalidateQueries({ queryKey: ['emergency-alert', update.alertId] });
      }
      
      // Update alerts list
      queryClient.invalidateQueries({ queryKey: ['emergency-alerts'] });
    };
    
    // Connect to WebSocket
    setConnectionStatus('connecting');
    const ws = emergencyResponseService.connectToAlerts(handleNewAlert, handleAlertUpdate);
    wsRef.current = ws;
    
    ws.onopen = () => {
      setConnectionStatus('connected');
    };
    
    ws.onclose = () => {
      setConnectionStatus('disconnected');
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('disconnected');
    };
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [queryClient]);
  
  return {
    connectionStatus,
    reconnect: () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      // The useEffect will handle reconnection
    },
  };
};

// ============================================================================
// Utility Hooks
// ============================================================================

export const usePrefetchEmergencyData = () => {
  const queryClient = useQueryClient();
  
  return {
    prefetchAlerts: (filters?: AlertFilters) => {
      queryClient.prefetchQuery({
        queryKey: ['emergency-alerts', filters],
        queryFn: () => emergencyResponseService.getAlerts(filters),
        staleTime: 10 * 1000,
      });
    },
    
    prefetchContacts: () => {
      queryClient.prefetchQuery({
        queryKey: ['emergency-contacts'],
        queryFn: () => emergencyResponseService.getEmergencyContacts(),
        staleTime: 2 * 60 * 1000,
      });
    },
  };
};