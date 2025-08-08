import { apiService } from './apiService';

export const marketIntelligenceService = {
  // Get market intelligence overview
  fetchMarketIntelligence: () => apiService.get('/market-intelligence'),

  // Get AI-generated market summary
  fetchMarketSummary: () => apiService.get('/market-intelligence/summary'),

  // Get competitor activity data
  fetchCompetitorActivity: () => apiService.get('/market-intelligence/competitors'),

  // Get market opportunities
  fetchMarketOpportunities: () => apiService.get('/market-intelligence/opportunities'),

  // Get market trends
  fetchMarketTrends: () => apiService.get('/market-intelligence/trends'),

  // Get demand forecasts
  fetchDemandForecasts: () => apiService.get('/market-intelligence/forecasts'),

  // Submit feedback on market intelligence
  submitMarketFeedback: (data: any) => apiService.post('/market-intelligence/feedback', data),

  // Get property valuation
  getPropertyValuation: (propertyId?: string) => 
    apiService.get(`/market-intelligence/valuation${propertyId ? `?propertyId=${propertyId}` : ''}`),

  // Get investment analysis
  getInvestmentAnalysis: (propertyIds: string[]) => 
    apiService.post('/market-intelligence/investment-analysis', { propertyIds }),

  // Get rental market analysis
  getRentalMarketAnalysis: (location?: string) => 
    apiService.get(`/market-intelligence/rental-analysis${location ? `?location=${location}` : ''}`),

  // Get market alerts
  getMarketAlerts: () => apiService.get('/market-intelligence/alerts')
};