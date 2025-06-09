"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vendorPerformanceService = void 0;
const database_1 = require("../config/database");
class VendorPerformanceService {
    async recordVendorPerformance(vendorId, workOrderId, metricId, score, comments, ratedById) {
        const performanceRating = await database_1.prisma.vendorPerformanceRating.create({
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
exports.vendorPerformanceService = new VendorPerformanceService();
//# sourceMappingURL=vendorPerformance.service.js.map