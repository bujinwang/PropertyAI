import { apiService } from './apiService';

export const marketIntelligenceService = {
  // Get market intelligence overview
  fetchMarketIntelligence: () => apiService.get('/ai'),

  // Get AI-generated market summary
  fetchMarketSummary: () => apiService.get('/ai/summary'),

  // Get competitor activity data
  fetchCompetitorActivity: () => apiService.get('/ai/competitors'),

  // Get market opportunities
  fetchMarketOpportunities: () => apiService.get('/ai/opportunities'),

  // Get market trends
  fetchMarketTrends: () => apiService.get('/ai/trends'),

  // Get demand forecasts
  fetchDemandForecasts: () => apiService.get('/ai/forecasts'),

  // Submit feedback on market intelligence
  submitMarketFeedback: (data: any) => apiService.post('/ai/feedback', data),

  // Get property valuation
  getPropertyValuation: (propertyId?: string) => 
    apiService.get(`/ai/valuation${propertyId ? `?propertyId=${propertyId}` : ''}`),

  // Get investment analysis
  getInvestmentAnalysis: (propertyIds: string[]) => 
    apiService.post('/ai/investment-analysis', { propertyIds }),

  // Get rental market analysis
  getRentalMarketAnalysis: (location?: string) => 
    apiService.get(`/ai/rental-analysis${location ? `?location=${location}` : ''}`),

  // Get market alerts
  getMarketAlerts: () => apiService.get('/ai/alerts')
};