import { prisma } from '../config/database';
import { aiRoutingService } from './aiRouting.service';
import { MaintenanceRequest, WorkOrder } from '@prisma/client';

class MaintenanceService {
  public async createWorkOrderFromRequest(maintenanceRequestId: string): Promise<WorkOrder | null> {
    const maintenanceRequest = await prisma.maintenanceRequest.findUnique({
      where: { id: maintenanceRequestId },
    });

    if (!maintenanceRequest) {
      return null;
    }

    const workOrder = await prisma.workOrder.create({
      data: {
        title: maintenanceRequest.title,
        description: maintenanceRequest.description,
        priority: maintenanceRequest.priority,
        maintenanceRequestId: maintenanceRequest.id,
      },
    });

    const bestVendorId = await aiRoutingService.findBestVendor(workOrder.id);

    if (bestVendorId) {
      await prisma.workOrderAssignment.create({
        data: {
          workOrderId: workOrder.id,
          vendorId: bestVendorId,
        },
      });
    }

    return workOrder;
  }
}

export const maintenanceService = new MaintenanceService();
