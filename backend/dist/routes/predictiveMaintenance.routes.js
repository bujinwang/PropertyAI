"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const predictiveMaintenance_controller_1 = require("../controllers/predictiveMaintenance.controller");
const router = (0, express_1.Router)();
router.get('/prediction/:unitId', predictiveMaintenance_controller_1.predictiveMaintenanceController.getPrediction);
exports.default = router;
//# sourceMappingURL=predictiveMaintenance.routes.js.map