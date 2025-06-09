"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const riskAssessment_service_1 = require("./riskAssessment.service");
const database_1 = require("../config/database");
jest.mock('../config/database', () => ({
    prisma: {
        application: {
            findUnique: jest.fn(),
        },
        riskAssessment: {
            create: jest.fn(),
        },
    },
}));
describe('RiskAssessmentService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should assess the risk of an applicant', async () => {
        const mockApplication = {
            id: 'application-1',
            screening: {
                creditScore: 700,
                income: 5000,
                employmentStatus: 'employed',
                rentalHistory: 'good',
                criminalHistory: 'none',
            },
        };
        const mockRiskAssessment = {
            id: '1',
            applicationId: 'application-1',
            score: 0.8,
            summary: 'Low risk',
        };
        database_1.prisma.application.findUnique.mockResolvedValue(mockApplication);
        database_1.prisma.riskAssessment.create.mockResolvedValue(mockRiskAssessment);
        const riskAssessment = await riskAssessment_service_1.riskAssessmentService.assessRisk('application-1');
        expect(riskAssessment).toEqual(mockRiskAssessment);
    });
    it('should return null if application does not exist', async () => {
        database_1.prisma.application.findUnique.mockResolvedValue(null);
        const riskAssessment = await riskAssessment_service_1.riskAssessmentService.assessRisk('application-1');
        expect(riskAssessment).toBeNull();
    });
});
//# sourceMappingURL=riskAssessment.service.test.js.map