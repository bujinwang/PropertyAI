/**
 * Risk Assessment Dashboard Types
 * Types and interfaces for AI-powered risk assessment features
 */

export type RiskLevel = 'low' | 'medium' | 'high';
export type RiskFactorImpact = 'positive' | 'negative' | 'neutral';

/**
 * Individual risk factor
 */
export interface RiskFactor {
  id: string;
  name: string;
  value: number | string;
  weight: number;
  impact: RiskFactorImpact;
  description: string;
  category: string;
}

/**
 * Complete risk assessment for an applicant
 */
export interface RiskAssessment {
  id: string;
  applicantId: string;
  applicantName: string;
  overallScore: number; // 0-100
  riskLevel: RiskLevel;
  factors: RiskFactor[];
  explanation: string;
  confidence: number; // 0-100
  createdAt: Date;
  updatedAt: Date;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
}

/**
 * Applicant basic information
 */
export interface Applicant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  applicationDate: Date;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  riskAssessment?: RiskAssessment;
}

/**
 * Dashboard summary metrics
 */
export interface RiskAssessmentMetrics {
  totalApplicants: number;
  riskCategories: {
    low: number;
    medium: number;
    high: number;
  };
  averageScore: number;
  pendingReviews: number;
  lastUpdated: Date;
}

/**
 * Risk category breakdown
 */
export interface RiskCategoryBreakdown {
  category: string;
  count: number;
  percentage: number;
  averageScore: number;
  trend: 'up' | 'down' | 'stable';
}

/**
 * Comparison data for multiple applicants
 */
export interface ApplicantComparison {
  applicants: RiskAssessment[];
  comparisonFactors: string[];
  recommendations: string[];
}

/**
 * Props for risk assessment dashboard
 */
export interface RiskAssessmentDashboardProps {
  propertyId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  onApplicantSelect?: (applicant: Applicant) => void;
  onCompareApplicants?: (applicantIds: string[]) => void;
}

/**
 * Props for applicant list component
 */
export interface ApplicantListProps {
  applicants: Applicant[];
  onSelect?: (applicant: Applicant) => void;
  onCompare?: (applicantIds: string[]) => void;
  selectedApplicants?: string[];
  sortBy?: 'name' | 'date' | 'risk' | 'score';
  sortOrder?: 'asc' | 'desc';
  filterByRisk?: RiskLevel[];
}

/**
 * Props for risk factor breakdown modal
 */
export interface RiskFactorBreakdownProps {
  assessment: RiskAssessment;
  open: boolean;
  onClose: () => void;
  onApprove?: (assessmentId: string) => void;
  onReject?: (assessmentId: string, reason: string) => void;
}

/**
 * Props for applicant comparison component
 */
export interface ApplicantComparisonProps {
  comparison: ApplicantComparison;
  onClose: () => void;
  onViewDetails?: (applicantId: string) => void;
}

/**
 * Props for summary metrics cards
 */
export interface SummaryMetricsProps {
  metrics: RiskAssessmentMetrics;
  loading?: boolean;
  onRefresh?: () => void;
}

/**
 * Props for risk level indicator
 */
export interface RiskLevelIndicatorProps {
  level: RiskLevel;
  score?: number;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  variant?: 'chip' | 'badge' | 'dot';
}