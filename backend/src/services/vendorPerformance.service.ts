import { prisma } from '../config/database';
import { VendorPerformanceRating } from '@prisma/client';

class VendorPerformanceService {
  public async recordVendorPerformance(
    vendorId: string,
    workOrderId: string,
    metricId: string,
    score: number,
    comments: string,
    ratedById: string
  ): Promise<VendorPerformanceRating> {
    const performanceRating = await prisma.vendorPerformanceRating.create({
      data: {
        vendorId,
        workOrderId,
        metricId,
        score,
        comments,
        ratedById,
      },
    });
    return performanceRating;
  }
}

export const vendorPerformanceService = new VendorPerformanceService();
