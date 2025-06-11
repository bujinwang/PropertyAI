import { prisma } from '../config/database';
import { User } from '@prisma/client';

class ComplianceService {
  async handleDSAR(userId: string): Promise<any> {
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        propertiesManaged: true,
        propertiesOwned: true,
        units: true,
        documents: true,
        maintenanceRequests: true,
        sentMessages: true,
        receivedMessages: true,
        notifications: true,
        listings: true,
        applications: true,
        oauthConnections: true,
        vendorPerformanceRatings: true,
        auditEntries: true,
        leases: true,
      },
    });

    return userData;
  }

  async deleteUserData(userId: string): Promise<void> {
    await prisma.user.delete({
      where: { id: userId },
    });
  }

  async recordConsent(userId: string, consent: boolean): Promise<void> {
    await prisma.consent.create({
      data: {
        userId,
        consent,
      },
    });
  }
}

export const complianceService = new ComplianceService();
