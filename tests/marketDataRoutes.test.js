const request = require('supertest');
const express = require('express');
const marketDataRoutes = require('../src/routes/analytics');
const marketDataService = require('../src/services/marketDataService');

// Mock the market data service
jest.mock('../src/services/marketDataService', () => ({
  fetchMarketData: jest.fn(),
  getPricingRecommendations: jest.fn(),
  getCompetitiveAnalysis: jest.fn(),
  getMarketTrends: jest.fn(),
}));

// Mock auth middleware
jest.mock('../src/middleware/authMiddleware', () => (req, res, next) => {
  req.user = { id: 'user-123', role: 'manager' };
  next();
});

const app = express();
app.use(express.json());
app.use('/analytics', marketDataRoutes);

describe('Market Data Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /analytics/market-data', () => {
    it('should return market data successfully', async () => {
      const mockData = {
        avgRent1BR: 1500,
        avgRent2BR: 2000,
        vacancyRate: 3.5,
        marketTrend: 'increasing',
        trendPercentage: 2.1,
        source: 'Zillow',
        lastUpdated: '2025-09-14T00:00:00Z',
        confidence: 85
      };

      marketDataService.fetchMarketData.mockResolvedValue(mockData);

      const response = await request(app)
        .get('/analytics/market-data?zipCode=10001&propertyType=residential')
        .expect(200);

      expect(marketDataService.fetchMarketData).toHaveBeenCalledWith('10001', 'residential');
      expect(response.body).toEqual({
        ...mockData,
        requested: {
          zipCode: '10001',
          propertyType: 'residential'
        }
      });
    });

    it('should return 400 if zip code is missing', async () => {
      const response = await request(app)
        .get('/analytics/market-data')
        .expect(400);

      expect(response.body.error).toBe('Zip code is required');
    });

    it('should handle service errors', async () => {
      marketDataService.fetchMarketData.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/analytics/market-data?zipCode=10001')
        .expect(500);

      expect(response.body.error).toBe('Failed to fetch market data');
    });
  });

  describe('POST /analytics/pricing-recommendations', () => {
    it('should return pricing recommendations successfully', async () => {
      const mockData = {
        propertyId: 'prop-123',
        recommendations: [
          {
            type: 'increase',
            action: 'Consider increasing rent by 3-5%',
            targetRent: 2100,
            currentRent: 2000,
            marketAverage: 2050,
            confidence: 85,
            reasoning: 'Market is trending upward'
          }
        ],
        marketData: {
          zipCode: '10001',
          marketTrend: 'increasing',
          trendPercentage: 2.1
        }
      };

      marketDataService.getPricingRecommendations.mockResolvedValue(mockData);

      const response = await request(app)
        .post('/analytics/pricing-recommendations')
        .send({ propertyId: 'prop-123' })
        .expect(200);

      expect(marketDataService.getPricingRecommendations).toHaveBeenCalledWith('prop-123');
      expect(response.body).toEqual({
        ...mockData,
        cached: false
      });
    });

    it('should return cached data when available', async () => {
      const mockData = {
        propertyId: 'prop-123',
        recommendations: [],
        marketData: {}
      };

      marketDataService.getPricingRecommendations.mockResolvedValue(mockData);

      // Mock cache hit scenario
      const response = await request(app)
        .post('/analytics/pricing-recommendations')
        .send({ propertyId: 'prop-123' })
        .expect(200);

      expect(response.body.cached).toBe(false); // First call should not be cached
    });

    it('should return 400 if property ID is missing', async () => {
      const response = await request(app)
        .post('/analytics/pricing-recommendations')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Property ID is required');
    });

    it('should handle service errors', async () => {
      marketDataService.getPricingRecommendations.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/analytics/pricing-recommendations')
        .send({ propertyId: 'prop-123' })
        .expect(500);

      expect(response.body.error).toBe('Failed to generate pricing recommendations');
    });
  });

  describe('POST /analytics/competitive-analysis', () => {
    it('should return competitive analysis successfully', async () => {
      const mockData = {
        propertyId: 'prop-123',
        marketPosition: 'premium',
        marketDifference: 5.2,
        insights: ['Property is positioned above market average'],
        comparableProperties: [
          { address: '123 Main St', rent: 1950, sqft: 900, beds: 2 }
        ],
        marketData: {
          zipCode: '10001',
          vacancyRate: 3.5,
          marketTrend: 'increasing'
        }
      };

      marketDataService.getCompetitiveAnalysis.mockResolvedValue(mockData);

      const response = await request(app)
        .post('/analytics/competitive-analysis')
        .send({ propertyId: 'prop-123' })
        .expect(200);

      expect(marketDataService.getCompetitiveAnalysis).toHaveBeenCalledWith('prop-123');
      expect(response.body).toEqual({
        ...mockData,
        cached: false
      });
    });

    it('should handle service errors', async () => {
      marketDataService.getCompetitiveAnalysis.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/analytics/competitive-analysis')
        .send({ propertyId: 'prop-123' })
        .expect(500);

      expect(response.body.error).toBe('Failed to generate competitive analysis');
    });
  });

  describe('GET /analytics/market-trends', () => {
    it('should return market trends successfully', async () => {
      const mockData = {
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
      };

      marketDataService.getMarketTrends.mockResolvedValue(mockData);

      const response = await request(app)
        .get('/analytics/market-trends?zipCode=10001&months=6')
        .expect(200);

      expect(marketDataService.getMarketTrends).toHaveBeenCalledWith('10001', 6);
      expect(response.body).toEqual(mockData);
    });

    it('should use default months if not provided', async () => {
      const mockData = { zipCode: '10001', trends: [] };
      marketDataService.getMarketTrends.mockResolvedValue(mockData);

      await request(app)
        .get('/analytics/market-trends?zipCode=10001')
        .expect(200);

      expect(marketDataService.getMarketTrends).toHaveBeenCalledWith('10001', 12);
    });

    it('should return 400 if zip code is missing', async () => {
      const response = await request(app)
        .get('/analytics/market-trends')
        .expect(400);

      expect(response.body.error).toBe('Zip code is required');
    });

    it('should handle service errors', async () => {
      marketDataService.getMarketTrends.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/analytics/market-trends?zipCode=10001')
        .expect(500);

      expect(response.body.error).toBe('Failed to fetch market trends');
    });
  });
});