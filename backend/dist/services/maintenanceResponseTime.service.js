"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maintenanceResponseTimeService = void 0;
const database_1 = require("../config/database");
class MaintenanceResponseTimeService {
    async trackResponseTime(maintenanceRequestId) {
        const maintenanceRequest = await database_1.prisma.maintenanceRequest.findUnique({
            where: { id: maintenanceRequestId },
        });
        if (maintenanceRequest && maintenanceRequest.createdAt) {
            const responseTime = (new Date().getTime() - maintenanceRequest.createdAt.getTime()) / 60000; // in minutes
            const maintenanceResponseTime = await database_1.prisma.maintenanceResponseTime.create({
                data: {
                    maintenanceRequestId,
                    responseTime,
                },
            });
            return maintenanceResponseTime;
        }
        return null;
    }
    async optimizeResponseTime(maintenanceRequestId) {
        const maintenanceRequest = await database_1.prisma.maintenanceRequest.findUnique({
            where: { id: maintenanceRequestId },
        });
        if (maintenanceRequest) {
            let priority = maintenanceRequest.priority;
            if (maintenanceRequest.description.toLowerCase().includes('fire')) {
                priority = 'EMERGENCY';
            }
            else if (maintenanceRequest.description.toLowerCase().includes('leak')) {
                priority = 'HIGH';
            }
            await database_1.prisma.maintenanceRequest.update({
                where: { id: maintenanceRequestId },
                data: { priority },
            });
        }
    }
}
exports.maintenanceResponseTimeService = new MaintenanceResponseTimeService();
//# sourceMappingURL=maintenanceResponseTime.service.js.map