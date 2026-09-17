import axios from 'axios';
import { mlPredictionService } from '../mlPredictionService';
import { ML_API_URL, ENDPOINTS } from '../../constants/api';

jest.mock('axios');

const mockedPost = axios.post as jest.Mock;
const mockedGet = axios.get as jest.Mock;

describe('mlPredictionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('predictChurnRisk', () => {
    it('should successfully predict churn risk', async () => {
      const mlApiResponse = {
        propertyId: 'tenant123',
        tenantId: 'tenant123',
        churnProbability: 0.75,
        riskLevel: 'high',
        factors: ['Late or reduced payments in last 3 months', 'Multiple maintenance requests'],
        recommendations: ['Follow up with tenant', 'Offer payment plan'],
        modelUsed: 'rule_based',
      };

      mockedPost.mockResolvedValue({ data: mlApiResponse });

      const result = await mlPredictionService.predictChurnRisk({
        tenantId: 'tenant123',
        paymentHistory: {
          onTimePayments: 18,
          latePayments: 6,
          totalPayments: 24,
        },
        maintenanceRequests: 8,
        leaseMonthsRemaining: 3,
        communicationFrequency: 12,
      });

      // The service transforms the raw ML API response into its own shape.
      expect(result).toEqual({
        prediction: 'high',
        probability: 0.75,
        confidence: 0.75,
        factors: mlApiResponse.factors.map((factor) => ({
          name: factor,
          impact: 0.15,
          description: factor,
        })),
        recommendations: mlApiResponse.recommendations,
      });

      expect(mockedPost).toHaveBeenCalledWith(
        `${ML_API_URL}${ENDPOINTS.ML.PREDICT_CHURN}`,
        expect.any(Object)
      );
    });

    it('should handle errors gracefully', async () => {
      mockedPost.mockRejectedValue(new Error('Network error'));

      // The service catches the error and returns a fallback prediction; it does
      // not rethrow, so we assert the fallback shape rather than a rejection.
      const result = await mlPredictionService.predictChurnRisk({
        tenantId: 'tenant123',
        paymentHistory: {
          onTimePayments: 18,
          latePayments: 6,
          totalPayments: 24,
        },
        maintenanceRequests: 8,
        leaseMonthsRemaining: 3,
        communicationFrequency: 12,
      });

      expect(result).toEqual({
        prediction: 'medium',
        probability: 0.5,
        confidence: 0.6,
        factors: [
          {
            name: 'Insufficient Data',
            impact: 0.1,
            description: 'Unable to calculate accurate prediction',
          },
        ],
        recommendations: ['Gather more tenant data for better predictions'],
      });
    });
  });

  describe('predictMaintenanceCosts', () => {
    it('should successfully predict maintenance costs', async () => {
      const mlApiResponse = {
        propertyId: 'rental123',
        predictedCost: 3500,
        confidence: 0.8,
        timeframe: 'next_quarter',
        breakdown: { HVAC: 1500, Plumbing: 1000, Electrical: 1000 },
        insights: ['Schedule HVAC maintenance'],
        modelUsed: 'rule_based',
      };

      mockedPost.mockResolvedValue({ data: mlApiResponse });

      const result = await mlPredictionService.predictMaintenanceCosts({
        rentalId: 'rental123',
        propertyAge: 15,
        propertyType: 'apartment',
        squareFeet: 1200,
        lastMaintenanceDate: '2024-01-15',
        maintenanceHistory: [
          { date: '2024-01-15', cost: 450, category: 'plumbing' },
        ],
        systems: {
          hvac: { age: 12, lastService: '2023-11-10' },
        },
      });

      expect(result.predictedCost).toBe(3500);
      expect(result.costRange).toEqual({ min: 2800, max: 4200 });
      expect(result.confidence).toBe(0.8);
      expect(result.breakdown).toEqual([
        { category: 'HVAC', predictedCost: 1500, probability: 0.75, urgency: 'high' },
        { category: 'Plumbing', predictedCost: 1000, probability: 0.75, urgency: 'medium' },
        { category: 'Electrical', predictedCost: 1000, probability: 0.75, urgency: 'medium' },
      ]);
      expect(result.recommendations).toEqual(['Schedule HVAC maintenance']);
      expect(result.timeline).toBe('Next 6-12 months');

      expect(mockedPost).toHaveBeenCalledWith(
        `${ML_API_URL}${ENDPOINTS.ML.PREDICT_MAINTENANCE}`,
        expect.any(Object)
      );
    });
  });

  describe('getModelHealth', () => {
    it('should get ML model health status', async () => {
      mockedGet.mockResolvedValue({
        data: {
          status: 'healthy',
          timestamp: '2024-09-01T00:00:00.000000',
          models_loaded: ['tenant_behavior'],
          mode: 'rule_based_only',
        },
      });

      const result = await mlPredictionService.getModelHealth();

      expect(result).toEqual({
        status: 'healthy',
        models: [
          {
            name: 'tenant_behavior',
            version: 'rule_based',
            accuracy: 0,
            lastTrained: '2024-09-01T00:00:00.000000',
          },
        ],
      });

      expect(mockedGet).toHaveBeenCalledWith(`${ML_API_URL}${ENDPOINTS.ML.HEALTH}`);
    });
  });

  describe('batchPredictChurn', () => {
    it('should predict churn for multiple tenants', async () => {
      const mlApiResponse = {
        propertyId: 'tenant1',
        tenantId: 'tenant1',
        churnProbability: 0.75,
        riskLevel: 'high',
        factors: [],
        recommendations: [],
        modelUsed: 'rule_based',
      };

      mockedPost.mockResolvedValue({ data: mlApiResponse });

      const result = await mlPredictionService.batchPredictChurn(['tenant1', 'tenant2']);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        tenantId: 'tenant1',
        prediction: 'high',
        probability: 0.75,
        confidence: 0.75,
        factors: [],
        recommendations: [],
      });
      expect(result[1]).toEqual({
        tenantId: 'tenant2',
        prediction: 'high',
        probability: 0.75,
        confidence: 0.75,
        factors: [],
        recommendations: [],
      });

      // One request per tenant id (no batch backend route exists).
      expect(mockedPost).toHaveBeenCalledTimes(2);
    });
  });
});
