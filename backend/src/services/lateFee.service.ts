import { prisma } from '../config/database';
import { scheduleJob } from 'node-schedule';
import { sendNotification } from './notificationService';

class LateFeeService {
  public initialize() {
    // Schedule a job to run every day at midnight to check for late payments
    scheduleJob('0 0 * * *', this.applyLateFees);
  }

  public async applyLateFees() {
    const today = new Date();
    const leases = await prisma.lease.findMany({
      where: {
        status: 'ACTIVE',
        transactions: {
          some: {
            type: 'RENT',
            status: 'PENDING',
            createdAt: {
              lt: today,
            },
          },
        },
      },
      include: {
        tenant: true,
        transactions: true,
      },
    });

    for (const lease of leases) {
      const rentTransaction = lease.transactions.find(t => t.type === 'RENT' && t.status === 'PENDING');
      if (rentTransaction) {
        const dueDate = new Date(rentTransaction.createdAt);
        const diffDays = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));

        if (diffDays > 5) { // Apply late fee if payment is more than 5 days late
          const lateFee = lease.rentAmount * 0.05; // 5% late fee
          await prisma.transaction.create({
            data: {
              amount: lateFee,
              type: 'FEES',
              status: 'PENDING',
              description: 'Late rent payment fee',
              leaseId: lease.id,
            },
          });

          const message = `A late fee of $${lateFee} has been applied to your account for the overdue rent payment.`;
          await sendNotification('email', lease.tenant.email, 'Late Fee Applied', message);
          if (lease.tenant.phone) {
            await sendNotification('sms', lease.tenant.phone, 'Late Fee Applied', message);
          }
        }
      }
    }
  }
}

export const lateFeeService = new LateFeeService();
