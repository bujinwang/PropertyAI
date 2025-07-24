/**
 * Market Intelligence Service
 * Handles API calls for market data, competitor analysis, and AI summaries
 */

import { 
  MarketIntelligence, 
  MarketIntelligenceResponse,
  AISummary,
  CompetitorData,
  MarketOpportunity,
  MarketTrend,
  DemandForecast
} from '../types/market-intelligence';
import { ConfidenceScore } from '../types/ai';
import { apiService } from './api';

/**
 * Fetch complete market intelligence data
 */
export const fetchMarketIntelligence = async (): Promise<MarketIntelligenceResponse> => {
  try {
    const response = await apiService.get('/api/market-intelligence');
    return {
      success: true,
      data: response.data,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Error fetching market intelligence:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
    };
  }
};

/**
 * Fetch AI-generated market summary
 */
export const fetchMarketSummary = async (): Promise<AISummary> => {
  try {
    const response = await apiService.get('/api/market-intelligence/summary');
    return response.data;
  } catch (error) {
    console.error('Error fetching market summary:', error);
    throw new Error('Failed to fetch market summary');
  }
};

/**
 * Fetch competitor activity data
 */
export const fetchCompetitorActivity = async (): Promise<CompetitorData[]> => {
  try {
    const response = await apiService.get('/api/market-intelligence/competitors');
    return response.data;
  } catch (error) {
    console.error('Error fetching competitor activity:', error);
    throw new Error('Failed to fetch competitor activity');
  }
};

/**
 * Fetch market opportunities
 */
export const fetchMarketOpportunities = async (): Promise<MarketOpportunity[]> => {
  try {
    const response = await apiService.get('/api/market-intelligence/opportunities');
    return response.data;
  } catch (error) {
    console.error('Error fetching market opportunities:', error);
    throw new Error('Failed to fetch market opportunities');
  }
};

/**
 * Fetch market trends data
 */
export const fetchMarketTrends = async (): Promise<MarketTrend[]> => {
  try {
    const response = await apiService.get('/api/market-intelligence/trends');
    return response.data;
  } catch (error) {
    console.error('Error fetching market trends:', error);
    throw new Error('Failed to fetch market trends');
  }
};

/**
 * Fetch demand forecasts
 */
export const fetchDemandForecasts = async (): Promise<DemandForecast[]> => {
  try {
    const response = await apiService.get('/api/market-intelligence/forecasts');
    return response.data;
  } catch (error) {
    console.error('Error fetching demand forecasts:', error);
    throw new Error('Failed to fetch demand forecasts');
  }
};

/**
 * Submit feedback for AI-generated content
 */
export const submitMarketFeedback = async (
  contentId: string,
  feedback: { type: 'positive' | 'negative'; comment?: string }
): Promise<boolean> => {
  try {
    await apiService.post('/api/market-intelligence/feedback', {
      contentId,
      feedback,
      timestamp: new Date(),
    });
    return true;
  } catch (error) {
    console.error('Error submitting market feedback:', error);
    return false;
  }
};

/**
 * Get property valuation data
 */
export const getPropertyValuation = async (propertyId?: string): Promise<{
  estimatedValue: number;
  valueRange: [number, number];
  confidence: ConfidenceScore;
  factors: Array<{
    name: string;
    impact: number;
    description: string;
  }>;
  comparables: Array<{
    propertyId: string;
    address: string;
    value: number;
    distance: number;
    similarity: number;
  }>;
}> => {
  try {
    const params = propertyId ? `?propertyId=${propertyId}` : '';
    const response = await apiService.get(`/api/market-intelligence/valuation${params}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching property valuation:', error);
    throw new Error('Failed to fetch property valuation');
  }
};

/**
 * Get investment analysis
 */
export const getInvestmentAnalysis = async (propertyIds?: string[]): Promise<{
  properties: Array<{
    propertyId: string;
    roi: number;
    capRate: number;
    cashFlow: number;
    appreciation: number;
    riskScore: number;
  }>;
  portfolioMetrics: {
    totalValue: number;
    totalROI: number;
    diversification: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
}> => {
  try {
    const response = await apiService.post('/api/market-intelligence/investment-analysis', {
      propertyIds
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching investment analysis:', error);
    throw new Error('Failed to fetch investment analysis');
  }
};

/**
 * Get rental market analysis
 */
export const getRentalMarketAnalysis = async (location?: string): Promise<{
  averageRent: number;
  rentRange: [number, number];
  occupancyRate: number;
  pricePerSqFt: number;
  marketTrends: Array<{
    period: string;
    averageRent: number;
    occupancy: number;
  }>;
  comparableProperties: Array<{
    address: string;
    rent: number;
    sqft: number;
    bedrooms: number;
    bathrooms: number;
    amenities: string[];
    distance: number;
  }>;
}> => {
  try {
    const params = location ? `?location=${encodeURIComponent(location)}` : '';
    const response = await apiService.get(`/api/market-intelligence/rental-analysis${params}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching rental market analysis:', error);
    throw new Error('Failed to fetch rental market analysis');
  }
};

/**
 * Get market alerts
 */
export const getMarketAlerts = async (): Promise<Array<{
  id: string;
  type: 'opportunity' | 'threat' | 'trend';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
  actionRequired: boolean;
  relatedData?: any;
}>> => {
  try {
    const response = await apiService.get('/api/market-intelligence/alerts');
    return response.data;
  } catch (error) {
    console.error('Error fetching market alerts:', error);
    throw new Error('Failed to fetch market alerts');
  }
};

export default {
  fetchMarketIntelligence,
  fetchMarketSummary,
  fetchCompetitorActivity,
  fetchMarketOpportunities,
  fetchMarketTrends,
  fetchDemandForecasts,
  submitMarketFeedback,
  getPropertyValuation,
  getInvestmentAnalysis,
  getRentalMarketAnalysis,
  getMarketAlerts,
};