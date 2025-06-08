import { predictiveMaintenanceService } from './predictiveMaintenance.service';
import { prisma } from '../config/database';

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
    (prisma.maintenanceRequest.findMany as jest.Mock).mockResolvedValue(mockHistory);

    const prediction = await predictiveMaintenanceService.predictMaintenance('unit1');
    expect(prediction).toBeDefined();
    expect(prediction.unitId).toBe('unit1');
    expect(prediction.confidence).toBe(0.75);
  });

  it('should return null if no maintenance history exists', async () => {
    (prisma.maintenanceRequest.findMany as jest.Mock).mockResolvedValue([]);

    const prediction = await predictiveMaintenanceService.predictMaintenance('unit1');
    expect(prediction).toBeNull();
  });
});
