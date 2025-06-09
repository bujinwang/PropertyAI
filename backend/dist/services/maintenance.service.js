"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maintenanceService = void 0;
const database_1 = require("../config/database");
const aiRouting_service_1 = require("./aiRouting.service");
class MaintenanceService {
    async createWorkOrderFromRequest(maintenanceRequestId) {
        const maintenanceRequest = await database_1.prisma.maintenanceRequest.findUnique({
            where: { id: maintenanceRequestId },
        });
        if (!maintenanceRequest) {
            return null;
        }
        const workOrder = await database_1.prisma.workOrder.create({
            data: {
                title: maintenanceRequest.title,
                description: maintenanceRequest.description,
                priority: maintenanceRequest.priority,
                maintenanceRequestId: maintenanceRequest.id,
            },
        });
        const bestVendorId = await aiRouting_service_1.aiRoutingService.findBestVendor(workOrder.id);
        if (bestVendorId) {
            await database_1.prisma.workOrderAssignment.create({
                data: {
                    workOrderId: workOrder.id,
                    vendorId: bestVendorId,
                },
            });
        }
        return workOrder;
    }
}
exports.maintenanceService = new MaintenanceService();
//# sourceMappingURL=maintenance.service.js.map