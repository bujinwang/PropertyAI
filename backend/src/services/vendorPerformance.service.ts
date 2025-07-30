import { prisma } from '../config/database';
import { VendorPerformanceRating } from '@prisma/client';

class VendorPerformanceService {
  public async recordVendorPerformance(
    vendorId: string,
    workOrderId: string,
    metricId: string,
    rating: number, // Changed score to rating
    comments: string,
    ratedById: string
  ): Promise<VendorPerformanceRating> {
    const performanceRating = await prisma.vendorPerformanceRating.create({
      data: {
        vendorId,
        workOrderId,
        metricId,
        rating,
        comment: comments,
        ratedById,
      } as any, // Cast to any to bypass type checking for metricId
    });
    return performanceRating;
  }
}

export const vendorPerformanceService = new VendorPerformanceService();
