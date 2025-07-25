import { PrismaClient } from '@prisma/client';
import { sendSms } from './smsService';

const prisma = new PrismaClient();

class RoutingService {
  async routeRequest(requestId: string, category: { urgency: string; type: string }) {
    const vendors = await prisma.vendor.findMany({
      where: {
        specialty: category.type,
        availability: 'AVAILABLE',
      },
    });

    if (vendors.length > 0) {
      const vendor = vendors[0];
      await prisma.workOrder.create({
        data: {
          maintenanceRequestId: requestId,
          assignments: {
            create: {
              vendorId: vendor.id,
            },
          },
          title: 'New Maintenance Request',
          description: `A new maintenance request of type ${category.type} has been assigned to you.`,
          priority: category.urgency.toUpperCase() as any,
        },
      });

      const contactPerson = await prisma.user.findUnique({ where: { id: vendor.contactPersonId! } });
      if (contactPerson?.phone) {
        await sendSms(
          contactPerson.phone,
          `You have a new maintenance request: ${requestId}`
        );
      }
    }
  }
}

export default new RoutingService();
