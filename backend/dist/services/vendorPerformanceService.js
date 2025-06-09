"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class VendorPerformanceService {
    async createRating(data) {
        return prisma.vendorPerformanceRating.create({ data });
    }
    async getRating(id) {
        return prisma.vendorPerformanceRating.findUnique({ where: { id } });
    }
    async getRatingsForVendor(vendorId) {
        return prisma.vendorPerformanceRating.findMany({ where: { vendorId } });
    }
    async getRatingsForWorkOrder(workOrderId) {
        return prisma.vendorPerformanceRating.findMany({
            where: { workOrderId },
        });
    }
    async getAverageScoreForVendor(vendorId) {
        const ratings = await this.getRatingsForVendor(vendorId);
        if (ratings.length === 0) {
            return 0;
        }
        const totalScore = ratings.reduce((acc, rating) => acc + rating.score, 0);
        return totalScore / ratings.length;
    }
}
exports.default = new VendorPerformanceService();
//# sourceMappingURL=vendorPerformanceService.js.map