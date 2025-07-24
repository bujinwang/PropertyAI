import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class TenantRatingService {
  async createTenantRating(data: {
    leaseId: string;
    tenantId: string;
    raterId: string;
    rating: number;
    comment?: string;
  }) {
    return prisma.tenantRating.create({
      data,
    });
  }

  async getTenantRatings(tenantId: string) {
    return prisma.tenantRating.findMany({
      where: {
        tenantId,
      },
      include: {
        rater: true,
      },
    });
  }
}
