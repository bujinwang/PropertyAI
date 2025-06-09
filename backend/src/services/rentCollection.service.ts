import { prisma } from '../config/database';
import { scheduleJob } from 'node-schedule';
import { sendEmail } from './emailService';

class RentCollectionService {
  public initialize() {
    // Schedule a job to run every day at midnight to check for due rents
    scheduleJob('0 0 * * *', this.collectDueRents);
  }

  public async collectDueRents() {
    const today = new Date();
    const leases = await prisma.lease.findMany({
      where: {
        status: 'ACTIVE',
        renewalDate: {
          gte: today,
        },
      },
      include: {
        tenant: true,
      },
    });

    for (const lease of leases) {
      const rentDueDate = new Date(lease.renewalDate!);
      this.sendRentReminder(lease.tenant.email, lease.tenant.firstName, lease.rentAmount, rentDueDate);
    }
  }

  private async sendRentReminder(email: string, name: string, amount: number, dueDate: Date) {
    const today = new Date();
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

    let subject = 'Upcoming Rent Payment Reminder';
    let text = `Dear ${name},\n\nThis is a reminder that your rent payment of $${amount} is due in ${diffDays} days.\n\nThank you,\nPropertyAI`;

    if (diffDays <= 0) {
      subject = 'Urgent: Rent Payment Overdue';
      text = `Dear ${name},\n\nThis is an urgent reminder that your rent payment of $${amount} is overdue.\n\nPlease make the payment as soon as possible to avoid late fees.\n\nThank you,\nPropertyAI`;
    } else if (diffDays <= 3) {
      subject = 'Rent Payment Due Soon';
      text = `Dear ${name},\n\nThis is a reminder that your rent payment of $${amount} is due in ${diffDays} days.\n\nThank you,\nPropertyAI`;
    }

    await sendEmail(email, subject, text);
  }
}

export const rentCollectionService = new RentCollectionService();
