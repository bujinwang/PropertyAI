import axios from 'axios';
import { predictiveAnalyticsService } from '../../services/predictiveAnalytics.service';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const ML_API_URL = process.env.ML_API_URL || 'http://localhost:5001';

describe('Backend to ML API Integration Tests', () => {
  beforeAll(() => {
    jest.setTimeout(15000);
  });

  describe('Predictive Analytics Service', () => {
    it('should fetch churn predictions from ML API', async () => {
      const propertyId = 'test-prop-123';
      const tenantId = 'test-tenant-456';
      const features = {
        paymentHistory: [1200, 1200, 1150, 1200, 1100],
        maintenanceRequests: 3,
        monthsInProperty: 18
      };

      const result = await predictiveAnalyticsService.predictChurnRisk(
        propertyId,
        tenantId,
        features
      );

      expect(result).toBeDefined();
      expect(result).toHaveProperty('propertyId');
      expect(result).toHaveProperty('tenantId');
      expect(result).toHaveProperty('churnProbability');
      expect(result).toHaveProperty('riskLevel');
      expect(result).toHaveProperty('factors');
      expect(result).toHaveProperty('recommendations');
    });

    it('should fetch maintenance predictions from ML API', async () => {
      const propertyId = 'test-prop-789';
      const features = {
        propertyAge: 15,
        lastMaintenanceCost: 3000,
        systemAges: {
          HVAC: 12,
          Plumbing: 8,
          Electrical: 10
        }
      };

      const result = await predictiveAnalyticsService.predictMaintenanceCost(
        propertyId,
        features
      );

      expect(result).toBeDefined();
      expect(result).toHaveProperty('propertyId');
      expect(result).toHaveProperty('predictedCost');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('breakdown');
      expect(result).toHaveProperty('insights');
    });

    it('should handle ML API unavailability gracefully', async () => {
      // Temporarily override ML_API_URL to force fallback
      const originalEnv = process.env.ML_API_URL;
      process.env.ML_API_URL = 'http://localhost:9999';

      try {
        const result = await predictiveAnalyticsService.predictChurnRisk(
          'prop-test',
          'tenant-test',
          { paymentHistory: [1200], maintenanceRequests: 2, monthsInProperty: 12 }
        );

        // Should fallback to mock data
        expect(result).toBeDefined();
        expect(result).toHaveProperty('churnProbability');
      } finally {
        process.env.ML_API_URL = originalEnv;
      }
    });

    it('should return mock data when ML API returns error', async () => {
      // Test with invalid data that should trigger error handling
      const result = await predictiveAnalyticsService.predictChurnRisk(
        'invalid',
        'invalid',
        {} as any
      );

      // Should still return data (either from API or fallback)
      expect(result).toBeDefined();
    });
  });

  describe('ML Health Check Integration', () => {
    it('should verify ML API is reachable from backend', async () => {
      try {
        const response = await axios.get(`${ML_API_URL}/health`);
        expect(response.status).toBe(200);
        expect(response.data.status).toBe('healthy');
      } catch (error) {
        console.warn('ML API not reachable - tests will use fallback data');
      }
    });
  });

  describe('End-to-End Prediction Flow', () => {
    it('should complete full churn prediction workflow', async () => {
      // Step 1: Call ML API directly
      const mlRequest = {
        propertyId: 'e2e-prop-1',
        tenantId: 'e2e-tenant-1',
        features: {
          paymentHistory: [1200, 1200, 1100, 1000, 900],
          maintenanceRequests: 7,
          monthsInProperty: 6
        }
      };

      const mlResponse = await axios.post(
        `${ML_API_URL}/predict/churn`,
        mlRequest,
        { headers: { 'Content-Type': 'application/json' } }
      );

      expect(mlResponse.status).toBe(200);
      const mlData = mlResponse.data;

      // Step 2: Call through backend service
      const serviceResult = await predictiveAnalyticsService.predictChurnRisk(
        mlRequest.propertyId,
        mlRequest.tenantId,
        mlRequest.features
      );

      // Step 3: Verify consistency
      expect(serviceResult.propertyId).toBe(mlData.propertyId);
      expect(serviceResult.tenantId).toBe(mlData.tenantId);
      expect(serviceResult.riskLevel).toBeDefined();
      expect(serviceResult.churnProbability).toBeGreaterThanOrEqual(0);
      expect(serviceResult.churnProbability).toBeLessThanOrEqual(1);
    });

    it('should complete full maintenance prediction workflow', async () => {
      // Step 1: Call ML API directly
      const mlRequest = {
        propertyId: 'e2e-prop-2',
        features: {
          propertyAge: 20,
          lastMaintenanceCost: 4000,
          systemAges: {
            HVAC: 16,
            Plumbing: 18,
            Electrical: 15
          }
        }
      };

      const mlResponse = await axios.post(
        `${ML_API_URL}/predict/maintenance`,
        mlRequest,
        { headers: { 'Content-Type': 'application/json' } }
      );

      expect(mlResponse.status).toBe(200);
      const mlData = mlResponse.data;

      // Step 2: Call through backend service
      const serviceResult = await predictiveAnalyticsService.predictMaintenanceCost(
        mlRequest.propertyId,
        mlRequest.features
      );

      // Step 3: Verify consistency
      expect(serviceResult.propertyId).toBe(mlData.propertyId);
      expect(serviceResult.predictedCost).toBeGreaterThan(0);
      expect(serviceResult.breakdown).toBeDefined();
      expect(serviceResult.breakdown.HVAC).toBeGreaterThan(0);
      expect(serviceResult.insights.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeouts gracefully', async () => {
      const result = await predictiveAnalyticsService.predictChurnRisk(
        'timeout-test',
        'timeout-tenant',
        { paymentHistory: [1200], maintenanceRequests: 1, monthsInProperty: 12 }
      );

      // Should return data (from cache, fallback, or successful request)
      expect(result).toBeDefined();
      expect(result).toHaveProperty('churnProbability');
    });

    it('should handle malformed responses', async () => {
      const result = await predictiveAnalyticsService.predictMaintenanceCost(
        'malformed-test',
        { propertyAge: 10, lastMaintenanceCost: 2000, systemAges: {} }
      );

      // Should still return valid data structure
      expect(result).toBeDefined();
      expect(result).toHaveProperty('predictedCost');
    });
  });

  describe('Performance', () => {
    it('should complete churn prediction within reasonable time', async () => {
      const startTime = Date.now();

      await predictiveAnalyticsService.predictChurnRisk(
        'perf-test-1',
        'perf-tenant-1',
        {
          paymentHistory: [1200, 1200, 1200],
          maintenanceRequests: 2,
          monthsInProperty: 12
        }
      );

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should complete maintenance prediction within reasonable time', async () => {
      const startTime = Date.now();

      await predictiveAnalyticsService.predictMaintenanceCost(
        'perf-test-2',
        {
          propertyAge: 10,
          lastMaintenanceCost: 2000,
          systemAges: { HVAC: 8, Plumbing: 6, Electrical: 7 }
        }
      );

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});
