"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const riskAssessment_controller_1 = require("../controllers/riskAssessment.controller");
const router = (0, express_1.Router)();
router.post('/assess/:applicationId', riskAssessment_controller_1.riskAssessmentController.assessRisk);
exports.default = router;
//# sourceMappingURL=riskAssessment.routes.js.map