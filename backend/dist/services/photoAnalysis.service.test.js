"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const photoAnalysis_service_1 = require("./photoAnalysis.service");
const database_1 = require("../config/database");
jest.mock('../config/database', () => ({
    prisma: {
        photoAnalysis: {
            create: jest.fn(),
        },
    },
}));
describe('PhotoAnalysisService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should create a photo analysis', async () => {
        const mockAnalysis = {
            id: '1',
            maintenanceRequestId: 'request1',
            issuesDetected: ['Leaky faucet', 'Water damage'],
            severity: 'High',
            recommendations: 'Replace the faucet and repair the wall.',
        };
        database_1.prisma.photoAnalysis.create.mockResolvedValue(mockAnalysis);
        const analysis = await photoAnalysis_service_1.photoAnalysisService.analyzeMaintenancePhoto('request1', 'photo-url');
        expect(analysis).toEqual(mockAnalysis);
    });
});
//# sourceMappingURL=photoAnalysis.service.test.js.map