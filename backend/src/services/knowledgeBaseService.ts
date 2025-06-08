import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class KnowledgeBaseService {
  async createEntry(data: {
    intent: string;
    response: string;
    category: string;
    keywords: string[];
  }) {
    return prisma.knowledgeBaseEntry.create({ data });
  }

  async getEntry(id: string) {
    return prisma.knowledgeBaseEntry.findUnique({ where: { id } });
  }

  async getEntries() {
    return prisma.knowledgeBaseEntry.findMany();
  }

  async updateEntry(
    id: string,
    data: {
      intent?: string;
      response?: string;
      category?: string;
      keywords?: string[];
    }
  ) {
    return prisma.knowledgeBaseEntry.update({ where: { id }, data });
  }

  async deleteEntry(id: string) {
    return prisma.knowledgeBaseEntry.delete({ where: { id } });
  }
}

export default new KnowledgeBaseService();
