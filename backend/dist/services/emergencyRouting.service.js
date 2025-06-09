"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emergencyRoutingService = void 0;
const database_1 = require("../config/database");
class EmergencyRoutingService {
    async isEmergency(maintenanceRequestId) {
        const maintenanceRequest = await database_1.prisma.maintenanceRequest.findUnique({
            where: { id: maintenanceRequestId },
        });
        if (maintenanceRequest) {
            return maintenanceRequest.priority === 'EMERGENCY';
        }
        return false;
    }
    async routeEmergencyRequest(maintenanceRequestId) {
        const maintenanceRequest = await database_1.prisma.maintenanceRequest.findUnique({
            where: { id: maintenanceRequestId },
        });
        if (maintenanceRequest && maintenanceRequest.priority === 'EMERGENCY' && maintenanceRequest.categoryId) {
            const rule = await database_1.prisma.emergencyRoutingRule.findFirst({
                where: {
                    priority: 'EMERGENCY',
                    categoryId: maintenanceRequest.categoryId,
                },
            });
            if (rule) {
                return rule.vendorId;
            }
        }
        return null;
    }
}
exports.emergencyRoutingService = new EmergencyRoutingService();
//# sourceMappingURL=emergencyRouting.service.js.map