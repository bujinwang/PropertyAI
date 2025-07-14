import { aiRoutingService } from './aiRouting.service';
import { prisma } from '../config/database';

jest.mock('../config/database', () => ({
  prisma: {
    vendor: {
      findMany: jest.fn(),
    },
  },
}));

describe('AIRoutingService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return a vendor ID if vendors exist', async () => {
    const mockVendors = [{ id: 'vendor1' }, { id: 'vendor2' }];
    (prisma.vendor.findMany as jest.Mock).mockResolvedValue(mockVendors);

    const vendorId = await aiRoutingService.findBestVendor('work-order-1');
    expect(vendorId).toBeDefined();
    expect(mockVendors.map((v) => v.id)).toContain(vendorId);
  });

  it('should return null if no vendors exist', async () => {
    (prisma.vendor.findMany as jest.Mock).mockResolvedValue([]);

    const vendorId = await aiRoutingService.findBestVendor('work-order-1');
    expect(vendorId).toBeNull();
  });
});
