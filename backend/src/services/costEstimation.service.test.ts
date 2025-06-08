import { costEstimationService } from './costEstimation.service';
import { prisma } from '../config/database';

jest.mock('../config/database', () => ({
  prisma: {
    workOrder: {
      findUnique: jest.fn(),
    },
  },
}));

describe('CostEstimationService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return an estimation if work order exists', async () => {
    const mockWorkOrder = {
      id: 'work-order-1',
      priority: 'HIGH',
    };
    (prisma.workOrder.findUnique as jest.Mock).mockResolvedValue(mockWorkOrder);

    const estimation = await costEstimationService.estimateCost('work-order-1');
    expect(estimation).toBeDefined();
    expect(estimation.workOrderId).toBe('work-order-1');
    expect(estimation.estimatedCost).toBe(150);
  });

  it('should return null if work order does not exist', async () => {
    (prisma.workOrder.findUnique as jest.Mock).mockResolvedValue(null);

    const estimation = await costEstimationService.estimateCost('work-order-1');
    expect(estimation).toBeNull();
  });
});
