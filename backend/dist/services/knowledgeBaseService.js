"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class KnowledgeBaseService {
    async createEntry(data) {
        return prisma.knowledgeBaseEntry.create({ data });
    }
    async getEntry(id) {
        return prisma.knowledgeBaseEntry.findUnique({ where: { id } });
    }
    async getEntries() {
        return prisma.knowledgeBaseEntry.findMany();
    }
    async updateEntry(id, data) {
        return prisma.knowledgeBaseEntry.update({ where: { id }, data });
    }
    async deleteEntry(id) {
        return prisma.knowledgeBaseEntry.delete({ where: { id } });
    }
}
exports.default = new KnowledgeBaseService();
//# sourceMappingURL=knowledgeBaseService.js.map