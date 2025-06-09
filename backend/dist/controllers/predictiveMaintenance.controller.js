"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.predictiveMaintenanceController = void 0;
const predictiveMaintenance_service_1 = require("../services/predictiveMaintenance.service");
class PredictiveMaintenanceController {
    async getPrediction(req, res) {
        try {
            const { unitId } = req.params;
            const prediction = await predictiveMaintenance_service_1.predictiveMaintenanceService.predictMaintenance(unitId);
            if (prediction) {
                res.status(200).json(prediction);
            }
            else {
                res.status(404).json({ message: 'No prediction available for this unit.' });
            }
        }
        catch (error) {
            res.status(500).json({ message: 'Error getting prediction.', error });
        }
    }
}
exports.predictiveMaintenanceController = new PredictiveMaintenanceController();
//# sourceMappingURL=predictiveMaintenance.controller.js.map