import { prisma } from '../config/database';

// Shared singleton, not `new PrismaClient()`. A per-module client opened its own
// pool that was never closed, so Jest held the handle open after the suite
// finished (visible as a TCPWRAP under `--detectOpenHandles`).

/**
 * `VendorPerformanceRating` data access.
 *
 * TWO FIXES HERE, both of which were silently 500-ing the write path:
 *
 * 1. `metricId` WAS NOT A COLUMN. The service accepted `metricId` in its
 *    parameter object and passed the whole object straight to
 *    `prisma.vendorPerformanceRating.create({ data })`. Prisma rejects unknown
 *    keys, so EVERY `POST /api/vendor-performance` threw a
 *    `PrismaClientValidationError` -> 500. The field was never in the schema;
 *    it was a leftover from an abandoned "rating metrics" design. It is now
 *    accepted for backwards compatibility and DROPPED before the write.
 *
 * 2. `comments` vs `comment`. The parameter was named `comments` (plural) but
 *    the column is `comment` (singular), so a caller's comment was also an
 *    unknown key -> 500. Mapped explicitly below.
 *
 * Both are the classic mass-assignment-to-Prisma failure: passing a caller-shaped
 * object through instead of naming the columns. `data` is now built field by
 * field so a future schema change fails loudly at `tsc` instead of at runtime.
 */
export class VendorPerformanceService {
  async createRating(data: {
    vendorId: string;
    workOrderId: string;
    /** Accepted for compatibility but NOT persisted — no such column exists. */
    metricId?: string;
    rating: number;
    /** Callers may pass either spelling; mapped to the `comment` column. */
    comments?: string;
    comment?: string;
    ratedById: string;
  }) {
    return prisma.vendorPerformanceRating.create({
      data: {
        vendorId: data.vendorId,
        workOrderId: data.workOrderId,
        rating: data.rating,
        comment: data.comment ?? data.comments ?? null,
        ratedById: data.ratedById,
      },
    });
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

  /**
   * Kept as a method for the service's own API completeness. It is NOT reachable
   * from a route any more: the controller computes the average over the rows the
   * caller is permitted to see, because the unrestricted average would disclose
   * the existence and score of other landlords' ratings.
   */
  async getAverageScoreForVendor(vendorId: string) {
    const ratings = await this.getRatingsForVendor(vendorId);
    if (ratings.length === 0) {
      return 0;
    }
    const totalScore = ratings.reduce((acc, rating) => acc + rating.rating, 0);
    return totalScore / ratings.length;
  }
}

export default new VendorPerformanceService();
