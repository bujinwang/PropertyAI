/**
 * AI Components Export - Optimized for Performance
 * Centralized exports for all AI-related components with tree shaking support
 */

// Core AI Components - Optimized for tree shaking
export { default as AIGeneratedContent } from './AIGeneratedContent';
export { default as ConfidenceIndicator } from './ConfidenceIndicator';
export { default as SuggestionChip } from './SuggestionChip';
export { default as ExplanationTooltip } from './ExplanationTooltip';
export { default as LoadingStateIndicator } from './LoadingStateIndicator';

// Lazy-loaded components for code splitting
export * from './lazy';

// Performance utilities
export * from '../../../utils/ai-performance';

// Re-export types for convenience
export type {
  AIGeneratedContentProps,
  ConfidenceIndicatorProps,
  SuggestionChipProps,
  ExplanationTooltipProps,
  LoadingStateIndicatorProps,
  AIContent,
  AIFeedback,
  AIExplanation,
  AISuggestion,
  ConfidenceScore,
  LoadingState,
} from '../../../types/ai';

// Component bundles for specific use cases (tree-shakeable)
export const CoreAIComponents = {
  AIGeneratedContent: () => import('./AIGeneratedContent'),
  ConfidenceIndicator: () => import('./ConfidenceIndicator'),
  SuggestionChip: () => import('./SuggestionChip'),
  ExplanationTooltip: () => import('./ExplanationTooltip'),
  LoadingStateIndicator: () => import('./LoadingStateIndicator'),
} as const;

export const AIScreenComponents = {
  AICommunicationTrainingScreen: () => import('../../../pages/AICommunicationTrainingScreen'),
  AIRiskAssessmentDashboard: () => import('../../../pages/AIRiskAssessmentDashboard'),
  EmergencyResponseCenterScreen: () => import('../../../pages/EmergencyResponseCenterScreen'),
  AIPersonalizationDashboard: () => import('../../../pages/AIPersonalizationDashboard'),
  DocumentVerificationStatusScreen: () => import('../../../pages/DocumentVerificationStatusScreen'),
  BuildingHealthMonitorScreen: () => import('../../../pages/BuildingHealthMonitorScreen'),
  AIInsightsDashboard: () => import('../../../pages/AIInsightsDashboard'),
  MarketIntelligenceScreen: () => import('../../../pages/MarketIntelligenceScreen'),
} as const;