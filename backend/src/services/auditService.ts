import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class AuditService {
  async createEntry(data: {
    userId: string;
    action: string;
    details?: string;
  }) {
    return prisma.auditEntry.create({ data });
  }

  async getEntries() {
    return prisma.auditEntry.findMany();
  }
}

export default new AuditService();
