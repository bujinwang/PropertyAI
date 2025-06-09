"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const vendorPerformanceController_1 = __importDefault(require("../controllers/vendorPerformanceController"));
const router = (0, express_1.Router)();
router.post('/', vendorPerformanceController_1.default.createRating);
router.get('/:id', vendorPerformanceController_1.default.getRating);
router.get('/vendor/:vendorId', vendorPerformanceController_1.default.getRatingsForVendor);
router.get('/work-order/:workOrderId', vendorPerformanceController_1.default.getRatingsForWorkOrder);
router.get('/vendor/:vendorId/average-score', vendorPerformanceController_1.default.getAverageScoreForVendor);
exports.default = router;
//# sourceMappingURL=vendorPerformanceRoutes.js.map