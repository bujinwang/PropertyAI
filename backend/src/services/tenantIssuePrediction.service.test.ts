import { tenantIssuePredictionService } from './tenantIssuePrediction.service';
import { prisma } from '../config/database';

jest.mock('../config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    tenantIssuePrediction: {
      create: jest.fn(),
    },
  },
}));

describe('TenantIssuePredictionService', () => {
  afterEach(() => {
    jest.clearAllMocks();
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
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockTenant);
    (prisma.tenantIssuePrediction.create as jest.Mock).mockResolvedValue(mockPrediction);

    const prediction = await tenantIssuePredictionService.predictIssues('tenant-1');
    expect(prediction).toEqual(mockPrediction);
  });

  it('should return null if tenant does not exist', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const prediction = await tenantIssuePredictionService.predictIssues('tenant-1');
    expect(prediction).toBeNull();
  });
});
