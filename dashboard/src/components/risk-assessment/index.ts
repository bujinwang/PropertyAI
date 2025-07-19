/**
 * Risk Assessment Dashboard Components
 * Export all components for the AI Risk Assessment Dashboard
 */

export { RiskAssessmentDashboard } from './RiskAssessmentDashboard';
export { SummaryMetrics } from './SummaryMetrics';
export { ApplicantList } from './ApplicantList';
export { RiskLevelIndicator } from './RiskLevelIndicator';

// Re-export types for convenience
export type {
  RiskAssessmentDashboardProps,
  SummaryMetricsProps,
  ApplicantListProps,
  RiskLevelIndicatorProps,
  RiskAssessment,
  Applicant,
  RiskAssessmentMetrics,
  RiskLevel,
  RiskFactor,
} from '../../types/risk-assessment';