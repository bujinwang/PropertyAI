const request = require('supertest');
const express = require('express');
const analyticsRoutes = require('../src/routes/analytics');
const analyticsService = require('../src/services/analyticsService');

// Mock the service
jest.mock('../src/services/analyticsService');
jest.mock('../src/middleware/authMiddleware', () => (req, res, next) => {
  req.user = { id: 'user1', role: 'owner' };
  next();
});

const app = express();
app.use(express.json());
app.use('/analytics', analyticsRoutes);

describe('Analytics Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /analytics/predict-maintenance', () => {
    it('should return maintenance predictions successfully', async () => {
      const mockPredictions = {
        predictions: [
          {
            type: 'plumbing',
            predictedDate: '2024-03-15',
            confidence: 85,
            estimatedCost: 550,
            priority: 'medium',
            reason: 'Based on 3 historical maintenance records',
          },
        ],
        totalAnalyzed: 8,
        message: 'Predictions generated successfully',
      };

      analyticsService.predictMaintenance.mockResolvedValue(mockPredictions);

      const response = await request(app)
        .post('/analytics/predict-maintenance')
        .send({ propertyId: 'prop1' })
        .expect(200);

      expect(response.body).toEqual(mockPredictions);
      expect(analyticsService.predictMaintenance).toHaveBeenCalledWith('prop1');
    });

    it('should return cached results when available', async () => {
      const mockPredictions = {
        predictions: [],
        totalAnalyzed: 0,
        message: 'No predictions available',
        cached: true,
        cacheAge: 30,
      };

      analyticsService.predictMaintenance.mockResolvedValue(mockPredictions);

      const response = await request(app)
        .post('/analytics/predict-maintenance')
        .send({ propertyId: 'prop1' })
        .expect(200);

      expect(response.body.cached).toBe(true);
      expect(response.body.cacheAge).toBeDefined();
    });

    it('should return 400 when propertyId is missing', async () => {
      const response = await request(app)
        .post('/analytics/predict-maintenance')
        .send({})
        .expect(400);

      expect(response.body.error).toContain('Property ID is required');
    });

    it('should handle service errors gracefully', async () => {
      analyticsService.predictMaintenance.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/analytics/predict-maintenance')
        .send({ propertyId: 'prop1' })
        .expect(500);

      expect(response.body.error).toContain('Failed to generate maintenance predictions');
    });

    it('should return predictions with confidence scores', async () => {
      const mockPredictions = {
        predictions: [
          {
            type: 'electrical',
            predictedDate: '2024-05-20',
            confidence: 92,
            estimatedCost: 1200,
            priority: 'high',
            reason: 'Based on consistent 6-month intervals',
          },
        ],
        totalAnalyzed: 12,
        message: 'High confidence predictions generated',
      };

      analyticsService.predictMaintenance.mockResolvedValue(mockPredictions);

      const response = await request(app)
        .post('/analytics/predict-maintenance')
        .send({ propertyId: 'prop2' })
        .expect(200);

      expect(response.body.predictions[0].confidence).toBe(92);
      expect(response.body.predictions[0].priority).toBe('high');
      expect(response.body.totalAnalyzed).toBe(12);
    });

    it('should handle empty predictions array', async () => {
      const mockPredictions = {
        predictions: [],
        totalAnalyzed: 2,
        message: 'Insufficient data for predictions',
      };

      analyticsService.predictMaintenance.mockResolvedValue(mockPredictions);

      const response = await request(app)
        .post('/analytics/predict-maintenance')
        .send({ propertyId: 'prop3' })
        .expect(200);

      expect(response.body.predictions).toHaveLength(0);
      expect(response.body.message).toContain('Insufficient data');
    });
  });
});