/**
 * AI Insights Dashboard Types
 * Types for the AI insights dashboard components and data models
 */

import { AIExplanation, ConfidenceScore } from './ai';

export type InsightCategory = 'financial' | 'operational' | 'tenant_satisfaction';
export type InsightPriority = 'low' | 'medium' | 'high' | 'critical';
export type InsightImpact = 'low' | 'medium' | 'high';
export type TrendDirection = 'up' | 'down' | 'stable';
export type TimeRange = '7d' | '30d' | '90d' | '1y';

/**
 * Individual insight data structure
 */
export interface Insight {
  id: string;
  title: string;
  summary: string;
  category: InsightCategory;
  priority: InsightPriority;
  impact: InsightImpact;
  confidence: number;
  explanation: AIExplanation;
  recommendations: AIRecommendation[];
  chartData: ChartData;
  metrics: InsightMetric[];
  timestamp: Date;
  trend: TrendDirection;
  tags: string[];
}

/**
 * AI-generated recommendation
 */
export interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  priority: InsightPriority;
  confidence: number;
  estimatedImpact: string;
  timeline: string;
  effort: 'low' | 'medium' | 'high';
  category: string;
  actions: RecommendationAction[];
}

/**
 * Actionable step within a recommendation
 */
export interface RecommendationAction {
  id: string;
  description: string;
  completed: boolean;
  dueDate?: Date;
  assignee?: string;
}

/**
 * Insight category grouping
 */
export interface InsightCategoryGroup {
  id: string;
  name: string;
  category: InsightCategory;
  insights: Insight[];
  totalCount: number;
  priority: number;
  icon: string;
  color: string;
}

/**
 * Chart data for visualizations
 */
export interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'area';
  labels: string[];
  datasets: ChartDataset[];
  options?: any;
}

/**
 * Chart dataset
 */
export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
  fill?: boolean;
}

/**
 * Insight metric
 */
export interface InsightMetric {
  name: string;
  value: number | string;
  unit?: string;
  change?: number;
  changeType?: TrendDirection;
  target?: number;
  format?: 'currency' | 'percentage' | 'number' | 'text';
}

/**
 * Filter options for insights
 */
export interface InsightFilters {
  categories: InsightCategory[];
  priorities: InsightPriority[];
  timeRange: TimeRange;
  searchQuery: string;
  sortBy: 'priority' | 'confidence' | 'impact' | 'timestamp';
  sortOrder: 'asc' | 'desc';
}

/**
 * Dashboard state
 */
export interface InsightsDashboardState {
  categories: InsightCategoryGroup[];
  selectedInsight: Insight | null;
  filters: InsightFilters;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

/**
 * API response for insights
 */
export interface InsightsResponse {
  insights: Insight[];
  categories: InsightCategoryGroup[];
  totalCount: number;
  hasMore: boolean;
  nextCursor?: string;
}

/**
 * Insight detail modal props
 */
export interface InsightDetailModalProps {
  insight: Insight | null;
  open: boolean;
  onClose: () => void;
  onRecommendationAction: (recommendationId: string, actionId: string) => void;
}

/**
 * Insight card props
 */
export interface InsightCardProps {
  insight: Insight;
  onClick: (insight: Insight) => void;
  showCategory?: boolean;
  compact?: boolean;
}

/**
 * Category section props
 */
export interface CategorySectionProps {
  category: InsightCategoryGroup;
  onInsightClick: (insight: Insight) => void;
  expanded?: boolean;
  onToggleExpanded?: () => void;
}

/**
 * Filters panel props
 */
export interface FiltersPanelProps {
  filters: InsightFilters;
  onFiltersChange: (filters: Partial<InsightFilters>) => void;
  categories: InsightCategoryGroup[];
}