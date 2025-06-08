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
}

export default new AuditService();
