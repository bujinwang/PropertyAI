const { marketDataService } = require('../dashboard/src/services/marketDataService');

// Mock the apiService
jest.mock('../dashboard/src/services/apiService', () => ({
  apiService: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const { apiService } = require('../dashboard/src/services/apiService');

describe('Market Data Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchMarketData', () => {
    it('should fetch market data successfully', async () => {
      const mockResponse = {
        data: {
          avgRent1BR: 1500,
          avgRent2BR: 2000,
          avgRent3BR: 2500,
          medianPrice: 500000,
          vacancyRate: 3.5,
          marketTrend: 'increasing',
          trendPercentage: 2.1,
          comparableProperties: [
            { address: '123 Main St', rent: 1950, sqft: 900, beds: 2 }
          ],
          source: 'Zillow',
          lastUpdated: '2025-09-14T00:00:00Z',
          confidence: 85
        }
      };

      apiService.get.mockResolvedValue(mockResponse);

      const result = await marketDataService.fetchMarketData('10001', 'residential');

      expect(apiService.get).toHaveBeenCalledWith('/analytics/market-data?zipCode=10001&propertyType=residential');
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors', async () => {
      apiService.get.mockResolvedValue({
        error: { message: 'API Error', status: 500 }
      });

      await expect(marketDataService.fetchMarketData('10001')).rejects.toThrow('Failed to fetch market data');
    });

    it('should require zip code', async () => {
      await expect(marketDataService.fetchMarketData('')).rejects.toThrow('Zip code is required');
    });
  });

  describe('getPricingRecommendations', () => {
    it('should get pricing recommendations successfully', async () => {
      const mockResponse = {
        data: {
          propertyId: 'prop-123',
          recommendations: [
            {
              type: 'increase',
              action: 'Consider increasing rent by 3-5%',
              targetRent: 2100,
              currentRent: 2000,
              marketAverage: 2050,
              confidence: 85,
              reasoning: 'Market is trending upward',
              marketTrend: 'increasing',
              trendPercentage: 2.1
            }
          ],
          marketData: {
            zipCode: '10001',
            marketTrend: 'increasing',
            trendPercentage: 2.1,
            vacancyRate: 3.5,
            source: 'Zillow',
            lastUpdated: '2025-09-14T00:00:00Z'
          }
        }
      };

      apiService.post.mockResolvedValue(mockResponse);

      const result = await marketDataService.getPricingRecommendations('prop-123');

      expect(apiService.post).toHaveBeenCalledWith('/analytics/pricing-recommendations', { propertyId: 'prop-123' });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors', async () => {
      apiService.post.mockResolvedValue({
        error: { message: 'API Error', status: 500 }
      });

      await expect(marketDataService.getPricingRecommendations('prop-123')).rejects.toThrow('Failed to get pricing recommendations');
    });

    it('should require property ID', async () => {
      await expect(marketDataService.getPricingRecommendations('')).rejects.toThrow('Property ID is required');
    });
  });

  describe('getCompetitiveAnalysis', () => {
    it('should get competitive analysis successfully', async () => {
      const mockResponse = {
        data: {
          propertyId: 'prop-123',
          marketPosition: 'premium',
          marketDifference: 5.2,
          insights: [
            'Property is positioned above market average',
            'Consider maintaining premium pricing strategy'
          ],
          comparableProperties: [
            { address: '123 Main St', rent: 1950, sqft: 900, beds: 2 }
          ],
          marketData: {
            zipCode: '10001',
            vacancyRate: 3.5,
            marketTrend: 'increasing',
            trendPercentage: 2.1,
            source: 'Zillow',
            lastUpdated: '2025-09-14T00:00:00Z'
          }
        }
      };

      apiService.post.mockResolvedValue(mockResponse);

      const result = await marketDataService.getCompetitiveAnalysis('prop-123');

      expect(apiService.post).toHaveBeenCalledWith('/analytics/competitive-analysis', { propertyId: 'prop-123' });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors', async () => {
      apiService.post.mockResolvedValue({
        error: { message: 'API Error', status: 500 }
      });

      await expect(marketDataService.getCompetitiveAnalysis('prop-123')).rejects.toThrow('Failed to get competitive analysis');
    });
  });

  describe('getMarketTrends', () => {
    it('should get market trends successfully', async () => {
      const mockResponse = {
        data: {
          zipCode: '10001',
          trends: [
            { date: '2025-08-01', avgRent2BR: 1950, vacancyRate: 4.2 },
            { date: '2025-09-01', avgRent2BR: 2000, vacancyRate: 3.5 }
          ],
          current: {
            avgRent2BR: 2000,
            vacancyRate: 3.5,
            marketTrend: 'increasing',
            trendPercentage: 2.1
          },
          source: 'Zillow',
          lastUpdated: '2025-09-14T00:00:00Z'
        }
      };

      apiService.get.mockResolvedValue(mockResponse);

      const result = await marketDataService.getMarketTrends('10001', 12);

      expect(apiService.get).toHaveBeenCalledWith('/analytics/market-trends?zipCode=10001&months=12');
      expect(result).toEqual(mockResponse.data);
    });

    it('should use default months if not provided', async () => {
      const mockResponse = { data: {} };
      apiService.get.mockResolvedValue(mockResponse);

      await marketDataService.getMarketTrends('10001');

      expect(apiService.get).toHaveBeenCalledWith('/analytics/market-trends?zipCode=10001&months=12');
    });

    it('should handle API errors', async () => {
      apiService.get.mockResolvedValue({
        error: { message: 'API Error', status: 500 }
      });

      await expect(marketDataService.getMarketTrends('10001')).rejects.toThrow('Failed to get market trends');
    });
  });

  describe('getMarketDashboardData', () => {
    it('should fetch all market data for dashboard', async () => {
      const mockMarketData = { data: { avgRent2BR: 2000 } };
      const mockTrends = { data: { trends: [] } };
      const mockPricing = { data: { recommendations: [] } };
      const mockAnalysis = { data: { insights: [] } };

      apiService.get
        .mockResolvedValueOnce(mockMarketData)
        .mockResolvedValueOnce(mockTrends);
      apiService.post
        .mockResolvedValueOnce(mockPricing)
        .mockResolvedValueOnce(mockAnalysis);

      const result = await marketDataService.getMarketDashboardData('10001', 'prop-123');

      expect(result).toEqual({
        marketData: mockMarketData.data,
        trends: mockTrends.data,
        recommendations: mockPricing.data,
        analysis: mockAnalysis.data
      });
    });

    it('should skip property-specific data when propertyId not provided', async () => {
      const mockMarketData = { data: { avgRent2BR: 2000 } };
      const mockTrends = { data: { trends: [] } };

      apiService.get
        .mockResolvedValueOnce(mockMarketData)
        .mockResolvedValueOnce(mockTrends);

      const result = await marketDataService.getMarketDashboardData('10001');

      expect(result).toEqual({
        marketData: mockMarketData.data,
        trends: mockTrends.data,
        recommendations: null,
        analysis: null
      });
    });
  });
});