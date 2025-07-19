/**
 * Lazy-loaded AI Components for Code Splitting
 * This file provides lazy-loaded versions of AI components to optimize bundle size
 */

import React from 'react';
import { createLazyAIComponent } from '../../utils/ai-performance';
import LoadingStateIndicator from '../../design-system/components/ai/LoadingStateIndicator';

// Lazy load AI screen components
export const LazyAICommunicationTrainingScreen = createLazyAIComponent(
  () => import('../../pages/AICommunicationTrainingScreen'),
  () => <LoadingStateIndicator message="Loading AI Communication Training..." variant="skeleton" />
);

export const LazyAIRiskAssessmentDashboard = createLazyAIComponent(
  () => import('../../pages/AIRiskAssessmentDashboard'),
  () => <LoadingStateIndicator message="Loading Risk Assessment Dashboard..." variant="skeleton" />
);

export const LazyEmergencyResponseCenterScreen = createLazyAIComponent(
  () => import('../../pages/EmergencyResponseCenterScreen'),
  () => <LoadingStateIndicator message="Loading Emergency Response Center..." variant="skeleton" />
);

export const LazyAIPersonalizationDashboard = createLazyAIComponent(
  () => import('../../pages/AIPersonalizationDashboard'),
  () => <LoadingStateIndicator message="Loading Personalization Dashboard..." variant="skeleton" />
);

export const LazyDocumentVerificationStatusScreen = createLazyAIComponent(
  () => import('../../pages/DocumentVerificationStatusScreen'),
  () => <LoadingStateIndicator message="Loading Document Verification..." variant="skeleton" />
);

export const LazyBuildingHealthMonitorScreen = createLazyAIComponent(
  () => import('../../pages/BuildingHealthMonitorScreen'),
  () => <LoadingStateIndicator message="Loading Building Health Monitor..." variant="skeleton" />
);

export const LazyAIInsightsDashboard = createLazyAIComponent(
  () => import('../../pages/AIInsightsDashboard'),
  () => <LoadingStateIndicator message="Loading AI Insights..." variant="skeleton" />
);

export const LazyMarketIntelligenceScreen = createLazyAIComponent(
  () => import('../../pages/MarketIntelligenceScreen'),
  () => <LoadingStateIndicator message="Loading Market Intelligence..." variant="skeleton" />
);

// Lazy load AI component groups
export const LazyRiskAssessmentComponents = createLazyAIComponent(
  () => import('../../components/risk-assessment'),
  () => <LoadingStateIndicator message="Loading Risk Assessment Components..." variant="spinner" />
);

export const LazyCommunicationTrainingComponents = createLazyAIComponent(
  () => import('../../components/communication-training'),
  () => <LoadingStateIndicator message="Loading Communication Training Components..." variant="spinner" />
);

// Lazy load heavy AI utilities
export const LazyAIAnalytics = createLazyAIComponent(
  () => import('../../utils/analytics'),
  () => <div>Loading Analytics...</div>
);

export const LazyAIMonitoring = createLazyAIComponent(
  () => import('../../utils/monitoring'),
  () => <div>Loading Monitoring...</div>
);

// Export all lazy components for easy importing
export default {
  LazyAICommunicationTrainingScreen,
  LazyAIRiskAssessmentDashboard,
  LazyEmergencyResponseCenterScreen,
  LazyAIPersonalizationDashboard,
  LazyDocumentVerificationStatusScreen,
  LazyBuildingHealthMonitorScreen,
  LazyAIInsightsDashboard,
  LazyMarketIntelligenceScreen,
  LazyRiskAssessmentComponents,
  LazyCommunicationTrainingComponents,
  LazyAIAnalytics,
  LazyAIMonitoring,
};