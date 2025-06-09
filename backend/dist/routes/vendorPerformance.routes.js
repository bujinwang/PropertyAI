"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const vendorPerformance_controller_1 = require("../controllers/vendorPerformance.controller");
const router = (0, express_1.Router)();
router.post('/record', vendorPerformance_controller_1.vendorPerformanceController.recordVendorPerformance);
exports.default = router;
//# sourceMappingURL=vendorPerformance.routes.js.map