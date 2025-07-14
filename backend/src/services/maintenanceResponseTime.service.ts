import { prisma } from '../config/database';
import { MaintenanceRequest, MaintenanceResponseTime } from '@prisma/client';

class MaintenanceResponseTimeService {
  public async trackResponseTime(
    maintenanceRequestId: string
  ): Promise<MaintenanceResponseTime | null> {
    const maintenanceRequest = await prisma.maintenanceRequest.findUnique({
      where: { id: maintenanceRequestId },
    });

    if (maintenanceRequest && maintenanceRequest.createdAt) {
      const responseTime =
        (new Date().getTime() - maintenanceRequest.createdAt.getTime()) / 60000; // in minutes

      const maintenanceResponseTime = await prisma.maintenanceResponseTime.create({
        data: {
          maintenanceRequestId,
          responseTime,
        },
      });
      return maintenanceResponseTime;
    }

    return null;
  }

  public async optimizeResponseTime(maintenanceRequestId: string): Promise<void> {
    const maintenanceRequest = await prisma.maintenanceRequest.findUnique({
      where: { id: maintenanceRequestId },
    });

    if (maintenanceRequest) {
      let priority = maintenanceRequest.priority;
      if (maintenanceRequest.description.toLowerCase().includes('fire')) {
        priority = 'EMERGENCY';
      } else if (maintenanceRequest.description.toLowerCase().includes('leak')) {
        priority = 'HIGH';
      }

      await prisma.maintenanceRequest.update({
        where: { id: maintenanceRequestId },
        data: { priority },
      });
    }
  }
}

export const maintenanceResponseTimeService =
  new MaintenanceResponseTimeService();
