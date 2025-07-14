import { maintenanceRequestCategorizationService } from './maintenanceRequestCategorization.service';
import { prisma } from '../config/database';

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
    (prisma.maintenanceRequest.findUnique as jest.Mock).mockResolvedValue(mockRequest);
    (prisma.maintenanceRequestCategory.findMany as jest.Mock).mockResolvedValue(mockCategories);
    (prisma.maintenanceRequest.update as jest.Mock).mockResolvedValue({ ...mockRequest, categoryId: 'category1' });

    const category = await maintenanceRequestCategorizationService.categorizeRequest('request1');
    expect(category).toBeDefined();
    expect(category).toBeDefined();
    if (category) {
      expect(mockCategories.map((c) => c.id)).toContain(category.id);
    }
  });

  it('should return null if maintenance request does not exist', async () => {
    (prisma.maintenanceRequest.findUnique as jest.Mock).mockResolvedValue(null);

    const category = await maintenanceRequestCategorizationService.categorizeRequest('request1');
    expect(category).toBeNull();
  });

  it('should return null if no categories exist', async () => {
    const mockRequest = { id: 'request1' };
    (prisma.maintenanceRequest.findUnique as jest.Mock).mockResolvedValue(mockRequest);
    (prisma.maintenanceRequestCategory.findMany as jest.Mock).mockResolvedValue([]);

    const category = await maintenanceRequestCategorizationService.categorizeRequest('request1');
    expect(category).toBeNull();
  });
});
