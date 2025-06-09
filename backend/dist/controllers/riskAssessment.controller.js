"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.riskAssessmentController = void 0;
const riskAssessment_service_1 = require("../services/riskAssessment.service");
class RiskAssessmentController {
    async assessRisk(req, res) {
        try {
            const { applicationId } = req.params;
            const riskAssessment = await riskAssessment_service_1.riskAssessmentService.assessRisk(applicationId);
            if (riskAssessment) {
                res.status(201).json(riskAssessment);
            }
            else {
                res.status(404).json({ message: 'Could not assess risk.' });
            }
        }
        catch (error) {
            res.status(500).json({ message: 'Error assessing risk.', error });
        }
    }
}
exports.riskAssessmentController = new RiskAssessmentController();
//# sourceMappingURL=riskAssessment.controller.js.map