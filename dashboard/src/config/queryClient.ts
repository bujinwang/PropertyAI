/**
 * React Query Configuration
 * Provides centralized configuration for data fetching and caching
 */

import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';

// Error handler for queries
const handleQueryError = (error: unknown) => {
  console.error('Query error:', error);
  // You can add global error handling here (e.g., toast notifications)
};

// Error handler for mutations
const handleMutationError = (error: unknown) => {
  console.error('Mutation error:', error);
  // You can add global error handling here (e.g., toast notifications)
};

// Create query client with default configuration
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: handleQueryError,
  }),
  mutationCache: new MutationCache({
    onError: handleMutationError,
  }),
  defaultOptions: {
    queries: {
      // Stale time: 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache time: 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 3 times
      retry: 3,
      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus for critical data
      refetchOnWindowFocus: true,
      // Don't refetch on reconnect by default
      refetchOnReconnect: false,
      // Network mode: online (pause queries when offline)
      networkMode: 'online',
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
      // Network mode: online
      networkMode: 'online',
    },
  },
});

// Query keys for consistent cache management
export const queryKeys = {
  // AI Communication Training
  communication: {
    all: ['communication'] as const,
    settings: () => [...queryKeys.communication.all, 'settings'] as const,
    scenarios: (category?: string) => 
      [...queryKeys.communication.all, 'scenarios', category] as const,
    toneStyle: () => [...queryKeys.communication.all, 'tone-style'] as const,
    templates: () => [...queryKeys.communication.all, 'templates'] as const,
    pendingTemplates: () => [...queryKeys.communication.templates(), 'pending'] as const,
  },
  
  // Risk Assessment
  riskAssessment: {
    all: ['risk-assessment'] as const,
    metrics: (propertyId?: string, dateRange?: { start: Date; end: Date }) =>
      [...queryKeys.riskAssessment.all, 'metrics', propertyId, dateRange] as const,
    applicants: (filters?: Record<string, any>) =>
      [...queryKeys.riskAssessment.all, 'applicants', filters] as const,
    assessment: (applicantId: string) =>
      [...queryKeys.riskAssessment.all, 'assessment', applicantId] as const,
    comparison: (applicantIds: string[]) =>
      [...queryKeys.riskAssessment.all, 'comparison', applicantIds] as const,
  },
  
  // Emergency Response
  emergency: {
    all: ['emergency'] as const,
    alerts: (propertyId?: string) =>
      [...queryKeys.emergency.all, 'alerts', propertyId] as const,
    alert: (alertId: string) =>
      [...queryKeys.emergency.all, 'alert', alertId] as const,
    contacts: (propertyId?: string) =>
      [...queryKeys.emergency.all, 'contacts', propertyId] as const,
    protocols: (alertType?: string) =>
      [...queryKeys.emergency.all, 'protocols', alertType] as const,
  },
  
  // Personalization
  personalization: {
    all: ['personalization'] as const,
    recommendations: (userId: string) =>
      [...queryKeys.personalization.all, 'recommendations', userId] as const,
    preferences: (userId: string) =>
      [...queryKeys.personalization.all, 'preferences', userId] as const,
    explanation: (userId: string, itemId: string) =>
      [...queryKeys.personalization.all, 'explanation', userId, itemId] as const,
  },
  
  // Document Verification
  documentVerification: {
    all: ['document-verification'] as const,
    status: (userId: string) =>
      [...queryKeys.documentVerification.all, 'status', userId] as const,
    documents: (userId: string) =>
      [...queryKeys.documentVerification.all, 'documents', userId] as const,
  },
  
  // Building Health
  buildingHealth: {
    all: ['building-health'] as const,
    overview: (propertyId: string) =>
      [...queryKeys.buildingHealth.all, 'overview', propertyId] as const,
    metrics: (propertyId: string, timeRange?: string) =>
      [...queryKeys.buildingHealth.all, 'metrics', propertyId, timeRange] as const,
    hotspots: (propertyId: string) =>
      [...queryKeys.buildingHealth.all, 'hotspots', propertyId] as const,
    alerts: (propertyId: string) =>
      [...queryKeys.buildingHealth.all, 'alerts', propertyId] as const,
  },
  
  // AI Insights
  insights: {
    all: ['insights'] as const,
    dashboard: (propertyId?: string, timeRange?: string) =>
      [...queryKeys.insights.all, 'dashboard', propertyId, timeRange] as const,
    categories: () => [...queryKeys.insights.all, 'categories'] as const,
    insight: (insightId: string) =>
      [...queryKeys.insights.all, 'insight', insightId] as const,
  },
  
  // Market Intelligence
  marketIntelligence: {
    all: ['market-intelligence'] as const,
    trends: (location?: string, timeRange?: string) =>
      [...queryKeys.marketIntelligence.all, 'trends', location, timeRange] as const,
    competitors: (location?: string) =>
      [...queryKeys.marketIntelligence.all, 'competitors', location] as const,
    forecasts: (location?: string) =>
      [...queryKeys.marketIntelligence.all, 'forecasts', location] as const,
    opportunities: (location?: string) =>
      [...queryKeys.marketIntelligence.all, 'opportunities', location] as const,
  },

  // Dashboard Data
  dashboard: {
    all: ['dashboard'] as const,
    vacantUnits: () => [...queryKeys.dashboard.all, 'vacant-units'] as const,
    maintenanceRequests: () => [...queryKeys.dashboard.all, 'maintenance-requests'] as const,
    workOrders: () => [...queryKeys.dashboard.all, 'work-orders'] as const,
    overduePayments: (filters?: Record<string, any>) => [...queryKeys.dashboard.all, 'overdue-payments', filters] as const,
    financialReports: (params?: Record<string, any>) => [...queryKeys.dashboard.all, 'financial-reports', params] as const,
    documents: (filters?: Record<string, any>) => [...queryKeys.dashboard.all, 'documents', filters] as const,
  },
} as const;

// Utility functions for cache management
export const cacheUtils = {
  // Invalidate all queries for a specific feature
  invalidateFeature: (feature: keyof typeof queryKeys) => {
    return queryClient.invalidateQueries({
      queryKey: queryKeys[feature].all,
    });
  },
  
  // Remove all cached data for a specific feature
  removeFeature: (feature: keyof typeof queryKeys) => {
    return queryClient.removeQueries({
      queryKey: queryKeys[feature].all,
    });
  },
  
  // Prefetch query with error handling
  prefetch: async (queryKey: readonly unknown[], queryFn: () => Promise<any>) => {
    try {
      await queryClient.prefetchQuery({
        queryKey,
        queryFn,
      });
    } catch (error) {
      console.warn('Prefetch failed:', error);
    }
  },
  
  // Set query data with optimistic updates
  setOptimisticData: <T>(queryKey: readonly unknown[], updater: (old: T | undefined) => T) => {
    queryClient.setQueryData(queryKey, updater);
  },
  
  // Cancel outgoing queries
  cancelQueries: (queryKey: readonly unknown[]) => {
    return queryClient.cancelQueries({ queryKey });
  },
};

export default queryClient;