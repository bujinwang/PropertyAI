"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const manualReviewService_1 = __importDefault(require("../services/manualReviewService"));
class ManualReviewController {
    async getApplicationsForReview(req, res) {
        try {
            const applications = await manualReviewService_1.default.getApplicationsForReview();
            res.status(200).json(applications);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async approveApplication(req, res) {
        try {
            const application = await manualReviewService_1.default.approveApplication(req.params.id);
            res.status(200).json(application);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async rejectApplication(req, res) {
        try {
            const application = await manualReviewService_1.default.rejectApplication(req.params.id);
            res.status(200).json(application);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.default = new ManualReviewController();
//# sourceMappingURL=manualReviewController.js.map