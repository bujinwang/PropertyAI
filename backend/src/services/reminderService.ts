import { PrismaClient } from '@prisma/client';
import { sendNotification } from './notificationService';
import { sendEmail } from './emailService';
import { sendSms } from './smsService';

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
        await sendNotification(
          'email',
          lease.tenant.email,
          'Upcoming Rent Payment',
          message
        );
        if (lease.tenant.phone) {
          await sendNotification(
            'sms',
            lease.tenant.phone,
            'Upcoming Rent Payment',
            message
          );
        }
      }
    }
  }
}

export default new ReminderService();
