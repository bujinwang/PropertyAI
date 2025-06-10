import { prisma } from '../config/database';
import { aiRoutingService } from './aiRouting.service';
import { MaintenanceRequest, WorkOrder } from '@prisma/client';
import { sendNotification } from './notificationService';

class MaintenanceService {
  public async getAllMaintenanceRequests(): Promise<MaintenanceRequest[]> {
    return prisma.maintenanceRequest.findMany({
      include: {
        property: true,
        unit: true,
      },
    });
  }

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

      const vendor = await prisma.vendor.findUnique({ where: { id: bestVendorId } });
      if (vendor) {
        const message = `You have been assigned a new work order: ${workOrder.title}.`;
        await sendNotification('email', vendor.email, 'New Work Order Assignment', message);
      }
    }

    return workOrder;
  }
}

export const maintenanceService = new MaintenanceService();
