"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const manualReviewController_1 = __importDefault(require("../controllers/manualReviewController"));
const router = (0, express_1.Router)();
router.get('/', manualReviewController_1.default.getApplicationsForReview);
router.put('/:id/approve', manualReviewController_1.default.approveApplication);
router.put('/:id/reject', manualReviewController_1.default.rejectApplication);
exports.default = router;
//# sourceMappingURL=manualReviewRoutes.js.map