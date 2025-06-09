import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class AuditService {
  async createAuditEntry(
    userId: string,
    action: string,
    details?: string
  ) {
    await prisma.auditEntry.create({
      data: {
        userId,
        action,
        details,
      },
    });
  }

  async getAuditEntries() {
    return await prisma.auditEntry.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}

export default new AuditService();
