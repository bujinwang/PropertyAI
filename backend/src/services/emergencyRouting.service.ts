import { prisma } from '../config/database';
import { MaintenanceRequest, Priority } from '@prisma/client';

class EmergencyRoutingService {
  public async isEmergency(maintenanceRequestId: string): Promise<boolean> {
    const maintenanceRequest = await prisma.maintenanceRequest.findUnique({
      where: { id: maintenanceRequestId },
    });

    if (maintenanceRequest) {
      return maintenanceRequest.priority === 'EMERGENCY';
    }

    return false;
  }

  public async routeEmergencyRequest(maintenanceRequestId: string): Promise<string | null> {
    const maintenanceRequest = await prisma.maintenanceRequest.findUnique({
      where: { id: maintenanceRequestId },
    });

    if (maintenanceRequest && maintenanceRequest.priority === 'EMERGENCY') {
      const rule = await prisma.emergencyRoutingRule.findFirst({
        where: {
          priority: 'EMERGENCY',
        },
      });

      if (rule) {
        return rule.vendorId;
      }
    }

    return null;
  }
}

export const emergencyRoutingService = new EmergencyRoutingService();
