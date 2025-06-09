"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vendorPerformanceController = void 0;
const vendorPerformance_service_1 = require("../services/vendorPerformance.service");
class VendorPerformanceController {
    async recordVendorPerformance(req, res) {
        try {
            const { vendorId, workOrderId, metricId, score, comments, ratedById } = req.body;
            const performanceRating = await vendorPerformance_service_1.vendorPerformanceService.recordVendorPerformance(vendorId, workOrderId, metricId, score, comments, ratedById);
            res.status(201).json(performanceRating);
        }
        catch (error) {
            res.status(500).json({ message: 'Error recording vendor performance.', error });
        }
    }
}
exports.vendorPerformanceController = new VendorPerformanceController();
//# sourceMappingURL=vendorPerformance.controller.js.map