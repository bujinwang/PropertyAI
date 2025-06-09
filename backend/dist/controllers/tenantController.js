"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class TenantController {
    async getAllTenants(req, res) {
        try {
            const tenants = await prisma.user.findMany({
                where: { role: 'TENANT' },
            });
            res.status(200).json(tenants);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.default = new TenantController();
//# sourceMappingURL=tenantController.js.map