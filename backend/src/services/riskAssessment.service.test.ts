import { riskAssessmentService } from './riskAssessment.service';
import { prisma } from '../config/database';

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
    (prisma.application.findUnique as jest.Mock).mockResolvedValue(mockApplication);
    (prisma.riskAssessment.create as jest.Mock).mockResolvedValue(mockRiskAssessment);

    const riskAssessment = await riskAssessmentService.assessRisk('application-1');
    expect(riskAssessment).toEqual(mockRiskAssessment);
  });

  it('should return null if application does not exist', async () => {
    (prisma.application.findUnique as jest.Mock).mockResolvedValue(null);

    const riskAssessment = await riskAssessmentService.assessRisk('application-1');
    expect(riskAssessment).toBeNull();
  });
});
