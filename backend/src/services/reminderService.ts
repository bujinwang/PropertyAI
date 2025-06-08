import { PrismaClient } from '@prisma/client';
import NotificationService from './notificationService';
import EmailService from './emailService';
import SmsService from './smsService';

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
        const message = `Your rent payment of $${lease.rentAmount} is due in ${diffDays} days.`;
        await NotificationService.createNotification(
          lease.tenantId!,
          'Upcoming Rent Payment',
          message,
          'PAYMENT'
        );
        await EmailService.sendEmail(
          lease.tenant.email,
          'Upcoming Rent Payment',
          message
        );
        if (lease.tenant.phone) {
          await SmsService.sendSms(lease.tenant.phone, message);
        }
      }
    }
  }
}

export default new ReminderService();
