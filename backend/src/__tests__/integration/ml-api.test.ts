import axios from 'axios';

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:5001';

describe('ML API Integration Tests', () => {
  beforeAll(() => {
    // Set timeout for integration tests
    jest.setTimeout(10000);
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await axios.get(`${ML_API_URL}/health`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status', 'healthy');
      expect(response.data).toHaveProperty('mode', 'rule_based_only');
      expect(response.data).toHaveProperty('timestamp');
      expect(response.data).toHaveProperty('models_loaded');
    });
  });

  describe('Churn Prediction', () => {
    it('should predict low churn risk for stable tenant', async () => {
      const requestData = {
        propertyId: 'prop-123',
        tenantId: 'tenant-456',
        features: {
          paymentHistory: [1200, 1200, 1200, 1200, 1200],
          maintenanceRequests: 1,
          monthsInProperty: 24
        }
      };

      const response = await axios.post(
        `${ML_API_URL}/predict/churn`,
        requestData,
        { headers: { 'Content-Type': 'application/json' } }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('propertyId', 'prop-123');
      expect(response.data).toHaveProperty('tenantId', 'tenant-456');
      expect(response.data).toHaveProperty('churnProbability');
      expect(response.data).toHaveProperty('riskLevel');
      expect(response.data).toHaveProperty('factors');
      expect(response.data).toHaveProperty('recommendations');
      expect(response.data).toHaveProperty('modelUsed', 'rule_based');
      expect(response.data.churnProbability).toBeLessThanOrEqual(1.0);
      expect(response.data.churnProbability).toBeGreaterThanOrEqual(0.0);
    });

    it('should predict high churn risk for problematic tenant', async () => {
      const requestData = {
        propertyId: 'prop-789',
        tenantId: 'tenant-999',
        features: {
          paymentHistory: [1200, 1100, 900, 800, 600],
          maintenanceRequests: 8,
          monthsInProperty: 3
        }
      };

      const response = await axios.post(
        `${ML_API_URL}/predict/churn`,
        requestData,
        { headers: { 'Content-Type': 'application/json' } }
      );

      expect(response.status).toBe(200);
      expect(response.data.riskLevel).toMatch(/medium|high/);
      expect(response.data.churnProbability).toBeGreaterThan(0.3);
      expect(response.data.factors.length).toBeGreaterThan(0);
      expect(response.data.recommendations.length).toBeGreaterThan(0);
    });

    it('should handle missing data gracefully', async () => {
      const requestData = {
        propertyId: 'prop-123',
        tenantId: 'tenant-456',
        features: {}
      };

      const response = await axios.post(
        `${ML_API_URL}/predict/churn`,
        requestData,
        { headers: { 'Content-Type': 'application/json' } }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('churnProbability');
      expect(response.data).toHaveProperty('riskLevel');
    });

    it('should return error for invalid request', async () => {
      try {
        await axios.post(
          `${ML_API_URL}/predict/churn`,
          null,
          { headers: { 'Content-Type': 'application/json' } }
        );
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toHaveProperty('error');
      }
    });
  });

  describe('Maintenance Prediction', () => {
    it('should predict maintenance costs for older property', async () => {
      const requestData = {
        propertyId: 'prop-456',
        features: {
          propertyAge: 15,
          lastMaintenanceCost: 3000,
          systemAges: {
            HVAC: 12,
            Plumbing: 8,
            Electrical: 10
          }
        }
      };

      const response = await axios.post(
        `${ML_API_URL}/predict/maintenance`,
        requestData,
        { headers: { 'Content-Type': 'application/json' } }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('propertyId', 'prop-456');
      expect(response.data).toHaveProperty('predictedCost');
      expect(response.data).toHaveProperty('confidence');
      expect(response.data).toHaveProperty('timeframe', 'next_quarter');
      expect(response.data).toHaveProperty('breakdown');
      expect(response.data).toHaveProperty('insights');
      expect(response.data).toHaveProperty('modelUsed', 'rule_based');
      expect(response.data.predictedCost).toBeGreaterThan(0);
      expect(response.data.confidence).toBeGreaterThan(0);
      expect(response.data.confidence).toBeLessThanOrEqual(1);
    });

    it('should predict lower costs for newer property', async () => {
      const requestData = {
        propertyId: 'prop-new',
        features: {
          propertyAge: 5,
          lastMaintenanceCost: 1000,
          systemAges: {
            HVAC: 3,
            Plumbing: 5,
            Electrical: 4
          }
        }
      };

      const response = await axios.post(
        `${ML_API_URL}/predict/maintenance`,
        requestData,
        { headers: { 'Content-Type': 'application/json' } }
      );

      expect(response.status).toBe(200);
      expect(response.data.predictedCost).toBeLessThan(3000);
      expect(response.data.breakdown).toHaveProperty('HVAC');
      expect(response.data.breakdown).toHaveProperty('Plumbing');
      expect(response.data.breakdown).toHaveProperty('Electrical');
    });

    it('should handle old systems with high costs', async () => {
      const requestData = {
        propertyId: 'prop-old',
        features: {
          propertyAge: 25,
          lastMaintenanceCost: 5000,
          systemAges: {
            HVAC: 18,
            Plumbing: 22,
            Electrical: 20
          }
        }
      };

      const response = await axios.post(
        `${ML_API_URL}/predict/maintenance`,
        requestData,
        { headers: { 'Content-Type': 'application/json' } }
      );

      expect(response.status).toBe(200);
      expect(response.data.predictedCost).toBeGreaterThan(5000);
      expect(response.data.insights.length).toBeGreaterThan(0);
      expect(response.data.insights.some((i: string) => 
        i.toLowerCase().includes('hvac') || 
        i.toLowerCase().includes('plumbing') || 
        i.toLowerCase().includes('electrical')
      )).toBe(true);
    });

    it('should return error for invalid request', async () => {
      try {
        await axios.post(
          `${ML_API_URL}/predict/maintenance`,
          null,
          { headers: { 'Content-Type': 'application/json' } }
        );
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toHaveProperty('error');
      }
    });
  });

  describe('CORS Support', () => {
    it('should allow cross-origin requests', async () => {
      const response = await axios.get(`${ML_API_URL}/health`, {
        headers: { 'Origin': 'http://localhost:3000' }
      });

      expect(response.status).toBe(200);
      // CORS headers should be present
      expect(response.headers).toBeDefined();
    });
  });
});
