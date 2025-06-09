"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const predictiveMaintenance_service_1 = require("./predictiveMaintenance.service");
const database_1 = require("../config/database");
jest.mock('../config/database', () => ({
    prisma: {
        maintenanceRequest: {
            findMany: jest.fn(),
        },
    },
}));
describe('PredictiveMaintenanceService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should return a prediction if maintenance history exists', async () => {
        const mockHistory = [
            {
                id: '1',
                unitId: 'unit1',
                completedDate: new Date('2023-01-01'),
                actualCost: 100,
                priority: 'HIGH',
            },
        ];
        database_1.prisma.maintenanceRequest.findMany.mockResolvedValue(mockHistory);
        const prediction = await predictiveMaintenance_service_1.predictiveMaintenanceService.predictMaintenance('unit1');
        expect(prediction).toBeDefined();
        expect(prediction.unitId).toBe('unit1');
        expect(prediction.confidence).toBe(0.75);
    });
    it('should return null if no maintenance history exists', async () => {
        database_1.prisma.maintenanceRequest.findMany.mockResolvedValue([]);
        const prediction = await predictiveMaintenance_service_1.predictiveMaintenanceService.predictMaintenance('unit1');
        expect(prediction).toBeNull();
    });
});
//# sourceMappingURL=predictiveMaintenance.service.test.js.map