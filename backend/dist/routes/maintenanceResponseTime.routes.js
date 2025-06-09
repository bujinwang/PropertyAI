"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const maintenanceResponseTime_controller_1 = require("../controllers/maintenanceResponseTime.controller");
const router = (0, express_1.Router)();
router.post('/track/:maintenanceRequestId', maintenanceResponseTime_controller_1.maintenanceResponseTimeController.trackResponseTime);
exports.default = router;
//# sourceMappingURL=maintenanceResponseTime.routes.js.map