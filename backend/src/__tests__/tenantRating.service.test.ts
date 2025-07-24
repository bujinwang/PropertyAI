import { PrismaClient } from '@prisma/client';
import { TenantRatingService } from '../services/tenantRating.service';

const prisma = new PrismaClient();

describe('TenantRatingService', () => {
  let service: TenantRatingService;

  beforeEach(() => {
    service = new TenantRatingService();
  });

  afterEach(async () => {
    await prisma.tenantRating.deleteMany();
  });

  describe('createTenantRating', () => {
    it('should create a new tenant rating', async () => {
      const ratingData = {
        leaseId: 'lease1',
        tenantId: 'tenant1',
        raterId: 'rater1',
        rating: 5,
        comment: 'Great tenant!',
      };
      
      const createSpy = jest.spyOn(prisma.tenantRating, 'create').mockResolvedValue({ ...ratingData, id: '1', createdAt: new Date(), updatedAt: new Date() });

      const result = await service.createTenantRating(ratingData);

      expect(result).toHaveProperty('id');
      expect(result.rating).toBe(5);
      createSpy.mockRestore();
    });
  });

  describe('getTenantRatings', () => {
    it('should get all ratings for a tenant', async () => {
      const tenantId = 'tenant1';
      const findManySpy = jest.spyOn(prisma.tenantRating, 'findMany').mockResolvedValue([
        { id: '1', tenantId, rating: 5, leaseId: 'l1', raterId: 'r1', comment: 'c1', createdAt: new Date(), updatedAt: new Date() },
      ]);

      const result = await service.getTenantRatings(tenantId);

      expect(result.length).toBe(1);
      expect(result[0].tenantId).toBe(tenantId);
      findManySpy.mockRestore();
    });
  });
});
