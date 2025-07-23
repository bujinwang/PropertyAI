/**
 * Market Intelligence Types and Interfaces
 * Types for market data, competitor analysis, and AI-generated summaries
 */

import { AIContent, ConfidenceScore } from './ai';

/**
 * Main market intelligence data structure
 */
export interface MarketIntelligence {
  trends: MarketTrend[];
  competitors: CompetitorData[];
  forecasts: DemandForecast[];
  opportunities: MarketOpportunity[];
  summary: AISummary;
  lastUpdated: Date;
}

/**
 * Market trend data
 */
export interface MarketTrend {
  id: string;
  metric: string;
  currentValue: number;
  previousValue: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  timeframe: string;
  unit: string;
  category: 'rent' | 'vacancy' | 'demand' | 'supply';
}

/**
 * Competitor data structure
 */
export interface CompetitorData {
  id: string;
  name: string;
  location: [number, number];
  address: string;
  rentRange: [number, number];
  occupancyRate: number;
  amenities: string[];
  propertyType: string;
  units: number;
  recentActivity: CompetitorActivity[];
  marketShare: number;
}

/**
 * Competitor activity tracking
 */
export interface CompetitorActivity {
  id: string;
  type: 'price_change' | 'new_listing' | 'promotion' | 'renovation';
  description: string;
  date: Date;
  impact: 'positive' | 'negative' | 'neutral';
  confidence: number;
}

/**
 * Demand forecast data
 */
export interface DemandForecast {
  id: string;
  period: string;
  predictedDemand: number;
  confidence: ConfidenceScore;
  factors: ForecastFactor[];
  seasonalAdjustment: number;
  trendDirection: 'increasing' | 'decreasing' | 'stable';
}

/**
 * Forecast contributing factors
 */
export interface ForecastFactor {
  name: string;
  impact: number;
  description: string;
  weight: number;
}

/**
 * Market opportunity identification
 */
export interface MarketOpportunity {
  id: string;
  title: string;
  description: string;
  type: 'pricing' | 'amenity' | 'location' | 'timing';
  priority: 'low' | 'medium' | 'high' | 'critical';
  potentialImpact: string;
  confidence: ConfidenceScore;
  actionItems: string[];
  timeline: string;
  estimatedROI?: number;
}

/**
 * AI-generated market summary
 */
export interface AISummary extends AIContent {
  title: string;
  keyInsights: string[];
  marketCondition: 'favorable' | 'neutral' | 'challenging';
  recommendations: AIRecommendation[];
  riskFactors: string[];
  opportunities: string[];
}

/**
 * AI recommendation for market actions
 */
export interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  confidence: ConfidenceScore;
  category: 'pricing' | 'marketing' | 'operations' | 'investment';
  timeline: string;
  expectedOutcome: string;
}

/**
 * Market summary card props
 */
export interface MarketSummaryCardProps {
  summary: AISummary;
  onFeedback?: (feedback: any) => void;
  loading?: boolean;
}

/**
 * Competitor activity display props
 */
export interface CompetitorActivityProps {
  competitors: CompetitorData[];
  onCompetitorSelect?: (competitor: CompetitorData) => void;
  loading?: boolean;
}

/**
 * Market opportunity alert props
 */
export interface MarketOpportunityProps {
  opportunities: MarketOpportunity[];
  onOpportunityAction?: (opportunity: MarketOpportunity, action: string) => void;
  loading?: boolean;
}

/**
 * Market intelligence service response
 */
export interface MarketIntelligenceResponse {
  success: boolean;
  data?: MarketIntelligence;
  error?: string;
  timestamp: Date;
}