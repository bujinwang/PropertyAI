import { maintenanceResponseTimeService } from './maintenanceResponseTime.service';
import { prisma } from '../config/database';

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
    (prisma.maintenanceRequest.findUnique as jest.Mock).mockResolvedValue(mockRequest);
    (prisma.maintenanceResponseTime.create as jest.Mock).mockResolvedValue(mockResponseTime);

    const responseTime = await maintenanceResponseTimeService.trackResponseTime('request1');
    expect(responseTime).toEqual(mockResponseTime);
  });

  it('should optimize response time', async () => {
    const mockRequest = { id: 'request1', description: 'fire', priority: 'LOW' };
    (prisma.maintenanceRequest.findUnique as jest.Mock).mockResolvedValue(mockRequest);

    await maintenanceResponseTimeService.optimizeResponseTime('request1');
    expect(prisma.maintenanceRequest.update).toHaveBeenCalledWith({
      where: { id: 'request1' },
      data: { priority: 'EMERGENCY' },
    });
  });
});
