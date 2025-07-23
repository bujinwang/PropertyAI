/**
 * React Query hooks for building health monitoring service
 * Provides data fetching and caching for building health metrics and maintenance
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../config/queryClient';
import { buildingHealthService } from '../services/buildingHealthService';
import type {
  BuildingHealthOverview,
  HealthMetrics,
  MaintenanceHotspot,
  PredictiveAlert,
  MaintenanceRecommendation,
  HealthCategory
} from '../types/building-health';

// ============================================================================
// Building Health Hooks
// ============================================================================

export const useBuildingHealthOverview = (propertyId: string) => {
  return useQuery({
    queryKey: queryKeys.buildingHealth.overview(propertyId),
    queryFn: () => buildingHealthService.getBuildingHealthOverview(propertyId),
    enabled: !!propertyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });
};

export const useHealthMetrics = (propertyId: string, timeRange?: string) => {
  return useQuery({
    queryKey: queryKeys.buildingHealth.metrics(propertyId, timeRange),
    queryFn: () => buildingHealthService.getHealthMetrics(propertyId, timeRange),
    enabled: !!propertyId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useMaintenanceHotspots = (propertyId: string) => {
  return useQuery({
    queryKey: queryKeys.buildingHealth.hotspots(propertyId),
    queryFn: () => buildingHealthService.getMaintenanceHotspots(propertyId),
    enabled: !!propertyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const usePredictiveAlerts = (propertyId: string) => {
  return useQuery({
    queryKey: queryKeys.buildingHealth.alerts(propertyId),
    queryFn: () => buildingHealthService.getPredictiveAlerts(propertyId),
    enabled: !!propertyId,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

export const useMaintenanceRecommendations = (propertyId: string) => {
  return useQuery({
    queryKey: ['building-health-recommendations', propertyId],
    queryFn: () => buildingHealthService.getMaintenanceRecommendations(propertyId),
    enabled: !!propertyId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useUpdateMaintenanceStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      propertyId, 
      alertId, 
      status, 
      notes 
    }: { 
      propertyId: string; 
      alertId: string; 
      status: 'acknowledged' | 'in_progress' | 'completed' | 'dismissed'; 
      notes?: string;
    }) => buildingHealthService.updateMaintenanceStatus(propertyId, alertId, status, notes),
    onMutate: async ({ propertyId, alertId, status, notes }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.buildingHealth.alerts(propertyId) 
      });
      
      // Optimistically update alert status
      queryClient.setQueryData(
        queryKeys.buildingHealth.alerts(propertyId),
        (old: PredictiveAlert[] | undefined) => {
          if (!old) return old;
          return old.map(alert => 
            alert.id === alertId 
              ? { 
                  ...alert, 
                  status, 
                  lastUpdated: new Date(),
                  notes: notes || alert.notes,
                }
              : alert
          );
        }
      );
    },
    onError: (err, { propertyId }) => {
      // Refetch on error
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.buildingHealth.alerts(propertyId) 
      });
    },
    onSuccess: (_, { propertyId }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.buildingHealth.overview(propertyId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.buildingHealth.alerts(propertyId) 
      });
    },
  });
};

export const useScheduleMaintenance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      propertyId, 
      alertId, 
      scheduledDate, 
      assignedTo, 
      priority 
    }: { 
      propertyId: string; 
      alertId: string; 
      scheduledDate: Date; 
      assignedTo?: string; 
      priority?: 'low' | 'medium' | 'high' | 'critical';
    }) => buildingHealthService.scheduleMaintenance(propertyId, alertId, scheduledDate, assignedTo, priority),
    onSuccess: (_, { propertyId }) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.buildingHealth.alerts(propertyId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.buildingHealth.overview(propertyId) 
      });
    },
  });
};

export const useSubmitMaintenanceFeedback = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      propertyId, 
      alertId, 
      feedback 
    }: { 
      propertyId: string; 
      alertId: string; 
      feedback: {
        rating: 1 | 2 | 3 | 4 | 5;
        comment?: string;
        helpful: boolean;
      };
    }) => buildingHealthService.submitMaintenanceFeedback(propertyId, alertId, feedback),
    onSuccess: (_, { propertyId, alertId }) => {
      // Update the specific alert with feedback
      queryClient.setQueryData(
        queryKeys.buildingHealth.alerts(propertyId),
        (old: PredictiveAlert[] | undefined) => {
          if (!old) return old;
          return old.map(alert => 
            alert.id === alertId 
              ? { ...alert, userFeedback: true }
              : alert
          );
        }
      );
    },
  });
};

export const useCreateMaintenanceRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      propertyId, 
      request 
    }: { 
      propertyId: string; 
      request: {
        title: string;
        description: string;
        location: string;
        priority: 'low' | 'medium' | 'high' | 'critical';
        category: string;
        images?: File[];
      };
    }) => buildingHealthService.createMaintenanceRequest(propertyId, request),
    onSuccess: (_, { propertyId }) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.buildingHealth.overview(propertyId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.buildingHealth.alerts(propertyId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.buildingHealth.hotspots(propertyId) 
      });
    },
  });
};

// ============================================================================
// Utility Hooks
// ============================================================================

export const useHealthScore = (propertyId: string) => {
  const { data: overview } = useBuildingHealthOverview(propertyId);
  
  if (!overview) return { score: 0, level: 'unknown' as const, trend: 'stable' as const };
  
  const score = overview.overallScore;
  let level: 'excellent' | 'good' | 'fair' | 'poor' | 'critical' | 'unknown';
  
  if (score >= 90) level = 'excellent';
  else if (score >= 80) level = 'good';
  else if (score >= 70) level = 'fair';
  else if (score >= 60) level = 'poor';
  else level = 'critical';
  
  return {
    score,
    level,
    trend: overview.trend || 'stable',
    categories: overview.categories,
  };
};

export const useCriticalAlerts = (propertyId: string) => {
  const { data: alerts } = usePredictiveAlerts(propertyId);
  
  const criticalAlerts = alerts?.filter(alert => 
    alert.priority === 'critical' && alert.status === 'active'
  ) || [];
  
  const highPriorityAlerts = alerts?.filter(alert => 
    alert.priority === 'high' && alert.status === 'active'
  ) || [];
  
  return {
    criticalAlerts,
    highPriorityAlerts,
    totalCritical: criticalAlerts.length,
    totalHigh: highPriorityAlerts.length,
    hasUrgentIssues: criticalAlerts.length > 0 || highPriorityAlerts.length > 0,
  };
};

export const useMaintenanceStats = (propertyId: string) => {
  const { data: overview } = useBuildingHealthOverview(propertyId);
  const { data: alerts } = usePredictiveAlerts(propertyId);
  
  const activeAlerts = alerts?.filter(alert => alert.status === 'active').length || 0;
  const completedAlerts = alerts?.filter(alert => alert.status === 'completed').length || 0;
  const inProgressAlerts = alerts?.filter(alert => alert.status === 'in_progress').length || 0;
  
  return {
    activeAlerts,
    completedAlerts,
    inProgressAlerts,
    totalAlerts: alerts?.length || 0,
    completionRate: alerts?.length ? (completedAlerts / alerts.length) * 100 : 0,
    lastUpdated: overview?.lastUpdated,
  };
};

export const useHotspotsByCategory = (propertyId: string) => {
  const { data: hotspots } = useMaintenanceHotspots(propertyId);
  
  const hotspotsByCategory = hotspots?.reduce((acc, hotspot) => {
    const category = hotspot.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(hotspot);
    return acc;
  }, {} as Record<string, MaintenanceHotspot[]>) || {};
  
  return hotspotsByCategory;
};

export const usePrefetchBuildingHealthData = () => {
  const queryClient = useQueryClient();
  
  return (propertyId: string) => {
    // Prefetch overview
    queryClient.prefetchQuery({
      queryKey: queryKeys.buildingHealth.overview(propertyId),
      queryFn: () => buildingHealthService.getBuildingHealthOverview(propertyId),
      staleTime: 5 * 60 * 1000,
    });
    
    // Prefetch alerts
    queryClient.prefetchQuery({
      queryKey: queryKeys.buildingHealth.alerts(propertyId),
      queryFn: () => buildingHealthService.getPredictiveAlerts(propertyId),
      staleTime: 1 * 60 * 1000,
    });
    
    // Prefetch hotspots
    queryClient.prefetchQuery({
      queryKey: queryKeys.buildingHealth.hotspots(propertyId),
      queryFn: () => buildingHealthService.getMaintenanceHotspots(propertyId),
      staleTime: 5 * 60 * 1000,
    });
  };
};