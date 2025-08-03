import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorMiddleware';

const prisma = new PrismaClient();

class ComplianceService {
  async getDataAccessRequest(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        Application: true, // Changed from 'applications' to 'Application'
        Lease: true, // Changed from 'leases' to 'Lease'
        Message_Message_senderIdToUser: true, // Changed from 'sentMessages' to the correct relationship name
        Message_Message_receiverIdToUser: true, // Changed from 'receivedMessages' to the correct relationship name
        Notification: true, // Changed from 'notifications' to 'Notification'
        Device: true, // Changed from 'devices' to 'Device'
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
