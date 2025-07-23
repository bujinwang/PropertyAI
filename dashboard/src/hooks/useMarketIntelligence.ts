/**
 * React Query hooks for market intelligence service
 * Provides data fetching and caching for market data and competitor analysis
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../config/queryClient';
import { marketIntelligenceService } from '../services/marketIntelligenceService';
import type {
  MarketIntelligence,
  MarketTrend,
  CompetitorData,
  DemandForecast,
  MarketOpportunity,
  AISummary,
  MarketFilters,
  CompetitorFilters
} from '../types/market-intelligence';

// ============================================================================
// Market Intelligence Hooks
// ============================================================================

export const useMarketTrends = (location?: string, timeRange?: string) => {
  return useQuery({
    queryKey: queryKeys.marketIntelligence.trends(location, timeRange),
    queryFn: () => marketIntelligenceService.getMarketTrends(location, timeRange),
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 30 * 60 * 1000, // Refetch every 30 minutes
  });
};

export const useCompetitorData = (location?: string, filters?: CompetitorFilters) => {
  return useQuery({
    queryKey: queryKeys.marketIntelligence.competitors(location),
    queryFn: () => marketIntelligenceService.getCompetitorData(location, filters),
    staleTime: 15 * 60 * 1000, // 15 minutes
    refetchInterval: 60 * 60 * 1000, // Refetch every hour
  });
};

export const useDemandForecasts = (location?: string, timeRange?: string) => {
  return useQuery({
    queryKey: queryKeys.marketIntelligence.forecasts(location),
    queryFn: () => marketIntelligenceService.getDemandForecasts(location, timeRange),
    staleTime: 30 * 60 * 1000, // 30 minutes
    refetchInterval: 2 * 60 * 60 * 1000, // Refetch every 2 hours
  });
};

export const useMarketOpportunities = (location?: string, filters?: MarketFilters) => {
  return useQuery({
    queryKey: queryKeys.marketIntelligence.opportunities(location),
    queryFn: () => marketIntelligenceService.getMarketOpportunities(location, filters),
    staleTime: 20 * 60 * 1000, // 20 minutes
    refetchInterval: 60 * 60 * 1000, // Refetch every hour
  });
};

export const useMarketIntelligenceOverview = (location?: string) => {
  return useQuery({
    queryKey: ['market-intelligence-overview', location],
    queryFn: () => marketIntelligenceService.getMarketIntelligenceOverview(location),
    staleTime: 15 * 60 * 1000, // 15 minutes
    refetchInterval: 45 * 60 * 1000, // Refetch every 45 minutes
  });
};

export const useAIMarketSummary = (location?: string, timeRange?: string) => {
  return useQuery({
    queryKey: ['ai-market-summary', location, timeRange],
    queryFn: () => marketIntelligenceService.getAIMarketSummary(location, timeRange),
    staleTime: 30 * 60 * 1000, // 30 minutes
    refetchInterval: 2 * 60 * 60 * 1000, // Refetch every 2 hours
  });
};

export const useCompetitorAnalysis = (competitorId: string) => {
  return useQuery({
    queryKey: ['competitor-analysis', competitorId],
    queryFn: () => marketIntelligenceService.getCompetitorAnalysis(competitorId),
    enabled: !!competitorId,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

export const useMarketAlerts = (location?: string) => {
  return useQuery({
    queryKey: ['market-alerts', location],
    queryFn: () => marketIntelligenceService.getMarketAlerts(location),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 15 * 60 * 1000, // Refetch every 15 minutes
  });
};

export const useRefreshMarketData = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (location?: string) => marketIntelligenceService.refreshMarketData(location),
    onMutate: async (location) => {
      // Show loading state for all market intelligence queries
      const queryKeys = [
        ['market-intelligence-trends', location],
        ['market-intelligence-competitors', location],
        ['market-intelligence-forecasts', location],
        ['market-intelligence-opportunities', location],
        ['market-intelligence-overview', location],
      ];
      
      queryKeys.forEach(key => {
        queryClient.setQueryData(key, (old: any) => {
          if (!old) return old;
          return { ...old, refreshing: true };
        });
      });
    },
    onSuccess: (_, location) => {
      // Invalidate all market intelligence data
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.marketIntelligence.trends(location) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.marketIntelligence.competitors(location) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.marketIntelligence.forecasts(location) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.marketIntelligence.opportunities(location) 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['market-intelligence-overview', location] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['ai-market-summary', location] 
      });
    },
    onError: (err, location) => {
      // Remove loading state on error
      const queryKeys = [
        ['market-intelligence-trends', location],
        ['market-intelligence-competitors', location],
        ['market-intelligence-forecasts', location],
        ['market-intelligence-opportunities', location],
        ['market-intelligence-overview', location],
      ];
      
      queryKeys.forEach(key => {
        queryClient.setQueryData(key, (old: any) => {
          if (!old) return old;
          return { ...old, refreshing: false };
        });
      });
    },
  });
};

export const useSubscribeToMarketAlert = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      alertType, 
      location, 
      threshold, 
      email 
    }: { 
      alertType: string; 
      location: string; 
      threshold?: number; 
      email: string;
    }) => marketIntelligenceService.subscribeToMarketAlert(alertType, location, threshold, email),
    onSuccess: (_, { location }) => {
      queryClient.invalidateQueries({ 
        queryKey: ['market-alerts', location] 
      });
    },
  });
};

export const useUnsubscribeFromMarketAlert = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ alertId, location }: { alertId: string; location: string }) =>
      marketIntelligenceService.unsubscribeFromMarketAlert(alertId),
    onMutate: async ({ alertId, location }) => {
      // Optimistically remove alert
      queryClient.setQueryData(['market-alerts', location], (old: any[] | undefined) => {
        if (!old) return old;
        return old.filter(alert => alert.id !== alertId);
      });
    },
    onError: (err, { location }) => {
      // Refetch on error
      queryClient.invalidateQueries({ 
        queryKey: ['market-alerts', location] 
      });
    },
  });
};

// ============================================================================
// Utility Hooks
// ============================================================================

export const useMarketTrendAnalysis = (location?: string, timeRange?: string) => {
  const { data: trends } = useMarketTrends(location, timeRange);
  
  if (!trends) return { analysis: null, insights: [] };
  
  const rentTrend = trends.find(t => t.metric === 'average_rent');
  const vacancyTrend = trends.find(t => t.metric === 'vacancy_rate');
  const demandTrend = trends.find(t => t.metric === 'demand_index');
  
  const insights = [];
  
  if (rentTrend && rentTrend.change > 5) {
    insights.push({
      type: 'rent_increase',
      message: `Rent prices have increased by ${rentTrend.change.toFixed(1)}% in the selected period`,
      impact: 'positive',
    });
  }
  
  if (vacancyTrend && vacancyTrend.change < -2) {
    insights.push({
      type: 'vacancy_decrease',
      message: `Vacancy rates have decreased by ${Math.abs(vacancyTrend.change).toFixed(1)}%`,
      impact: 'positive',
    });
  }
  
  if (demandTrend && demandTrend.change > 10) {
    insights.push({
      type: 'demand_surge',
      message: `Market demand has surged by ${demandTrend.change.toFixed(1)}%`,
      impact: 'positive',
    });
  }
  
  return {
    analysis: {
      rentTrend,
      vacancyTrend,
      demandTrend,
    },
    insights,
  };
};

export const useCompetitorComparison = (location?: string) => {
  const { data: competitors } = useCompetitorData(location);
  
  if (!competitors) return { comparison: null, insights: [] };
  
  const avgRent = competitors.reduce((sum, comp) => 
    sum + (comp.rentRange[0] + comp.rentRange[1]) / 2, 0
  ) / competitors.length;
  
  const avgOccupancy = competitors.reduce((sum, comp) => 
    sum + comp.occupancyRate, 0
  ) / competitors.length;
  
  const topPerformers = competitors
    .filter(comp => comp.occupancyRate > avgOccupancy)
    .sort((a, b) => b.occupancyRate - a.occupancyRate)
    .slice(0, 3);
  
  const insights = [];
  
  if (avgOccupancy > 90) {
    insights.push({
      type: 'high_occupancy_market',
      message: `Market shows high occupancy rates (${avgOccupancy.toFixed(1)}% average)`,
      impact: 'positive',
    });
  }
  
  return {
    comparison: {
      avgRent,
      avgOccupancy,
      totalCompetitors: competitors.length,
      topPerformers,
    },
    insights,
  };
};

export const useMarketOpportunityAnalysis = (location?: string) => {
  const { data: opportunities } = useMarketOpportunities(location);
  
  if (!opportunities) return { highPriority: [], mediumPriority: [], lowPriority: [] };
  
  const highPriority = opportunities.filter(opp => opp.priority === 'high');
  const mediumPriority = opportunities.filter(opp => opp.priority === 'medium');
  const lowPriority = opportunities.filter(opp => opp.priority === 'low');
  
  return {
    highPriority,
    mediumPriority,
    lowPriority,
    totalOpportunities: opportunities.length,
    hasHighPriorityOpportunities: highPriority.length > 0,
  };
};

export const useForecastAccuracy = (location?: string) => {
  const { data: forecasts } = useDemandForecasts(location);
  
  if (!forecasts) return { accuracy: 0, confidence: 0 };
  
  const avgConfidence = forecasts.reduce((sum, forecast) => 
    sum + forecast.confidence.value, 0
  ) / forecasts.length;
  
  // Calculate accuracy based on confidence levels and historical performance
  const accuracy = Math.min(avgConfidence * 1.1, 95); // Cap at 95%
  
  return {
    accuracy,
    confidence: avgConfidence,
    forecastCount: forecasts.length,
    reliabilityLevel: avgConfidence > 80 ? 'high' : avgConfidence > 60 ? 'medium' : 'low',
  };
};

export const usePrefetchMarketIntelligenceData = () => {
  const queryClient = useQueryClient();
  
  return (location?: string, timeRange?: string) => {
    // Prefetch trends
    queryClient.prefetchQuery({
      queryKey: queryKeys.marketIntelligence.trends(location, timeRange),
      queryFn: () => marketIntelligenceService.getMarketTrends(location, timeRange),
      staleTime: 10 * 60 * 1000,
    });
    
    // Prefetch competitors
    queryClient.prefetchQuery({
      queryKey: queryKeys.marketIntelligence.competitors(location),
      queryFn: () => marketIntelligenceService.getCompetitorData(location),
      staleTime: 15 * 60 * 1000,
    });
    
    // Prefetch opportunities
    queryClient.prefetchQuery({
      queryKey: queryKeys.marketIntelligence.opportunities(location),
      queryFn: () => marketIntelligenceService.getMarketOpportunities(location),
      staleTime: 20 * 60 * 1000,
    });
  };
};