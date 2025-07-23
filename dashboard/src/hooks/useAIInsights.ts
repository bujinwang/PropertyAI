/**
 * React Query hooks for AI insights service
 * Provides data fetching and caching for AI-generated insights and recommendations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../config/queryClient';
import { aiInsightsService } from '../services/aiInsightsService';
import type {
  InsightsDashboard,
  InsightCategory,
  Insight,
  InsightFilters,
  TimeRange,
  InsightFeedback
} from '../types/ai-insights';

// ============================================================================
// AI Insights Hooks
// ============================================================================

export const useInsightsDashboard = (propertyId?: string, timeRange?: string) => {
  return useQuery({
    queryKey: queryKeys.insights.dashboard(propertyId, timeRange),
    queryFn: () => aiInsightsService.getInsightsDashboard(propertyId, timeRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 15 * 60 * 1000, // Refetch every 15 minutes
  });
};

export const useInsightCategories = () => {
  return useQuery({
    queryKey: queryKeys.insights.categories(),
    queryFn: () => aiInsightsService.getInsightCategories(),
    staleTime: 30 * 60 * 1000, // 30 minutes (categories don't change often)
  });
};

export const useInsight = (insightId: string) => {
  return useQuery({
    queryKey: queryKeys.insights.insight(insightId),
    queryFn: () => aiInsightsService.getInsight(insightId),
    enabled: !!insightId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useInsightsByCategory = (
  categoryId: string,
  filters?: InsightFilters,
  timeRange?: TimeRange
) => {
  return useQuery({
    queryKey: ['insights-by-category', categoryId, filters, timeRange],
    queryFn: () => aiInsightsService.getInsightsByCategory(categoryId, filters, timeRange),
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useInsightExplanation = (insightId: string) => {
  return useQuery({
    queryKey: ['insight-explanation', insightId],
    queryFn: () => aiInsightsService.getInsightExplanation(insightId),
    enabled: !!insightId,
    staleTime: 15 * 60 * 1000, // 15 minutes (explanations don't change)
  });
};

export const useSubmitInsightFeedback = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ insightId, feedback }: { insightId: string; feedback: InsightFeedback }) =>
      aiInsightsService.submitInsightFeedback(insightId, feedback),
    onMutate: async ({ insightId, feedback }) => {
      // Optimistically update insight with feedback
      queryClient.setQueryData(
        queryKeys.insights.insight(insightId),
        (old: Insight | undefined) => {
          if (!old) return old;
          return {
            ...old,
            userFeedback: feedback,
            feedbackSubmitted: true,
          };
        }
      );
    },
    onError: (err, { insightId }) => {
      // Revert optimistic update on error
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.insights.insight(insightId) 
      });
    },
    onSuccess: (_, { insightId }) => {
      // Update insight in cache
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.insights.insight(insightId) 
      });
      
      // Update dashboard to reflect feedback
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.insights.dashboard() 
      });
    },
  });
};

export const useMarkInsightAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (insightId: string) => aiInsightsService.markInsightAsRead(insightId),
    onMutate: async (insightId) => {
      // Optimistically mark as read
      queryClient.setQueryData(
        queryKeys.insights.insight(insightId),
        (old: Insight | undefined) => {
          if (!old) return old;
          return {
            ...old,
            read: true,
            readAt: new Date(),
          };
        }
      );
      
      // Update in dashboard data
      queryClient.setQueriesData(
        { queryKey: queryKeys.insights.dashboard() },
        (oldData: InsightsDashboard | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            categories: oldData.categories.map(category => ({
              ...category,
              insights: category.insights.map(insight =>
                insight.id === insightId 
                  ? { ...insight, read: true, readAt: new Date() }
                  : insight
              ),
            })),
          };
        }
      );
    },
    onError: (err, insightId) => {
      // Revert on error
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.insights.insight(insightId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.insights.dashboard() 
      });
    },
  });
};

export const useImplementRecommendation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      insightId, 
      recommendationId, 
      implementationNotes 
    }: { 
      insightId: string; 
      recommendationId: string; 
      implementationNotes?: string;
    }) => aiInsightsService.implementRecommendation(insightId, recommendationId, implementationNotes),
    onMutate: async ({ insightId, recommendationId }) => {
      // Optimistically mark recommendation as implemented
      queryClient.setQueryData(
        queryKeys.insights.insight(insightId),
        (old: Insight | undefined) => {
          if (!old) return old;
          return {
            ...old,
            recommendations: old.recommendations.map(rec =>
              rec.id === recommendationId 
                ? { ...rec, status: 'implemented', implementedAt: new Date() }
                : rec
            ),
          };
        }
      );
    },
    onError: (err, { insightId }) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.insights.insight(insightId) 
      });
    },
    onSuccess: (_, { insightId }) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.insights.insight(insightId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.insights.dashboard() 
      });
    },
  });
};

export const useRefreshInsights = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (propertyId?: string) => aiInsightsService.refreshInsights(propertyId),
    onMutate: async (propertyId) => {
      // Show loading state
      queryClient.setQueryData(
        queryKeys.insights.dashboard(propertyId),
        (old: InsightsDashboard | undefined) => {
          if (!old) return old;
          return {
            ...old,
            refreshing: true,
          };
        }
      );
    },
    onSuccess: (_, propertyId) => {
      // Invalidate all insights data to trigger refetch
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.insights.dashboard(propertyId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.insights.categories() 
      });
    },
    onError: (err, propertyId) => {
      // Remove loading state on error
      queryClient.setQueryData(
        queryKeys.insights.dashboard(propertyId),
        (old: InsightsDashboard | undefined) => {
          if (!old) return old;
          return {
            ...old,
            refreshing: false,
          };
        }
      );
    },
  });
};

// ============================================================================
// Utility Hooks
// ============================================================================

export const useUnreadInsights = (propertyId?: string, timeRange?: string) => {
  const { data: dashboard } = useInsightsDashboard(propertyId, timeRange);
  
  const unreadInsights = dashboard?.categories.flatMap(category =>
    category.insights.filter(insight => !insight.read)
  ) || [];
  
  const unreadByCategory = dashboard?.categories.reduce((acc, category) => {
    const unread = category.insights.filter(insight => !insight.read);
    if (unread.length > 0) {
      acc[category.id] = unread;
    }
    return acc;
  }, {} as Record<string, Insight[]>) || {};
  
  return {
    unreadInsights,
    unreadByCategory,
    totalUnread: unreadInsights.length,
    hasUnread: unreadInsights.length > 0,
  };
};

export const useHighPriorityInsights = (propertyId?: string, timeRange?: string) => {
  const { data: dashboard } = useInsightsDashboard(propertyId, timeRange);
  
  const highPriorityInsights = dashboard?.categories.flatMap(category =>
    category.insights.filter(insight => insight.priority === 'high' || insight.priority === 'critical')
  ) || [];
  
  const criticalInsights = highPriorityInsights.filter(insight => insight.priority === 'critical');
  
  return {
    highPriorityInsights,
    criticalInsights,
    totalHighPriority: highPriorityInsights.length,
    totalCritical: criticalInsights.length,
    hasUrgentInsights: criticalInsights.length > 0,
  };
};

export const useInsightStats = (propertyId?: string, timeRange?: string) => {
  const { data: dashboard } = useInsightsDashboard(propertyId, timeRange);
  
  if (!dashboard) {
    return {
      totalInsights: 0,
      readInsights: 0,
      implementedRecommendations: 0,
      readPercentage: 0,
      implementationRate: 0,
    };
  }
  
  const allInsights = dashboard.categories.flatMap(category => category.insights);
  const readInsights = allInsights.filter(insight => insight.read);
  const allRecommendations = allInsights.flatMap(insight => insight.recommendations);
  const implementedRecommendations = allRecommendations.filter(rec => rec.status === 'implemented');
  
  return {
    totalInsights: allInsights.length,
    readInsights: readInsights.length,
    implementedRecommendations: implementedRecommendations.length,
    totalRecommendations: allRecommendations.length,
    readPercentage: allInsights.length ? (readInsights.length / allInsights.length) * 100 : 0,
    implementationRate: allRecommendations.length ? (implementedRecommendations.length / allRecommendations.length) * 100 : 0,
    lastUpdated: dashboard.lastUpdated,
  };
};

export const usePrefetchInsightsData = () => {
  const queryClient = useQueryClient();
  
  return (propertyId?: string, timeRange?: string) => {
    // Prefetch dashboard
    queryClient.prefetchQuery({
      queryKey: queryKeys.insights.dashboard(propertyId, timeRange),
      queryFn: () => aiInsightsService.getInsightsDashboard(propertyId, timeRange),
      staleTime: 5 * 60 * 1000,
    });
    
    // Prefetch categories
    queryClient.prefetchQuery({
      queryKey: queryKeys.insights.categories(),
      queryFn: () => aiInsightsService.getInsightCategories(),
      staleTime: 30 * 60 * 1000,
    });
  };
};