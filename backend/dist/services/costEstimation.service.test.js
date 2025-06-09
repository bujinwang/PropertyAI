"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const costEstimation_service_1 = require("./costEstimation.service");
const globals_1 = require("@jest/globals");
const client_1 = require("@prisma/client");
const mockPrisma = {
    workOrder: {
        findUnique: globals_1.jest.fn(),
    },
};
globals_1.jest.mock('../config/database', () => ({
    prisma: mockPrisma,
}));
(0, globals_1.describe)('CostEstimationService', () => {
    (0, globals_1.afterEach)(() => {
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.it)('should return an estimation if work order exists', async () => {
        const mockWorkOrder = {
            id: 'work-order-1',
            status: client_1.WorkOrderStatus.OPEN,
            createdAt: new Date(),
            updatedAt: new Date(),
            title: 'Leaky Faucet',
            description: 'The faucet in the kitchen is leaking.',
            priority: client_1.Priority.HIGH,
            completedAt: null,
            maintenanceRequestId: 'maintenance-request-1',
        };
        mockPrisma.workOrder.findUnique.mockResolvedValue(mockWorkOrder);
        const estimation = await costEstimation_service_1.costEstimationService.estimateCost('work-order-1');
        (0, globals_1.expect)(estimation).toBeDefined();
        (0, globals_1.expect)(estimation.workOrderId).toBe('work-order-1');
        (0, globals_1.expect)(estimation.estimatedCost).toBe(150);
    });
    (0, globals_1.it)('should return null if work order does not exist', async () => {
        mockPrisma.workOrder.findUnique.mockResolvedValue(null);
        const estimation = await costEstimation_service_1.costEstimationService.estimateCost('work-order-1');
        (0, globals_1.expect)(estimation).toBeNull();
    });
    (0, globals_1.it)('should return base estimation for low priority work order', async () => {
        const mockWorkOrder = {
            id: 'work-order-2',
            status: client_1.WorkOrderStatus.OPEN,
            createdAt: new Date(),
            updatedAt: new Date(),
            title: 'Broken Lightbulb',
            description: 'The lightbulb in the living room is broken.',
            priority: client_1.Priority.LOW,
            completedAt: null,
            maintenanceRequestId: 'maintenance-request-2',
        };
        mockPrisma.workOrder.findUnique.mockResolvedValue(mockWorkOrder);
        const estimation = await costEstimation_service_1.costEstimationService.estimateCost('work-order-2');
        (0, globals_1.expect)(estimation).toBeDefined();
        (0, globals_1.expect)(estimation.workOrderId).toBe('work-order-2');
        (0, globals_1.expect)(estimation.estimatedCost).toBe(100);
    });
});
//# sourceMappingURL=costEstimation.service.test.js.map