/**
 * Centralized exports for all React Query hooks
 * Provides easy access to all AI service hooks
 */

// AI Service hooks
export * from './useAIService';

// Personalization hooks
export * from './usePersonalization';

// Emergency Response hooks
export * from './useEmergencyResponse';

// Document Verification hooks
export * from './useDocumentVerification';

// Building Health hooks
export * from './useBuildingHealth';

// AI Insights hooks
export * from './useAIInsights';

// Market Intelligence hooks
export * from './useMarketIntelligence';

// Re-export query client utilities
export { queryClient, queryKeys, cacheUtils } from '../config/queryClient';