"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aiRouting_service_1 = require("./aiRouting.service");
const database_1 = require("../config/database");
jest.mock('../config/database', () => ({
    prisma: {
        vendor: {
            findMany: jest.fn(),
        },
    },
}));
describe('AIRoutingService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should return a vendor ID if vendors exist', async () => {
        const mockVendors = [{ id: 'vendor1' }, { id: 'vendor2' }];
        database_1.prisma.vendor.findMany.mockResolvedValue(mockVendors);
        const vendorId = await aiRouting_service_1.aiRoutingService.findBestVendor('work-order-1');
        expect(vendorId).toBeDefined();
        expect(mockVendors.map((v) => v.id)).toContain(vendorId);
    });
    it('should return null if no vendors exist', async () => {
        database_1.prisma.vendor.findMany.mockResolvedValue([]);
        const vendorId = await aiRouting_service_1.aiRoutingService.findBestVendor('work-order-1');
        expect(vendorId).toBeNull();
    });
});
//# sourceMappingURL=aiRouting.service.test.js.map