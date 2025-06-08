import { prisma } from '../config/database';
import { WorkOrder } from '@prisma/client';

class CostEstimationService {
  public async collectDataForCostEstimation(workOrderId: string): Promise<WorkOrder | null> {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        maintenanceRequest: {
          include: {
            unit: {
              include: {
                property: true,
              },
            },
          },
        },
      },
    });
    return workOrder;
  }

  public async estimateCost(workOrderId: string): Promise<any | null> {
    // This is a placeholder for the actual AI cost estimation model.
    // In a real application, this would involve using a machine learning model
    // to estimate the cost based on the work order details.
    // For now, we'll use a simple rule-based approach.
    const workOrder = await this.collectDataForCostEstimation(workOrderId);

    if (workOrder) {
      let estimatedCost = 100; // Base cost
      if (workOrder.priority === 'HIGH' || workOrder.priority === 'EMERGENCY') {
        estimatedCost *= 1.5;
      }
      return {
        workOrderId,
        estimatedCost,
        confidence: 0.8,
      };
    }

    return null;
  }
}

export const costEstimationService = new CostEstimationService();
