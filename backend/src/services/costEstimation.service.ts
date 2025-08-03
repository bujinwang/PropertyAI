import { prisma } from '../config/database';
import { WorkOrder } from '@prisma/client';
import { aiOrchestrationService } from './aiOrchestration.service';

class CostEstimationService {
  public async collectDataForCostEstimation(workOrderId: string): Promise<any | null> {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        MaintenanceRequest: {
          include: {
            Rental: true,
          },
        },
      },
    });
    return workOrder;
  }

  public async estimateCost(workOrderId: string): Promise<any | null> {
    const workOrder: any = await this.collectDataForCostEstimation(workOrderId);

    if (workOrder) {
      const prompt = `
        Based on the following work order details, provide a cost estimation in USD.
        - Title: ${workOrder.title}
        - Description: ${workOrder.description}
        - Priority: ${workOrder.priority}
        - Property Type: ${workOrder.MaintenanceRequest?.Rental?.propertyType}
        - Location: ${workOrder.MaintenanceRequest?.Rental?.city}, ${workOrder.MaintenanceRequest?.Rental?.state}

        Provide the estimated cost as a single number (e.g., 250.00) and a confidence score between 0 and 1.
        Format the output as a JSON object with "estimatedCost" and "confidence" keys.
      `;

      const aiResult = await aiOrchestrationService.generateText(prompt);
      try {
        const parsedResult = JSON.parse(aiResult);
        
        await prisma.costEstimation.create({
          data: {
            workOrderId,
            estimatedCost: parsedResult.estimatedCost,
            details: `Confidence: ${parsedResult.confidence}`,
          },
        });

        return {
          workOrderId,
          estimatedCost: parsedResult.estimatedCost,
          confidence: parsedResult.confidence,
        };
      } catch (error) {
        console.error('Failed to parse or save AI cost estimation result:', error);
        return null;
      }
    }

    return null;
  }
}

export const costEstimationService = new CostEstimationService();
