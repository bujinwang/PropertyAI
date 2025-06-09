"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.riskAssessmentService = void 0;
const database_1 = require("../config/database");
class RiskAssessmentService {
    async assessRisk(applicationId) {
        const application = await database_1.prisma.application.findUnique({
            where: { id: applicationId },
            include: {
                applicant: true,
                screening: true,
            },
        });
        if (application && application.screening) {
            // This is a placeholder for the actual risk assessment logic.
            // In a real application, this would involve using a machine learning model
            // to assess the risk based on the applicant's screening data.
            const score = Math.random();
            const summary = score > 0.5
                ? 'Low risk'
                : 'High risk';
            const riskAssessment = await database_1.prisma.riskAssessment.create({
                data: {
                    applicationId,
                    score,
                    summary,
                },
            });
            return riskAssessment;
        }
        return null;
    }
}
exports.riskAssessmentService = new RiskAssessmentService();
//# sourceMappingURL=riskAssessment.service.js.map