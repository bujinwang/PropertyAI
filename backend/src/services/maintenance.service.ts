import { prisma } from '../config/database';
import { aiRoutingService } from './aiRouting.service';
import { MaintenanceRequest, WorkOrder, MaintenanceStatus } from '@prisma/client';
import { sendNotification } from './notificationService';
import { Prisma } from '@prisma/client';
import { pubSubService } from './pubSub.service';

class MaintenanceService {
  public async getAllMaintenanceRequests(): Promise<MaintenanceRequest[]> {
    return prisma.maintenanceRequest.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
        scheduledDate: true,
        completedDate: true,
        rentalId: true,
        requestedById: true,
        categoryId: true,
        Rental: {
          select: {
            id: true,
            title: true,
            unitNumber: true,
            address: true,
            city: true,
            state: true,
          },
        },
      },
    }) as unknown as MaintenanceRequest[];
  }

  public async createWorkOrderFromRequest(maintenanceRequestId: string): Promise<WorkOrder | null> {
    return await prisma.$transaction(async (tx) => {
      const maintenanceRequest = await tx.maintenanceRequest.findUnique({
        where: { id: maintenanceRequestId },
      });

      if (!maintenanceRequest) {
        return null;
      }

      const workOrder = await tx.workOrder.create({
        data: {
          title: maintenanceRequest.title,
          description: maintenanceRequest.description,
          priority: maintenanceRequest.priority,
          maintenanceRequestId: maintenanceRequest.id,
        },
      });

      const bestVendorId = await aiRoutingService.findBestVendor(workOrder.id);

      if (bestVendorId) {
        await tx.workOrderAssignment.create({
          data: {
            workOrderId: workOrder.id,
            vendorId: bestVendorId,
          },
        });

        const vendor = await tx.vendor.findUnique({ where: { id: bestVendorId } });
        if (vendor) {
          const message = `You have been assigned a new work order: ${workOrder.title}.`;
          await sendNotification('email', vendor.email, 'New Work Order Assignment', message);
        }
      }

      return workOrder;
    });
  }

  public async updateMaintenanceRequestStatus(id: string, status: MaintenanceStatus): Promise<MaintenanceRequest | null> {
    const updatedRequest = await prisma.maintenanceRequest.update({
      where: { id },
      data: { status },
    });

    if (updatedRequest) {
      pubSubService.publish('dashboard-updates', JSON.stringify({
        type: 'MAINTENANCE_REQUEST_UPDATE',
        payload: updatedRequest,
      }));
    }

    return updatedRequest;
  }

  public async createWorkOrdersFromRequests(maintenanceRequestIds: string[]): Promise<WorkOrder[]> {
    const workOrders: WorkOrder[] = [];
    await prisma.$transaction(async (tx) => {
      for (const maintenanceRequestId of maintenanceRequestIds) {
        const maintenanceRequest = await tx.maintenanceRequest.findUnique({
          where: { id: maintenanceRequestId },
        });
        if (!maintenanceRequest) continue;
        const workOrder = await tx.workOrder.create({
          data: {
            title: maintenanceRequest.title,
            description: maintenanceRequest.description,
            priority: maintenanceRequest.priority,
            maintenanceRequestId: maintenanceRequest.id,
          },
        });
        workOrders.push(workOrder);
      }
    });
    return workOrders;
  }
}

export const maintenanceService = new MaintenanceService();
