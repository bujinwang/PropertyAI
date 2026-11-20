import { prisma } from '../config/database';
import { VendorPerformanceRating } from '@prisma/client';

class VendorPerformanceService {
  /**
   * Record how a vendor performed on one work order.
   *
   * `metricId` is accepted and IGNORED. `VendorPerformanceRating` has no
   * `metricId` column -- the previous code passed it behind
   * `as any, // Cast to any to bypass type checking for metricId`, so every
   * call threw `PrismaClientValidationError: Unknown argument 'metricId'`.
   * The parameter is kept (not removed) so the public signature and its
   * callers stay source-compatible; the body simply does not forward it.
   *
   * Recorded as a deliberate gap rather than silently dropping the concept:
   * if per-metric ratings are actually required, that needs a schema change
   * (a real `metricId` column with its own relation), which is a product
   * decision -- not something to fake by writing to a column that isn't there.
   */
  public async recordVendorPerformance(
    vendorId: string,
    workOrderId: string,
    _metricId: string,
    rating: number,
    comments: string,
    ratedById: string
  ): Promise<VendorPerformanceRating> {
    const performanceRating = await prisma.vendorPerformanceRating.create({
      data: {
        vendorId,
        workOrderId,
        rating,
        comment: comments,
        ratedById,
      },
    });
    return performanceRating;
  }
}

export const vendorPerformanceService = new VendorPerformanceService();
