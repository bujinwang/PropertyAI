"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.photoAnalysisService = void 0;
const database_1 = require("../config/database");
class PhotoAnalysisService {
    async analyzeMaintenancePhoto(maintenanceRequestId, photoUrl) {
        // This is a placeholder for the actual photo analysis logic.
        // In a real application, this would involve using a computer vision service
        // to analyze the photo and identify issues.
        const issuesDetected = ['Leaky faucet', 'Water damage'];
        const severity = 'High';
        const recommendations = 'Replace the faucet and repair the wall.';
        const photoAnalysis = await database_1.prisma.photoAnalysis.create({
            data: {
                maintenanceRequestId,
                issuesDetected,
                severity,
                recommendations,
            },
        });
        return photoAnalysis;
    }
}
exports.photoAnalysisService = new PhotoAnalysisService();
//# sourceMappingURL=photoAnalysis.service.js.map