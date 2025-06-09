const tenantIssuePredictionService = require('./tenantIssuePrediction.service').default;
const { PrismaClient } = require('@prisma/client');

const mockPrisma = {
  user: {
    findUnique: globalThis.jest.fn(),
  },
  tenantIssuePrediction: {
    create: globalThis.jest.fn(),
  },
  $transaction: globalThis.jest.fn().mockImplementation(callback => callback(mockPrisma)),
};

globalThis.jest.mock('@prisma/client', () => ({
  PrismaClient: globalThis.jest.fn(() => mockPrisma),
}));

const prisma = new PrismaClient();

describe('TenantIssuePredictionService', () => {
  afterEach(() => {
    globalThis.jest.clearAllMocks();
  });

  it('should predict potential tenant issues', async () => {
    const mockTenant = {
      id: 'tenant-1',
      maintenanceRequests: [],
      messages: [],
    };
    const mockPrediction = {
      id: '1',
      tenantId: 'tenant-1',
      prediction: 'Late rent payment',
      confidence: 0.75,
    };
    prisma.user.findUnique.mockResolvedValue(mockTenant);
    prisma.tenantIssuePrediction.create.mockResolvedValue(mockPrediction);

    const prediction = await tenantIssuePredictionService.predictIssues('tenant-1');
    expect(prediction).toEqual(mockPrediction);
  });

  it('should return null if tenant does not exist', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const prediction = await tenantIssuePredictionService.predictIssues('tenant-1');
    expect(prediction).toBeNull();
  });
});
