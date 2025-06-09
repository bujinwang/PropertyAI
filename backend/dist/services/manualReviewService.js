"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Application_1 = require("../models/mongo/Application");
class ManualReviewService {
    async getApplicationsForReview() {
        return Application_1.Application.find({ status: 'Requires Manual Review' });
    }
    async approveApplication(applicationId) {
        return Application_1.Application.findByIdAndUpdate(applicationId, { status: 'Verified' }, { new: true });
    }
    async rejectApplication(applicationId) {
        return Application_1.Application.findByIdAndUpdate(applicationId, { status: 'Rejected' }, { new: true });
    }
}
exports.default = new ManualReviewService();
//# sourceMappingURL=manualReviewService.js.map