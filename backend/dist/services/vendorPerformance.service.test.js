"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vendorPerformance_service_1 = require("./vendorPerformance.service");
const database_1 = require("../config/database");
jest.mock('../config/database', () => ({
    prisma: {
        vendorPerformanceRating: {
            create: jest.fn(),
        },
    },
}));
describe('VendorPerformanceService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should create a vendor performance rating', async () => {
        const mockRating = {
            id: '1',
            vendorId: 'vendor1',
            workOrderId: 'work-order-1',
            metricId: 'metric1',
            score: 5,
            comments: 'Great job!',
            ratedById: 'user1',
        };
        database_1.prisma.vendorPerformanceRating.create.mockResolvedValue(mockRating);
        const rating = await vendorPerformance_service_1.vendorPerformanceService.recordVendorPerformance('vendor1', 'work-order-1', 'metric1', 5, 'Great job!', 'user1');
        expect(rating).toEqual(mockRating);
    });
});
//# sourceMappingURL=vendorPerformance.service.test.js.map