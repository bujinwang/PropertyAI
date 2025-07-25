import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorMiddleware';

const prisma = new PrismaClient();

class ComplianceService {
  async getDataAccessRequest(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        applications: true,
        leases: true,
        sentMessages: true,
        receivedMessages: true,
        notifications: true,
        devices: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  async getDataPortabilityRequest(userId: string) {
    const user = await this.getDataAccessRequest(userId);
    return JSON.stringify(user, null, 2);
  }

  async getDataErasureRequest(userId: string) {
    await prisma.user.delete({ where: { id: userId } });
  }
}

export const complianceService = new ComplianceService();
