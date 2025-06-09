"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const photoAnalysis_controller_1 = require("../controllers/photoAnalysis.controller");
const router = (0, express_1.Router)();
router.post('/analyze', photoAnalysis_controller_1.photoAnalysisController.analyzeMaintenancePhoto);
exports.default = router;
//# sourceMappingURL=photoAnalysis.routes.js.map