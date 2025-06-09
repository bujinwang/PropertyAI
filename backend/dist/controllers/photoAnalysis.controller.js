"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.photoAnalysisController = void 0;
const photoAnalysis_service_1 = require("../services/photoAnalysis.service");
class PhotoAnalysisController {
    async analyzeMaintenancePhoto(req, res) {
        try {
            const { maintenanceRequestId, photoUrl } = req.body;
            const photoAnalysis = await photoAnalysis_service_1.photoAnalysisService.analyzeMaintenancePhoto(maintenanceRequestId, photoUrl);
            res.status(201).json(photoAnalysis);
        }
        catch (error) {
            res.status(500).json({ message: 'Error analyzing maintenance photo.', error });
        }
    }
}
exports.photoAnalysisController = new PhotoAnalysisController();
//# sourceMappingURL=photoAnalysis.controller.js.map