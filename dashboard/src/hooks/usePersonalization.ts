/**
 * React Query hooks for personalization service
 * Provides data fetching and caching for personalized recommendations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../config/queryClient';
import { personalizationService } from '../services/personalizationService';
import type {
  RecommendationsResponse,
  UserPreferences,
  RecommendationFeedback,
  PersonalizationExplanation
} from '../types/personalization';

// ============================================================================
// Personalization Hooks
// ============================================================================

export const useRecommendations = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.personalization.recommendations(userId),
    queryFn: () => personalizationService.getRecommendations(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    // Use mock data in development if API fails
    placeholderData: () => personalizationService.getMockRecommendations(),
  });
};

export const useUserPreferences = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.personalization.preferences(userId),
    queryFn: async () => {
      const recommendations = await personalizationService.getRecommendations(userId);
      return recommendations.userPreferences;
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useUpdatePreferences = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, preferences }: { userId: string; preferences: Partial<UserPreferences> }) =>
      personalizationService.updatePreferences(userId, preferences),
    onMutate: async ({ userId, preferences }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.personalization.preferences(userId) 
      });
      
      // Snapshot previous value
      const previousPreferences = queryClient.getQueryData(
        queryKeys.personalization.preferences(userId)
      );
      
      // Optimistically update preferences
      queryClient.setQueryData(
        queryKeys.personalization.preferences(userId),
        (old: UserPreferences | undefined) => ({
          ...old,
          ...preferences,
        } as UserPreferences)
      );
      
      return { previousPreferences, userId };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousPreferences && context?.userId) {
        queryClient.setQueryData(
          queryKeys.personalization.preferences(context.userId),
          context.previousPreferences
        );
      }
    },
    onSuccess: (updatedPreferences, { userId }) => {
      // Update preferences in cache
      queryClient.setQueryData(
        queryKeys.personalization.preferences(userId),
        updatedPreferences
      );
      
      // Invalidate recommendations to trigger refresh with new preferences
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.personalization.recommendations(userId) 
      });
    },
  });
};

export const useSubmitRecommendationFeedback = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (feedback: RecommendationFeedback) =>
      personalizationService.submitFeedback(feedback),
    onSuccess: (_, feedback) => {
      // Optimistically update the recommendation in cache
      queryClient.setQueryData(
        queryKeys.personalization.recommendations(feedback.userId),
        (oldData: RecommendationsResponse | undefined) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            categories: oldData.categories.map(category => ({
              ...category,
              items: category.items.map(item => {
                if (item.id === feedback.itemId) {
                  return {
                    ...item,
                    // Add feedback indicator or update item based on feedback
                    userFeedback: feedback.type,
                  };
                }
                return item;
              }),
            })),
          };
        }
      );
      
      // Invalidate recommendations to get updated suggestions
      setTimeout(() => {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.personalization.recommendations(feedback.userId) 
        });
      }, 1000); // Delay to allow backend processing
    },
  });
};

export const useRecommendationExplanation = (userId: string, itemId: string) => {
  return useQuery({
    queryKey: queryKeys.personalization.explanation(userId, itemId),
    queryFn: () => personalizationService.getExplanation(userId, itemId),
    enabled: !!userId && !!itemId,
    staleTime: 15 * 60 * 1000, // 15 minutes (explanations don't change often)
  });
};

export const useRefreshRecommendations = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: string) => personalizationService.refreshRecommendations(userId),
    onMutate: async (userId) => {
      // Show loading state by invalidating current data
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.personalization.recommendations(userId) 
      });
    },
    onSuccess: (_, userId) => {
      // Invalidate and refetch recommendations
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.personalization.recommendations(userId) 
      });
    },
  });
};

// ============================================================================
// Utility Hooks
// ============================================================================

export const useRecommendationsByCategory = (userId: string, categoryType?: string) => {
  const { data: recommendations, ...rest } = useRecommendations(userId);
  
  const filteredRecommendations = recommendations?.categories.filter(
    category => !categoryType || category.type === categoryType
  );
  
  return {
    data: filteredRecommendations,
    recommendations,
    ...rest,
  };
};

export const usePrefetchRecommendations = () => {
  const queryClient = useQueryClient();
  
  return (userId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.personalization.recommendations(userId),
      queryFn: () => personalizationService.getRecommendations(userId),
      staleTime: 5 * 60 * 1000,
    });
  };
};

// Hook for tracking recommendation interactions
export const useTrackRecommendationInteraction = () => {
  return useMutation({
    mutationFn: async ({ 
      userId, 
      itemId, 
      action 
    }: { 
      userId: string; 
      itemId: string; 
      action: 'view' | 'click' | 'dismiss';
    }) => {
      // Track interaction (could be sent to analytics service)
      console.log('Recommendation interaction:', { userId, itemId, action });
      
      // You could integrate with analytics service here
      // await analyticsService.track('recommendation_interaction', { userId, itemId, action });
    },
  });
};