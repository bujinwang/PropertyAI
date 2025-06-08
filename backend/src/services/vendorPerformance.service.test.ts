import { vendorPerformanceService } from './vendorPerformance.service';
import { prisma } from '../config/database';

jest.mock('../config/database', () => ({
  prisma: {
    vendorPerformanceRating: {
      create: jest.fn(),
    },
  },
}));

describe('VendorPerformanceService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a vendor performance rating', async () => {
    const mockRating = {
      id: '1',
      vendorId: 'vendor1',
      workOrderId: 'work-order-1',
      metricId: 'metric1',
      score: 5,
      comments: 'Great job!',
      ratedById: 'user1',
    };
    (prisma.vendorPerformanceRating.create as jest.Mock).mockResolvedValue(mockRating);

    const rating = await vendorPerformanceService.recordVendorPerformance(
      'vendor1',
      'work-order-1',
      'metric1',
      5,
      'Great job!',
      'user1'
    );

    expect(rating).toEqual(mockRating);
  });
});
