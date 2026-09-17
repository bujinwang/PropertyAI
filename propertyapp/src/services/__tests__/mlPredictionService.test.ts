import { mlPredictionService } from '../mlPredictionService';
import { api } from '../api';

jest.mock('../api');

describe('mlPredictionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('predictChurnRisk', () => {
    it('should successfully predict churn risk', async () => {
      const mockResponse = {
        prediction: 'high',
        probability: 0.75,
        confidence: 0.85,
        factors: [
          {
            name: 'Late Payments',
            impact: 0.4,
            description: 'High number of late payments',
          },
        ],
        recommendations: ['Follow up with tenant', 'Offer payment plan'],
      };

      (api.post as jest.Mock).mockResolvedValue(mockResponse);

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

      expect(result).toEqual(mockResponse);
      expect(api.post).toHaveBeenCalledWith('/ml/predict/churn', expect.any(Object));
    });

    it('should handle errors gracefully', async () => {
      (api.post as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(
        mlPredictionService.predictChurnRisk({
          tenantId: 'tenant123',
          paymentHistory: {
            onTimePayments: 18,
            latePayments: 6,
            totalPayments: 24,
          },
          maintenanceRequests: 8,
          leaseMonthsRemaining: 3,
          communicationFrequency: 12,
        })
      ).rejects.toThrow('Network error');
    });
  });

  describe('predictMaintenanceCosts', () => {
    it('should successfully predict maintenance costs', async () => {
      const mockResponse = {
        predictedCost: 3500,
        costRange: { min: 3000, max: 4000 },
        confidence: 0.80,
        breakdown: [
          {
            category: 'HVAC',
            predictedCost: 1500,
            probability: 0.75,
            urgency: 'high',
          },
        ],
        recommendations: ['Schedule HVAC maintenance'],
        timeline: 'Next 3 months',
      };

      (api.post as jest.Mock).mockResolvedValue(mockResponse);

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

      expect(result).toEqual(mockResponse);
      expect(api.post).toHaveBeenCalledWith('/ml/predict/maintenance', expect.any(Object));
    });
  });

  describe('getModelHealth', () => {
    it('should get ML model health status', async () => {
      const mockResponse = {
        status: 'healthy',
        models: [
          {
            name: 'churn_prediction',
            version: '1.0.0',
            accuracy: 0.85,
            lastTrained: '2024-09-01',
          },
        ],
      };

      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await mlPredictionService.getModelHealth();

      expect(result).toEqual(mockResponse);
      expect(api.get).toHaveBeenCalledWith('/ml/health');
    });
  });

  describe('batchPredictChurn', () => {
    it('should predict churn for multiple tenants', async () => {
      const mockResponse = [
        {
          tenantId: 'tenant1',
          prediction: 'high',
          probability: 0.75,
          confidence: 0.85,
          factors: [],
          recommendations: [],
        },
        {
          tenantId: 'tenant2',
          prediction: 'low',
          probability: 0.25,
          confidence: 0.90,
          factors: [],
          recommendations: [],
        },
      ];

      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await mlPredictionService.batchPredictChurn(['tenant1', 'tenant2']);

      expect(result).toEqual(mockResponse);
      expect(api.post).toHaveBeenCalledWith('/ml/predict/churn/batch', {
        tenantIds: ['tenant1', 'tenant2'],
      });
    });
  });
});
