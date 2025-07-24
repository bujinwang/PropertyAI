import { costEstimationService } from './costEstimation.service';
import { prisma } from '../config/database';
import { jest, describe, afterEach, it, expect } from '@jest/globals';
import { WorkOrder, Priority, WorkOrderStatus } from '@prisma/client';
let mockWorkOrderFindUnique: any;

describe('CostEstimationService', () => {
  beforeEach(() => {
    mockWorkOrderFindUnique = jest.spyOn(prisma.workOrder, 'findUnique');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return an estimation if work order exists', async () => {
    const mockWorkOrder: WorkOrder = {
      id: 'work-order-1',
      status: WorkOrderStatus.OPEN,
      createdAt: new Date(),
      updatedAt: new Date(),
      title: 'Leaky Faucet',
      description: 'The faucet in the kitchen is leaking.',
      priority: Priority.HIGH,
      completedAt: null,
      maintenanceRequestId: 'maintenance-request-1',
    };
    mockWorkOrderFindUnique.mockResolvedValue(mockWorkOrder);

    const estimation = await costEstimationService.estimateCost('work-order-1');
    expect(estimation).toBeDefined();
    expect(estimation.workOrderId).toBe('work-order-1');
    expect(estimation.estimatedCost).toBe(150);
  });

  it('should return null if work order does not exist', async () => {
    mockWorkOrderFindUnique.mockResolvedValue(null);

    const estimation = await costEstimationService.estimateCost('work-order-1');
    expect(estimation).toBeNull();
  });

  it('should return base estimation for low priority work order', async () => {
    const mockWorkOrder: WorkOrder = {
      id: 'work-order-2',
      status: WorkOrderStatus.OPEN,
      createdAt: new Date(),
      updatedAt: new Date(),
      title: 'Broken Lightbulb',
      description: 'The lightbulb in the living room is broken.',
      priority: Priority.LOW,
      completedAt: null,
      maintenanceRequestId: 'maintenance-request-2',
    };
    mockWorkOrderFindUnique.mockResolvedValue(mockWorkOrder);

    const estimation = await costEstimationService.estimateCost('work-order-2');
    expect(estimation).toBeDefined();
    expect(estimation.workOrderId).toBe('work-order-2');
    expect(estimation.estimatedCost).toBe(100);
  });
});
