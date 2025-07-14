import { prisma } from '../config/database';
import { scheduleJob } from 'node-schedule';
import { sendEmail } from './emailService';

class DocumentExpirationService {
  public initialize() {
    // Schedule a job to run every day at midnight to check for expiring documents
    scheduleJob('0 0 * * *', this.sendExpirationReminders);
  }

  public async sendExpirationReminders() {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const expiringLeases = await prisma.lease.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          gte: today,
          lte: thirtyDaysFromNow,
        },
      },
      include: {
        tenant: true,
      },
    });

    for (const lease of expiringLeases) {
      const subject = 'Lease Renewal Reminder';
      const message = `Dear ${lease.tenant.firstName},\n\nThis is a reminder that your lease is expiring on ${lease.endDate.toDateString()}.\n\nPlease contact us to discuss renewal options.\n\nThank you,\nPropertyAI`;
      await sendEmail(lease.tenant.email, subject, message);
    }
  }
}

export const documentExpirationService = new DocumentExpirationService();
