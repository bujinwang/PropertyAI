"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const aiRouting_controller_1 = require("../controllers/aiRouting.controller");
const router = (0, express_1.Router)();
router.get('/find-best-vendor/:workOrderId', aiRouting_controller_1.aiRoutingController.findBestVendor);
exports.default = router;
//# sourceMappingURL=aiRouting.routes.js.map