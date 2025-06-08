import { emergencyRoutingService } from './emergencyRouting.service';
import { prisma } from '../config/database';

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
    (prisma.maintenanceRequest.findUnique as jest.Mock).mockResolvedValue(mockRequest);

    const isEmergency = await emergencyRoutingService.isEmergency('request1');
    expect(isEmergency).toBe(true);
  });

  it('should return false if maintenance request is not an emergency', async () => {
    const mockRequest = { id: 'request1', priority: 'HIGH' };
    (prisma.maintenanceRequest.findUnique as jest.Mock).mockResolvedValue(mockRequest);

    const isEmergency = await emergencyRoutingService.isEmergency('request1');
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
    (prisma.maintenanceRequest.findUnique as jest.Mock).mockResolvedValue(mockRequest);
    (prisma.emergencyRoutingRule.findFirst as jest.Mock).mockResolvedValue(mockRule);

    const vendorId = await emergencyRoutingService.routeEmergencyRequest('request1');
    expect(vendorId).toBe('vendor1');
  });

  it('should return null if no routing rule exists', async () => {
    const mockRequest = {
      id: 'request1',
      priority: 'EMERGENCY',
      categoryId: 'category1',
      category: { id: 'category1' },
    };
    (prisma.maintenanceRequest.findUnique as jest.Mock).mockResolvedValue(mockRequest);
    (prisma.emergencyRoutingRule.findFirst as jest.Mock).mockResolvedValue(null);

    const vendorId = await emergencyRoutingService.routeEmergencyRequest('request1');
    expect(vendorId).toBeNull();
  });
});
