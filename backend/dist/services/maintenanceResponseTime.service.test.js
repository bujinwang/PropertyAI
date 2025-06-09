"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const maintenanceResponseTime_service_1 = require("./maintenanceResponseTime.service");
const database_1 = require("../config/database");
jest.mock('../config/database', () => ({
    prisma: {
        maintenanceRequest: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        maintenanceResponseTime: {
            create: jest.fn(),
        },
    },
}));
describe('MaintenanceResponseTimeService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should track response time', async () => {
        const mockRequest = { id: 'request1', createdAt: new Date() };
        const mockResponseTime = { id: '1', maintenanceRequestId: 'request1', responseTime: 10 };
        database_1.prisma.maintenanceRequest.findUnique.mockResolvedValue(mockRequest);
        database_1.prisma.maintenanceResponseTime.create.mockResolvedValue(mockResponseTime);
        const responseTime = await maintenanceResponseTime_service_1.maintenanceResponseTimeService.trackResponseTime('request1');
        expect(responseTime).toEqual(mockResponseTime);
    });
    it('should optimize response time', async () => {
        const mockRequest = { id: 'request1', description: 'fire', priority: 'LOW' };
        database_1.prisma.maintenanceRequest.findUnique.mockResolvedValue(mockRequest);
        await maintenanceResponseTime_service_1.maintenanceResponseTimeService.optimizeResponseTime('request1');
        expect(database_1.prisma.maintenanceRequest.update).toHaveBeenCalledWith({
            where: { id: 'request1' },
            data: { priority: 'EMERGENCY' },
        });
    });
});
//# sourceMappingURL=maintenanceResponseTime.service.test.js.map