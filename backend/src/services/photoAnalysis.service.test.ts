import { photoAnalysisService } from './photoAnalysis.service';
import { prisma } from '../config/database';

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
    (prisma.photoAnalysis.create as jest.Mock).mockResolvedValue(mockAnalysis);

    const analysis = await photoAnalysisService.analyzeMaintenancePhoto(
      'request1',
      'photo-url'
    );

    expect(analysis).toEqual(mockAnalysis);
  });
});
