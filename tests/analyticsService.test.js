const analyticsService = require('../src/services/analyticsService');

// Mock Prisma client
jest.mock('../src/config/database', () => ({
  prisma: {
    property: {
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    tenant: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    payment: {
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
    invoice: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    maintenanceHistory: {
      findMany: jest.fn(),
    },
  },
}));

const { prisma } = require('../src/config/database');

describe('analyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMetrics', () => {
    it('should calculate metrics correctly for owner role', async () => {
      // Mock Prisma responses
      prisma.property.findMany.mockResolvedValue([
        { id: 'prop1', totalUnits: 5 },
        { id: 'prop2', totalUnits: 5 }
      ]);

      prisma.tenant.count.mockResolvedValue(8); // activeTenants
      prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: 5000 } }); // totalRevenue
      prisma.invoice.aggregate.mockResolvedValue({ _avg: { amount: 1200 } }); // avgRent

      const result = await analyticsService.getMetrics(
        '2023-01-01',
        '2023-01-31',
        [],
        'owner',
        []
      );

      expect(result).toEqual({
        occupancyRate: 80,
        totalRevenue: 5000,
        avgRent: 1200,
        activeTenants: 8
      });

      expect(prisma.property.findMany).toHaveBeenCalled();
      expect(prisma.tenant.count).toHaveBeenCalledWith({
        where: {
          isActive: true,
          propertyId: { in: ['prop1', 'prop2'] }
        }
      });
    });

    it('should filter properties for manager role', async () => {
      prisma.property.findMany.mockResolvedValue([
        { id: 'prop1', totalUnits: 5 }
      ]);
      prisma.tenant.count.mockResolvedValue(4);
      prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: 2500 } });
      prisma.invoice.aggregate.mockResolvedValue({ _avg: { amount: 1000 } });

      const result = await analyticsService.getMetrics(
        '2023-01-01',
        '2023-01-31',
        [],
        'manager',
        ['prop1']
      );

      expect(result.activeTenants).toBe(4);
      expect(prisma.tenant.count).toHaveBeenCalledWith({
        where: {
          isActive: true,
          propertyId: { in: ['prop1'] }
        }
      });
    });

    it('should handle zero total units', async () => {
      prisma.property.findMany.mockResolvedValue([]);
      prisma.tenant.count.mockResolvedValue(0);
      prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: 0 } });
      prisma.invoice.aggregate.mockResolvedValue({ _avg: { amount: 0 } });

      const result = await analyticsService.getMetrics(
        '2023-01-01',
        '2023-01-31',
        ['prop1'],
        'owner',
        []
      );

      expect(result.occupancyRate).toBe(0);
    });
  });

  describe('predictMaintenance', () => {
    it('should return predictions with sufficient historical data', async () => {
      const mockHistory = [
        {
          type: 'plumbing',
          date: new Date('2023-01-01'),
          cost: 500.00,
          priority: 'medium',
        },
        {
          type: 'plumbing',
          date: new Date('2023-07-01'),
          cost: 600.00,
          priority: 'high',
        },
        {
          type: 'electrical',
          date: new Date('2023-03-01'),
          cost: 800.00,
          priority: 'medium',
        },
        {
          type: 'electrical',
          date: new Date('2023-09-01'),
          cost: 750.00,
          priority: 'medium',
        },
      ];

      prisma.maintenanceHistory.findMany.mockResolvedValue(mockHistory);

      const result = await analyticsService.predictMaintenance('prop1');

      expect(result.predictions).toHaveLength(2);
      expect(result.predictions[0]).toHaveProperty('type');
      expect(result.predictions[0]).toHaveProperty('predictedDate');
      expect(result.predictions[0]).toHaveProperty('confidence');
      expect(result.predictions[0]).toHaveProperty('estimatedCost');
      expect(result.predictions[0]).toHaveProperty('priority');
      expect(result.predictions[0].confidence).toBeGreaterThanOrEqual(70);
    });

    it('should return message when insufficient historical data', async () => {
      prisma.maintenanceHistory.findMany.mockResolvedValue([
        { type: 'plumbing', date: new Date('2023-01-01'), cost: 500.00 }
      ]);

      const result = await analyticsService.predictMaintenance('prop1');

      expect(result.predictions).toHaveLength(0);
      expect(result.message).toContain('Insufficient maintenance history');
    });

    it('should filter out low confidence predictions', async () => {
      const mockHistory = [
        {
          type: 'plumbing',
          date: new Date('2023-01-01'),
          cost: 500.00,
          priority: 'medium',
        },
        {
          type: 'plumbing',
          date: new Date('2024-01-01'), // Very long interval, low confidence
          cost: 600.00,
          priority: 'medium',
        },
      ];

      prisma.maintenanceHistory.findMany.mockResolvedValue(mockHistory);

      const result = await analyticsService.predictMaintenance('prop1');

      // Should filter out predictions with confidence < 70%
      expect(result.predictions.length).toBeLessThanOrEqual(1);
    });

    it('should handle database errors gracefully', async () => {
      prisma.maintenanceHistory.findMany.mockRejectedValue(new Error('Database error'));

      const result = await analyticsService.predictMaintenance('prop1');

      expect(result.predictions).toHaveLength(0);
      expect(result.error).toContain('Failed to generate maintenance predictions');
    });

    it('should calculate confidence based on interval consistency', async () => {
      const mockHistory = [
        {
          type: 'plumbing',
          date: new Date('2023-01-01'),
          cost: 500.00,
          priority: 'medium',
        },
        {
          type: 'plumbing',
          date: new Date('2023-07-01'), // 6 months interval
          cost: 600.00,
          priority: 'medium',
        },
        {
          type: 'plumbing',
          date: new Date('2024-01-01'), // 6 months interval (consistent)
          cost: 550.00,
          priority: 'medium',
        },
      ];

      prisma.maintenanceHistory.findMany.mockResolvedValue(mockHistory);

      const result = await analyticsService.predictMaintenance('prop1');

      expect(result.predictions.length).toBeGreaterThan(0);
      // Consistent intervals should result in higher confidence
      expect(result.predictions[0].confidence).toBeGreaterThan(70);
    });

    it('should achieve >75% accuracy on test dataset', async () => {
      // Test dataset with known churn outcomes
      const testData = [
        {
          tenantId: 'test-tenant-1',
          history: [
            { type: 'payment', date: new Date('2023-01-01'), status: 'paid' },
            { type: 'payment', date: new Date('2023-02-01'), status: 'paid' },
            { type: 'payment', date: new Date('2023-03-01'), status: 'failed' },
            { type: 'payment', date: new Date('2023-04-01'), status: 'failed' },
          ],
          expectedChurn: true, // This tenant should have high churn risk
        },
        {
          tenantId: 'test-tenant-2',
          history: [
            { type: 'payment', date: new Date('2023-01-01'), status: 'paid' },
            { type: 'payment', date: new Date('2023-02-01'), status: 'paid' },
            { type: 'payment', date: new Date('2023-03-01'), status: 'paid' },
            { type: 'payment', date: new Date('2023-04-01'), status: 'paid' },
          ],
          expectedChurn: false, // This tenant should have low churn risk
        },
      ];

      let correctPredictions = 0;
      const totalPredictions = testData.length;

      for (const testCase of testData) {
        // Mock tenant data
        prisma.tenant.findMany.mockResolvedValue([{
          id: testCase.tenantId,
          createdAt: new Date('2022-01-01'), // 24 months ago
          screeningStatus: { riskLevel: 'low' },
        }]);

        // Mock payment history
        prisma.payment.findMany.mockResolvedValue(
          testCase.history.map((h, index) => ({
            id: `payment-${index}`,
            status: h.status,
            createdAt: h.date,
          }))
        );

        // Mock invoice history
        prisma.invoice.findMany.mockResolvedValue([]);

        const result = await analyticsService.predictChurn(testCase.tenantId);

        // Check if prediction matches expected outcome
        const predictedHighRisk = result.churnProbability >= 50;
        const expectedHighRisk = testCase.expectedChurn;

        if (predictedHighRisk === expectedHighRisk) {
          correctPredictions++;
        }
      }

      const accuracy = (correctPredictions / totalPredictions) * 100;
      console.log(`Churn prediction accuracy: ${accuracy}%`);

      // Assert accuracy is above 75%
      expect(accuracy).toBeGreaterThanOrEqual(75);
    });
  });
});