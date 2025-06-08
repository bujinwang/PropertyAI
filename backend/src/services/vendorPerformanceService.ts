import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class VendorPerformanceService {
  async createRating(data: {
    vendorId: string;
    workOrderId: string;
    metricId: string;
    score: number;
    comments?: string;
    ratedById: string;
  }) {
    return prisma.vendorPerformanceRating.create({ data });
  }

  async getRating(id: string) {
    return prisma.vendorPerformanceRating.findUnique({ where: { id } });
  }

  async getRatingsForVendor(vendorId: string) {
    return prisma.vendorPerformanceRating.findMany({ where: { vendorId } });
  }

  async getRatingsForWorkOrder(workOrderId: string) {
    return prisma.vendorPerformanceRating.findMany({
      where: { workOrderId },
    });
  }

  async getAverageScoreForVendor(vendorId: string) {
    const ratings = await this.getRatingsForVendor(vendorId);
    if (ratings.length === 0) {
      return 0;
    }
    const totalScore = ratings.reduce((acc, rating) => acc + rating.score, 0);
    return totalScore / ratings.length;
  }
}

export default new VendorPerformanceService();
