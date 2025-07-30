import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class LateFeeService {
  async applyLateFees() {
    const leases = await prisma.lease.findMany({
      where: {
        status: 'ACTIVE',
      },
    });

    for (const lease of leases) {
      const dueDate = new Date(lease.endDate);
      const today = new Date();
      const diffTime = today.getTime() - dueDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 0) {
        const lateFee = lease.rentAmount * 0.1; // 10% late fee
        await prisma.transaction.create({
          data: {
            amount: lateFee,
            type: 'FEE',
            status: 'COMPLETED',
            description: 'Late fee',
            leaseId: lease.id,
          },
        });
      }
    }
  }
}

export default new LateFeeService();
