import { 
  AISummary,
  CompetitorData,
  MarketOpportunity,
  MarketTrend,
  DemandForecast
} from '../types/market-intelligence';

// Mock data for development
export const mockMarketIntelligenceService = {
  fetchMarketSummary: async (): Promise<AISummary> => {
    return {
      id: 'mock-summary-1',
      title: 'Market Intelligence Summary',
      content: 'The current market shows strong demand with moderate supply constraints.',
      confidence: { value: 85, level: 'high' },
      timestamp: new Date(),
      insights: [
        'Rental demand increased by 12% this quarter',
        'Average rent prices are 5% above market average',
        'Vacancy rates remain low at 3.2%'
      ]
    };
  },

  fetchCompetitorActivity: async (): Promise<CompetitorData[]> => {
    return [
      {
        id: 'comp-1',
        name: 'Premium Properties LLC',
        marketShare: 15.2,
        averageRent: 2400,
        occupancyRate: 96.5,
        recentActivity: 'Acquired 3 new properties',
        location: { lat: 40.7128, lng: -74.0060 }
      }
    ];
  },

  fetchMarketOpportunities: async (): Promise<MarketOpportunity[]> => {
    return [
      {
        id: 'opp-1',
        title: 'Rent Optimization Opportunity',
        description: 'Current rent is 8% below market rate',
        type: 'pricing',
        priority: 'high',
        estimatedROI: 12.5,
        timeline: '2-4 weeks',
        confidence: { value: 88, level: 'high' }
      }
    ];
  },

  fetchMarketTrends: async (): Promise<MarketTrend[]> => {
    return [
      {
        id: 'trend-1',
        period: '2024-01',
        averageRent: 2200,
        occupancyRate: 94.2,
        priceChange: 3.5,
        demandIndex: 78
      }
    ];
  },

  fetchDemandForecasts: async (): Promise<DemandForecast[]> => {
    return [
      {
        id: 'forecast-1',
        period: '2024-Q2',
        predictedDemand: 85,
        confidence: { value: 82, level: 'high' },
        factors: [
          {
            name: 'Seasonal Trends',
            impact: 0.3,
            description: 'Spring moving season increases demand'
          }
        ]
      }
    ];
  },

  submitMarketFeedback: async (): Promise<boolean> => {
    return true;
  }
};