import { PrismaClient } from '@prisma/client';
import NotificationService from './notificationService';

const prisma = new PrismaClient();

class ReminderService {
  async sendReminders() {
    const leases = await prisma.lease.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        tenant: true,
      },
    });

    for (const lease of leases) {
      const dueDate = new Date(lease.endDate);
      const today = new Date();
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 7 || diffDays === 3 || diffDays === 1) {
        await NotificationService.createNotification(
          lease.tenantId!,
          'Upcoming Rent Payment',
          `Your rent payment of $${lease.rentAmount} is due in ${diffDays} days.`,
          'PAYMENT'
        );
      }
    }
  }
}

export default new ReminderService();
