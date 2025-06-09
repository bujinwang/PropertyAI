"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class RoutingService {
    async routeRequest(requestId, category) {
        // This is a placeholder for the actual implementation
        const vendors = await prisma.user.findMany({
            where: {
                role: 'PROPERTY_MANAGER', // This is a placeholder
            },
        });
        if (vendors.length > 0) {
            // This is a placeholder for the actual implementation
            const vendor = vendors[0];
            await prisma.maintenanceRequest.update({
                where: { id: requestId },
                data: {
                    assignedToId: vendor.id,
                },
            });
            if (vendor.phone) {
                await SmsService.sendVendorNotification(vendor.phone, `You have a new maintenance request: ${requestId}`);
            }
        }
    }
}
exports.default = new RoutingService();
//# sourceMappingURL=routingService.js.map