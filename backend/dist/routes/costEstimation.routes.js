"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const costEstimation_controller_1 = require("../controllers/costEstimation.controller");
const router = (0, express_1.Router)();
router.get('/estimate/:workOrderId', costEstimation_controller_1.costEstimationController.getCostEstimation);
exports.default = router;
//# sourceMappingURL=costEstimation.routes.js.map