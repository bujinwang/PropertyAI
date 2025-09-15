const request = require('supertest');
const exportService = require('../src/utils/exportService');
const express = require('express');
const analyticsRoutes = require('../src/routes/analytics');
const analyticsService = require('../src/services/analyticsService');
jest.mock('../src/utils/exportService');

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
    });
  });

  describe('POST /analytics/export', () => {
    const mockAnalyticsData = {
      totalRevenue: 50000,
      totalExpenses: 15000,
      activeTenants: 25,
      propertyCount: 5
    };

    beforeEach(() => {
      analyticsService.getMetrics.mockResolvedValue(mockAnalyticsData);
      exportService.validateExportParams.mockImplementation(() => {});
      exportService.generatePDF.mockResolvedValue(Buffer.from('mock pdf content'));
      exportService.generateCSV.mockResolvedValue('period,totalRevenue\ntest,50000');
    });

    it('should generate PDF export successfully', async () => {
      const response = await request(app)
        .post('/analytics/export')
        .send({
          format: 'pdf',
          template: 'tax',
          filters: { dateFrom: '2024-01-01', dateTo: '2024-12-31' }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.format).toBe('pdf');
      expect(response.body.template).toBe('tax');
      expect(response.body.filename).toContain('tax-report');
      expect(response.body.data).toBeDefined();
      expect(analyticsService.getMetrics).toHaveBeenCalled();
      expect(exportService.generatePDF).toHaveBeenCalledWith(
        expect.objectContaining(mockAnalyticsData),
        'tax',
        expect.any(Object)
      );
    });

    it('should generate CSV export successfully', async () => {
      const response = await request(app)
        .post('/analytics/export')
        .send({
          format: 'csv',
          template: 'audit',
          filters: {}
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.format).toBe('csv');
      expect(response.body.template).toBe('audit');
      expect(response.body.filename).toContain('audit-report');
      expect(response.body.data).toBeDefined();
      expect(exportService.generateCSV).toHaveBeenCalled();
    });

    it('should return 400 when format is missing', async () => {
      const response = await request(app)
        .post('/analytics/export')
        .send({ template: 'tax' })
        .expect(400);

      expect(response.body.error).toContain('Missing required parameters');
      expect(response.body.message).toContain('format');
    });

    it('should return 400 when template is missing', async () => {
      const response = await request(app)
        .post('/analytics/export')
        .send({ format: 'pdf' })
        .expect(400);

      expect(response.body.error).toContain('Missing required parameters');
      expect(response.body.message).toContain('template');
    });

    it('should return 400 for invalid format', async () => {
      exportService.validateExportParams.mockImplementation(() => {
        throw new Error('Invalid format: invalid. Must be one of: pdf, csv');
      });

      const response = await request(app)
        .post('/analytics/export')
        .send({
          format: 'invalid',
          template: 'tax'
        })
        .expect(400);

      expect(response.body.error).toContain('Invalid parameters');
      expect(response.body.message).toContain('Invalid format');
    });

    it('should return 400 for invalid template', async () => {
      exportService.validateExportParams.mockImplementation(() => {
        throw new Error('Invalid template: invalid. Must be one of: tax, audit');
      });

      const response = await request(app)
        .post('/analytics/export')
        .send({
          format: 'pdf',
          template: 'invalid'
        })
        .expect(400);

      expect(response.body.error).toContain('Invalid parameters');
      expect(response.body.message).toContain('Invalid template');
    });

    it('should return 400 for invalid date range', async () => {
      exportService.validateExportParams.mockImplementation(() => {
        throw new Error('Date from cannot be after date to');
      });

      const response = await request(app)
        .post('/analytics/export')
        .send({
          format: 'pdf',
          template: 'tax',
          filters: {
            dateFrom: '2024-12-31',
            dateTo: '2024-01-01'
          }
        })
        .expect(400);

      expect(response.body.error).toContain('Invalid parameters');
      expect(response.body.message).toContain('Date from cannot be after date to');
    });

    it('should enforce role-based access for property managers', async () => {
      // Mock property manager user
      jest.doMock('../src/middleware/authMiddleware', () => (req, res, next) => {
        req.user = {
          id: 'manager1',
          role: 'PROPERTY_MANAGER',
          properties: ['prop1', 'prop2'],
          email: 'manager@test.com'
        };
        next();
      });

      const response = await request(app)
        .post('/analytics/export')
        .send({
          format: 'pdf',
          template: 'tax',
          filters: { propertyIds: 'prop1,prop3' } // prop3 not assigned
        })
        .expect(403);

      expect(response.body.error).toContain('Access denied');
      expect(response.body.message).toContain('assigned properties');
    });

    it('should allow property managers to export their assigned properties', async () => {
      // Mock property manager user
      jest.doMock('../src/middleware/authMiddleware', () => (req, res, next) => {
        req.user = {
          id: 'manager1',
          role: 'PROPERTY_MANAGER',
          properties: ['prop1', 'prop2'],
          email: 'manager@test.com'
        };
        next();
      });

      const response = await request(app)
        .post('/analytics/export')
        .send({
          format: 'pdf',
          template: 'tax',
          filters: { propertyIds: 'prop1,prop2' } // Both assigned
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle service errors gracefully', async () => {
      analyticsService.getMetrics.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/analytics/export')
        .send({
          format: 'pdf',
          template: 'tax'
        })
        .expect(500);

      expect(response.body.error).toContain('Export failed');
    });

    it('should include audit trail data for audit template', async () => {
      const response = await request(app)
        .post('/analytics/export')
        .send({
          format: 'csv',
          template: 'audit'
        })
        .expect(200);

      expect(exportService.generateCSV).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockAnalyticsData,
          auditTrail: expect.any(Array)
        }),
        'audit',
        expect.any(Object)
      );
    });

    it('should return signed URL for large files', async () => {
      // Mock large file
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
      exportService.generatePDF.mockResolvedValue(largeBuffer);

      const response = await request(app)
        .post('/analytics/export')
        .send({
          format: 'pdf',
          template: 'tax'
        })
        .expect(200);

      expect(response.body.signedUrl).toBeDefined();
      expect(response.body.expiresIn).toBe(3600);
      expect(response.body.data).toBeUndefined(); // No inline data for large files
    });
  });
});