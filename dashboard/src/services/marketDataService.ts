import { apiService } from './apiService';

export interface MarketData {
  avgRent1BR: number;
  avgRent2BR: number;
  avgRent3BR: number;
  medianPrice: number;
  vacancyRate: number;
  marketTrend: string;
  trendPercentage: number;
  comparableProperties: Array<{
    address: string;
    rent: number;
    sqft: number;
    beds: number;
  }>;
  source: string;
  lastUpdated: string;
  confidence: number;
}

export interface PricingRecommendation {
  propertyId: string;
  recommendations: Array<{
    type: string;
    action: string;
    targetRent: number;
    currentRent: number;
    marketAverage: number;
    confidence: number;
    reasoning: string;
    marketTrend: string;
    trendPercentage: number;
  }>;
  marketData: {
    zipCode: string;
    marketTrend: string;
    trendPercentage: number;
    vacancyRate: number;
    source: string;
    lastUpdated: string;
  };
}

export interface CompetitiveAnalysis {
  propertyId: string;
  marketPosition: string;
  marketDifference: number;
  insights: string[];
  comparableProperties: Array<{
    address: string;
    rent: number;
    sqft: number;
    beds: number;
  }>;
  marketData: {
    zipCode: string;
    vacancyRate: number;
    marketTrend: string;
    trendPercentage: number;
    source: string;
    lastUpdated: string;
  };
}

export interface MarketTrends {
  zipCode: string;
  trends: Array<{
    date: string;
    avgRent2BR: number;
    vacancyRate: number;
  }>;
  current: {
    avgRent2BR: number;
    vacancyRate: number;
    marketTrend: string;
    trendPercentage: number;
  };
  source: string;
  lastUpdated: string;
}

export const marketDataService = {
  // Get market data for a specific zip code
  fetchMarketData: async (zipCode: string, propertyType?: string): Promise<MarketData> => {
    const params = new URLSearchParams({ zipCode });
    if (propertyType) params.append('propertyType', propertyType);

    const response = await apiService.get<MarketData>(`/analytics/market-data?${params}`);
    if (response.error) {
      throw new Error(response.error.message || 'Failed to fetch market data');
    }
    return response.data!;
  },

  // Get pricing recommendations for a property
  getPricingRecommendations: async (propertyId: string): Promise<PricingRecommendation> => {
    const response = await apiService.post<PricingRecommendation>('/analytics/pricing-recommendations', { propertyId });
    if (response.error) {
      throw new Error(response.error.message || 'Failed to get pricing recommendations');
    }
    return response.data!;
  },

  // Get competitive analysis for a property
  getCompetitiveAnalysis: async (propertyId: string): Promise<CompetitiveAnalysis> => {
    const response = await apiService.post<CompetitiveAnalysis>('/analytics/competitive-analysis', { propertyId });
    if (response.error) {
      throw new Error(response.error.message || 'Failed to get competitive analysis');
    }
    return response.data!;
  },

  // Get market trends for a zip code
  getMarketTrends: async (zipCode: string, months: number = 12): Promise<MarketTrends> => {
    const params = new URLSearchParams({ zipCode, months: months.toString() });
    const response = await apiService.get<MarketTrends>(`/analytics/market-trends?${params}`);
    if (response.error) {
      throw new Error(response.error.message || 'Failed to get market trends');
    }
    return response.data!;
  },

  // Get all market data for dashboard
  getMarketDashboardData: async (zipCode: string, propertyId?: string): Promise<{
    marketData: MarketData;
    trends: MarketTrends;
    recommendations?: PricingRecommendation;
    analysis?: CompetitiveAnalysis;
  }> => {
    const [marketData, trends] = await Promise.all([
      marketDataService.fetchMarketData(zipCode),
      marketDataService.getMarketTrends(zipCode)
    ]);

    let recommendations, analysis;

    if (propertyId) {
      [recommendations, analysis] = await Promise.all([
        marketDataService.getPricingRecommendations(propertyId),
        marketDataService.getCompetitiveAnalysis(propertyId)
      ]);
    }

    return {
      marketData,
      trends,
      recommendations,
      analysis
    };
  }
};