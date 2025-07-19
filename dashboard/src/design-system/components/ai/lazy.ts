/**
 * Lazy-loaded AI components for code splitting optimization
 * This module provides dynamic imports for AI components to reduce initial bundle size
 */

import { lazy } from 'react';

// Core AI components with lazy loading
export const LazyAIGeneratedContent = lazy(() => import('./AIGeneratedContent'));
export const LazyConfidenceIndicator = lazy(() => import('./ConfidenceIndicator'));
export const LazySuggestionChip = lazy(() => import('./SuggestionChip'));
export const LazyExplanationTooltip = lazy(() => import('./ExplanationTooltip'));
export const LazyLoadingStateIndicator = lazy(() => import('./LoadingStateIndicator'));

// AI screen components with lazy loading
export const LazyAICommunicationTrainingScreen = lazy(() => 
  import('../../../pages/AICommunicationTrainingScreen')
);
export const LazyAIRiskAssessmentDashboard = lazy(() => 
  import('../../../pages/AIRiskAssessmentDashboard')
);
export const LazyEmergencyResponseCenterScreen = lazy(() => 
  import('../../../pages/EmergencyResponseCenterScreen')
);
export const LazyAIPersonalizationDashboard = lazy(() => 
  import('../../../pages/AIPersonalizationDashboard')
);
export const LazyDocumentVerificationStatusScreen = lazy(() => 
  import('../../../pages/DocumentVerificationStatusScreen')
);
export const LazyBuildingHealthMonitorScreen = lazy(() => 
  import('../../../pages/BuildingHealthMonitorScreen')
);
export const LazyAIInsightsDashboard = lazy(() => 
  import('../../../pages/AIInsightsDashboard')
);
export const LazyMarketIntelligenceScreen = lazy(() => 
  import('../../../pages/MarketIntelligenceScreen')
);

// Preload functions for critical AI components
export const preloadCoreAIComponents = () => {
  // Preload core AI components
  import('./AIGeneratedContent');
  import('./ConfidenceIndicator');
  import('./SuggestionChip');
};

export const preloadAIScreens = () => {
  // Preload AI screens
  import('../../../pages/AICommunicationTrainingScreen');
  import('../../../pages/AIRiskAssessmentDashboard');
  import('../../../pages/EmergencyResponseCenterScreen');
};

// Component loading priorities for performance optimization
export const AI_COMPONENT_PRIORITIES = {
  HIGH: ['AIGeneratedContent', 'ConfidenceIndicator', 'LoadingStateIndicator'],
  MEDIUM: ['SuggestionChip', 'ExplanationTooltip'],
  LOW: ['AICommunicationTrainingScreen', 'AIRiskAssessmentDashboard'],
} as const;

// Bundle size estimates (in KB) for monitoring
export const AI_COMPONENT_SIZES = {
  AIGeneratedContent: 15,
  ConfidenceIndicator: 12,
  SuggestionChip: 10,
  ExplanationTooltip: 8,
  LoadingStateIndicator: 6,
  AICommunicationTrainingScreen: 45,
  AIRiskAssessmentDashboard: 38,
  EmergencyResponseCenterScreen: 42,
} as const;