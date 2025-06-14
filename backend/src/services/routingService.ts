import { PrismaClient } from '@prisma/client';
import { smsService } from './smsService';

const prisma = new PrismaClient();

class RoutingService {
  async routeRequest(requestId: string, category: { urgency: string; type: string }) {
    // This is a placeholder for the actual implementation
    const vendors = await prisma.user.findMany({
      where: {
        role: 'PROPERTY_MANAGER', // This is a placeholder
      },
    });

    if (vendors.length > 0) {
      // This is a placeholder for the actual implementation
      const vendor = vendors[0];
      await prisma.maintenanceRequest.update({
        where: { id: requestId },
        data: {
          assignedToId: vendor.id,
        },
      });
      if (vendor.phone) {
        await SmsService.sendVendorNotification(
          vendor.phone,
          `You have a new maintenance request: ${requestId}`
        );
      }
    }
  }
}

export default new RoutingService();
