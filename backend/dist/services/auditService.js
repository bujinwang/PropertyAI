"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class AuditService {
    async createAuditEntry(userId, action, details) {
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
exports.default = new AuditService();
//# sourceMappingURL=auditService.js.map