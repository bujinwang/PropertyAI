"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const maintenanceRequestCategorization_service_1 = require("./maintenanceRequestCategorization.service");
const database_1 = require("../config/database");
jest.mock('../config/database', () => ({
    prisma: {
        maintenanceRequest: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        maintenanceRequestCategory: {
            findMany: jest.fn(),
        },
    },
}));
describe('MaintenanceRequestCategorizationService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should categorize a maintenance request', async () => {
        const mockRequest = { id: 'request1' };
        const mockCategories = [{ id: 'category1' }, { id: 'category2' }];
        database_1.prisma.maintenanceRequest.findUnique.mockResolvedValue(mockRequest);
        database_1.prisma.maintenanceRequestCategory.findMany.mockResolvedValue(mockCategories);
        database_1.prisma.maintenanceRequest.update.mockResolvedValue({ ...mockRequest, categoryId: 'category1' });
        const category = await maintenanceRequestCategorization_service_1.maintenanceRequestCategorizationService.categorizeRequest('request1');
        expect(category).toBeDefined();
        expect(category).toBeDefined();
        if (category) {
            expect(mockCategories.map((c) => c.id)).toContain(category.id);
        }
    });
    it('should return null if maintenance request does not exist', async () => {
        database_1.prisma.maintenanceRequest.findUnique.mockResolvedValue(null);
        const category = await maintenanceRequestCategorization_service_1.maintenanceRequestCategorizationService.categorizeRequest('request1');
        expect(category).toBeNull();
    });
    it('should return null if no categories exist', async () => {
        const mockRequest = { id: 'request1' };
        database_1.prisma.maintenanceRequest.findUnique.mockResolvedValue(mockRequest);
        database_1.prisma.maintenanceRequestCategory.findMany.mockResolvedValue([]);
        const category = await maintenanceRequestCategorization_service_1.maintenanceRequestCategorizationService.categorizeRequest('request1');
        expect(category).toBeNull();
    });
});
//# sourceMappingURL=maintenanceRequestCategorization.service.test.js.map