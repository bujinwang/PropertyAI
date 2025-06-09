"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const emergencyRouting_service_1 = require("./emergencyRouting.service");
const database_1 = require("../config/database");
jest.mock('../config/database', () => ({
    prisma: {
        maintenanceRequest: {
            findUnique: jest.fn(),
        },
        emergencyRoutingRule: {
            findFirst: jest.fn(),
        },
    },
}));
describe('EmergencyRoutingService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should return true if maintenance request is an emergency', async () => {
        const mockRequest = { id: 'request1', priority: 'EMERGENCY' };
        database_1.prisma.maintenanceRequest.findUnique.mockResolvedValue(mockRequest);
        const isEmergency = await emergencyRouting_service_1.emergencyRoutingService.isEmergency('request1');
        expect(isEmergency).toBe(true);
    });
    it('should return false if maintenance request is not an emergency', async () => {
        const mockRequest = { id: 'request1', priority: 'HIGH' };
        database_1.prisma.maintenanceRequest.findUnique.mockResolvedValue(mockRequest);
        const isEmergency = await emergencyRouting_service_1.emergencyRoutingService.isEmergency('request1');
        expect(isEmergency).toBe(false);
    });
    it('should return a vendor ID if a routing rule exists', async () => {
        const mockRequest = {
            id: 'request1',
            priority: 'EMERGENCY',
            categoryId: 'category1',
            category: { id: 'category1' },
        };
        const mockRule = { vendorId: 'vendor1' };
        database_1.prisma.maintenanceRequest.findUnique.mockResolvedValue(mockRequest);
        database_1.prisma.emergencyRoutingRule.findFirst.mockResolvedValue(mockRule);
        const vendorId = await emergencyRouting_service_1.emergencyRoutingService.routeEmergencyRequest('request1');
        expect(vendorId).toBe('vendor1');
    });
    it('should return null if no routing rule exists', async () => {
        const mockRequest = {
            id: 'request1',
            priority: 'EMERGENCY',
            categoryId: 'category1',
            category: { id: 'category1' },
        };
        database_1.prisma.maintenanceRequest.findUnique.mockResolvedValue(mockRequest);
        database_1.prisma.emergencyRoutingRule.findFirst.mockResolvedValue(null);
        const vendorId = await emergencyRouting_service_1.emergencyRoutingService.routeEmergencyRequest('request1');
        expect(vendorId).toBeNull();
    });
});
//# sourceMappingURL=emergencyRouting.service.test.js.map