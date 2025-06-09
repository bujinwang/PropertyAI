"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const emergencyRouting_controller_1 = require("../controllers/emergencyRouting.controller");
const router = (0, express_1.Router)();
router.post('/route/:maintenanceRequestId', emergencyRouting_controller_1.emergencyRoutingController.routeEmergencyRequest);
exports.default = router;
//# sourceMappingURL=emergencyRouting.routes.js.map