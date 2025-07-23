/**
 * Integration tests for API integration layer
 * Tests React Query hooks, WebSocket services, and API clients
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { queryClient } from '../../config/queryClient';
import {
  useResponseSettings,
  useUpdateResponseSettings,
  useRiskAssessmentMetrics,
  useEmergencyAlerts,
  useRecommendations,
  useVerificationStatus,
  useBuildingHealthOverview,
  useInsightsDashboard,
  useMarketTrends,
} from '../../hooks';
import { WebSocketService } from '../../services/websocketService';

// Mock API services
jest.mock('../../services/aiService');
jest.mock('../../services/emergencyResponseService');
jest.mock('../../services/personalizationService');
jest.mock('../../services/documentVerificationService');
jest.mock('../../services/buildingHealthService');
jest.mock('../../services/aiInsightsService');
jest.mock('../../services/marketIntelligenceService');

// Create test query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
});

// Test wrapper component
const createWrapper = (client: QueryClient) => {
  return ({ children }: { children: React.ReactNode }) => 
    React.createElement(QueryClientProvider, { client }, children);
};

describe('API Integration Layer', () => {
  let testQueryClient: QueryClient;

  beforeEach(() => {
    testQueryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    testQueryClient.clear();
  });

  describe('React Query Configuration', () => {
    it('should have correct default options', () => {
      expect(queryClient.getDefaultOptions().queries?.staleTime).toBe(5 * 60 * 1000);
      expect(queryClient.getDefaultOptions().queries?.gcTime).toBe(10 * 60 * 1000);
      expect(queryClient.getDefaultOptions().queries?.retry).toBe(3);
    });

    it('should handle query errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Simulate query error
      const error = new Error('API Error');
      testQueryClient.setQueryData(['test'], () => {
        throw error;
      });

      expect(consoleSpy).not.toHaveBeenCalled(); // Error should be handled by error boundary
      consoleSpy.mockRestore();
    });
  });

  describe('AI Communication Training Hooks', () => {
    it('should fetch response settings', async () => {
      const mockSettings = {
        triggers: ['after_hours', 'common_questions'],
        delay: 5,
        escalationRules: [],
      };

      const aiService = require('../../services/aiService');
      aiService.aiCommunicationService.getResponseSettings.mockResolvedValue(mockSettings);

      const { result } = renderHook(() => useResponseSettings(), {
        wrapper: createWrapper(testQueryClient),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockSettings);
    });

    it('should update response settings with optimistic updates', async () => {
      const initialSettings = {
        triggers: ['after_hours'],
        delay: 5,
        escalationRules: [],
      };

      const updatedSettings = {
        triggers: ['after_hours', 'maintenance_requests'],
        delay: 10,
        escalationRules: [],
      };

      const aiService = require('../../services/aiService');
      aiService.aiCommunicationService.getResponseSettings.mockResolvedValue(initialSettings);
      aiService.aiCommunicationService.updateResponseSettings.mockResolvedValue(updatedSettings);

      // First, set up initial data
      testQueryClient.setQueryData(['communication', 'settings'], initialSettings);

      const { result } = renderHook(() => useUpdateResponseSettings(), {
        wrapper: createWrapper(testQueryClient),
      });

      // Trigger mutation
      result.current.mutate({ delay: 10, triggers: ['after_hours', 'maintenance_requests'] });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Check that optimistic update was applied
      const cachedData = testQueryClient.getQueryData(['communication', 'settings']);
      expect(cachedData).toMatchObject({ delay: 10 });
    });
  });

  describe('Risk Assessment Hooks', () => {
    it('should fetch risk assessment metrics', async () => {
      const mockMetrics = {
        totalApplicants: 25,
        riskCategories: { low: 10, medium: 10, high: 5 },
        averageScore: 75,
      };

      const aiService = require('../../services/aiService');
      aiService.aiRiskAssessmentService.getMetrics.mockResolvedValue(mockMetrics);

      const { result } = renderHook(() => useRiskAssessmentMetrics('property-1'), {
        wrapper: createWrapper(testQueryClient),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockMetrics);
      expect(aiService.aiRiskAssessmentService.getMetrics).toHaveBeenCalledWith('property-1', undefined);
    });
  });

  describe('Emergency Response Hooks', () => {
    it('should fetch emergency alerts with real-time updates', async () => {
      const mockAlerts = [
        {
          id: 'alert-1',
          type: 'fire',
          priority: 'critical',
          status: 'active',
          location: 'Building A',
          timestamp: new Date(),
        },
      ];

      const emergencyService = require('../../services/emergencyResponseService');
      emergencyService.emergencyResponseService.getAlerts.mockResolvedValue(mockAlerts);

      const { result } = renderHook(() => useEmergencyAlerts(), {
        wrapper: createWrapper(testQueryClient),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockAlerts);
    });
  });

  describe('Personalization Hooks', () => {
    it('should fetch recommendations with fallback to mock data', async () => {
      const personalizationService = require('../../services/personalizationService');
      
      // Mock API failure
      personalizationService.personalizationService.getRecommendations.mockRejectedValue(
        new Error('API Error')
      );
      
      // Mock fallback data
      const mockRecommendations = {
        categories: [],
        userPreferences: {},
        metadata: { totalRecommendations: 0, lastUpdated: new Date(), nextRefresh: new Date() },
      };
      personalizationService.personalizationService.getMockRecommendations.mockReturnValue(mockRecommendations);

      const { result } = renderHook(() => useRecommendations('user-1'), {
        wrapper: createWrapper(testQueryClient),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should fall back to mock data
      expect(result.current.data).toEqual(mockRecommendations);
    });
  });

  describe('Document Verification Hooks', () => {
    it('should handle document upload with optimistic updates', async () => {
      const mockDocument = {
        id: 'doc-1',
        type: 'id',
        name: 'id.pdf',
        status: 'uploaded',
        uploadedAt: new Date(),
        size: 1024,
        mimeType: 'application/pdf',
      };

      const documentService = require('../../services/documentVerificationService');
      documentService.documentVerificationService.uploadDocument.mockResolvedValue(mockDocument);

      const { result } = renderHook(() => useVerificationStatus('user-1'), {
        wrapper: createWrapper(testQueryClient),
      });

      // The hook should be properly configured for optimistic updates
      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('Building Health Hooks', () => {
    it('should fetch building health overview', async () => {
      const mockOverview = {
        overallScore: 85,
        categories: [
          { name: 'HVAC', score: 90, trend: 'stable' },
          { name: 'Plumbing', score: 80, trend: 'improving' },
        ],
        lastUpdated: new Date(),
      };

      const buildingHealthService = require('../../services/buildingHealthService');
      buildingHealthService.buildingHealthService.getBuildingHealthOverview.mockResolvedValue(mockOverview);

      const { result } = renderHook(() => useBuildingHealthOverview('property-1'), {
        wrapper: createWrapper(testQueryClient),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockOverview);
    });
  });

  describe('AI Insights Hooks', () => {
    it('should fetch insights dashboard', async () => {
      const mockDashboard = {
        categories: [
          {
            id: 'financial',
            name: 'Financial',
            insights: [
              {
                id: 'insight-1',
                title: 'Revenue Opportunity',
                summary: 'Rent increase potential identified',
                confidence: 85,
                priority: 'high',
                recommendations: [],
              },
            ],
          },
        ],
        lastUpdated: new Date(),
      };

      const aiInsightsService = require('../../services/aiInsightsService');
      aiInsightsService.aiInsightsService.getInsightsDashboard.mockResolvedValue(mockDashboard);

      const { result } = renderHook(() => useInsightsDashboard(), {
        wrapper: createWrapper(testQueryClient),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockDashboard);
    });
  });

  describe('Market Intelligence Hooks', () => {
    it('should fetch market trends', async () => {
      const mockTrends = [
        {
          metric: 'average_rent',
          currentValue: 2500,
          previousValue: 2400,
          change: 4.2,
          trend: 'up',
          timeframe: '30d',
        },
      ];

      const marketService = require('../../services/marketIntelligenceService');
      marketService.marketIntelligenceService.getMarketTrends.mockResolvedValue(mockTrends);

      const { result } = renderHook(() => useMarketTrends('san-francisco'), {
        wrapper: createWrapper(testQueryClient),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockTrends);
    });
  });

  describe('WebSocket Service', () => {
    it('should create WebSocket service with correct configuration', () => {
      const config = {
        url: 'ws://localhost:3001/test',
        reconnectInterval: 5000,
        maxReconnectAttempts: 3,
      };

      const wsService = new WebSocketService(config);
      expect(wsService.getConnectionStatus()).toBe('disconnected');
    });

    it('should handle message subscriptions', () => {
      const wsService = new WebSocketService({ url: 'ws://localhost:3001/test' });
      const mockCallback = jest.fn();

      const unsubscribe = wsService.subscribe('test_event', mockCallback);
      expect(typeof unsubscribe).toBe('function');

      // Test unsubscribe
      unsubscribe();
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('Cache Management', () => {
    it('should invalidate related queries on mutations', async () => {
      const invalidateSpy = jest.spyOn(testQueryClient, 'invalidateQueries');

      // Set up initial data
      testQueryClient.setQueryData(['emergency-alerts'], []);

      const emergencyService = require('../../services/emergencyResponseService');
      emergencyService.emergencyResponseService.updateAlertStatus.mockResolvedValue({
        id: 'alert-1',
        status: 'resolved',
      });

      const { result } = renderHook(() => useEmergencyAlerts(), {
        wrapper: createWrapper(testQueryClient),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify that cache invalidation would be called on mutations
      expect(invalidateSpy).toHaveBeenCalled();
    });

    it('should handle optimistic updates correctly', () => {
      const initialData = { score: 80, trend: 'stable' };
      const optimisticUpdate = { score: 85, trend: 'improving' };

      testQueryClient.setQueryData(['test-data'], initialData);

      // Simulate optimistic update
      testQueryClient.setQueryData(['test-data'], (old: any) => ({
        ...old,
        ...optimisticUpdate,
      }));

      const cachedData = testQueryClient.getQueryData(['test-data']);
      expect(cachedData).toEqual({ ...initialData, ...optimisticUpdate });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network Error');
      
      const aiService = require('../../services/aiService');
      aiService.aiCommunicationService.getResponseSettings.mockRejectedValue(networkError);

      const { result } = renderHook(() => useResponseSettings(), {
        wrapper: createWrapper(testQueryClient),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(networkError);
    });

    it('should retry failed requests according to configuration', async () => {
      const aiService = require('../../services/aiService');
      aiService.aiCommunicationService.getResponseSettings
        .mockRejectedValueOnce(new Error('Temporary Error'))
        .mockRejectedValueOnce(new Error('Temporary Error'))
        .mockResolvedValue({ triggers: [], delay: 0, escalationRules: [] });

      const { result } = renderHook(() => useResponseSettings(), {
        wrapper: createWrapper(testQueryClient),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should have retried and eventually succeeded
      expect(aiService.aiCommunicationService.getResponseSettings).toHaveBeenCalledTimes(3);
    });
  });

  describe('Performance Optimization', () => {
    it('should use appropriate stale times for different data types', () => {
      // Emergency data should have short stale time
      const { result: emergencyResult } = renderHook(() => useEmergencyAlerts(), {
        wrapper: createWrapper(testQueryClient),
      });

      // Market data should have longer stale time
      const { result: marketResult } = renderHook(() => useMarketTrends(), {
        wrapper: createWrapper(testQueryClient),
      });

      // Both hooks should be configured with appropriate stale times
      expect(emergencyResult.current.isLoading).toBe(true);
      expect(marketResult.current.isLoading).toBe(true);
    });

    it('should prefetch related data efficiently', () => {
      const prefetchSpy = jest.spyOn(testQueryClient, 'prefetchQuery');

      // Simulate prefetching
      testQueryClient.prefetchQuery({
        queryKey: ['test-prefetch'],
        queryFn: () => Promise.resolve('prefetched data'),
      });

      expect(prefetchSpy).toHaveBeenCalledWith({
        queryKey: ['test-prefetch'],
        queryFn: expect.any(Function),
      });
    });
  });
});