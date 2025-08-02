import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

class AuditService {
  async createAuditEntry(
    userId: string,
    action: string,
    details?: string | object | null
  ) {
    const auditDetails = details === undefined || details === null
      ? Prisma.JsonNull
      : (typeof details === 'string' ? { message: details } : details);

    await prisma.auditEntry.create({
      data: {
        userId,
        action,
        entityType: 'USER_ACTION',
        entityId: userId,
        details: auditDetails,
      },
    });
  }

  async getAuditEntries() {
    return await prisma.auditEntry.findMany({
      orderBy: {
        timestamp: 'desc',
      },
    });
  }
}

export default new AuditService();
