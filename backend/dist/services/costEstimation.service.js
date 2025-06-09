"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.costEstimationService = void 0;
const database_1 = require("../config/database");
class CostEstimationService {
    async collectDataForCostEstimation(workOrderId) {
        const workOrder = await database_1.prisma.workOrder.findUnique({
            where: { id: workOrderId },
            include: {
                maintenanceRequest: {
                    include: {
                        unit: {
                            include: {
                                property: true,
                            },
                        },
                    },
                },
            },
        });
        return workOrder;
    }
    async estimateCost(workOrderId) {
        // This is a placeholder for the actual AI cost estimation model.
        // In a real application, this would involve using a machine learning model
        // to estimate the cost based on the work order details.
        // For now, we'll use a simple rule-based approach.
        const workOrder = await this.collectDataForCostEstimation(workOrderId);
        if (workOrder) {
            let estimatedCost = 100; // Base cost
            if (workOrder.priority === 'HIGH' || workOrder.priority === 'EMERGENCY') {
                estimatedCost *= 1.5;
            }
            return {
                workOrderId,
                estimatedCost,
                confidence: 0.8,
            };
        }
        return null;
    }
}
exports.costEstimationService = new CostEstimationService();
//# sourceMappingURL=costEstimation.service.js.map