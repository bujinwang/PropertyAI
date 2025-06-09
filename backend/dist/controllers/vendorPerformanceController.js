"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vendorPerformanceService_1 = __importDefault(require("../services/vendorPerformanceService"));
class VendorPerformanceController {
    async createRating(req, res) {
        try {
            const rating = await vendorPerformanceService_1.default.createRating(req.body);
            res.status(201).json(rating);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getRating(req, res) {
        try {
            const rating = await vendorPerformanceService_1.default.getRating(req.params.id);
            if (rating) {
                res.status(200).json(rating);
            }
            else {
                res.status(404).json({ message: 'Rating not found' });
            }
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getRatingsForVendor(req, res) {
        try {
            const ratings = await vendorPerformanceService_1.default.getRatingsForVendor(req.params.vendorId);
            res.status(200).json(ratings);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getRatingsForWorkOrder(req, res) {
        try {
            const ratings = await vendorPerformanceService_1.default.getRatingsForWorkOrder(req.params.workOrderId);
            res.status(200).json(ratings);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getAverageScoreForVendor(req, res) {
        try {
            const averageScore = await vendorPerformanceService_1.default.getAverageScoreForVendor(req.params.vendorId);
            res.status(200).json({ averageScore });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.default = new VendorPerformanceController();
//# sourceMappingURL=vendorPerformanceController.js.map