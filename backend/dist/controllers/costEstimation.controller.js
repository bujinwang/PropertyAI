"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.costEstimationController = void 0;
const costEstimation_service_1 = require("../services/costEstimation.service");
class CostEstimationController {
    async getCostEstimation(req, res) {
        try {
            const { workOrderId } = req.params;
            const estimation = await costEstimation_service_1.costEstimationService.estimateCost(workOrderId);
            if (estimation) {
                res.status(200).json(estimation);
            }
            else {
                res.status(404).json({ message: 'No estimation available for this work order.' });
            }
        }
        catch (error) {
            res.status(500).json({ message: 'Error getting cost estimation.', error });
        }
    }
}
exports.costEstimationController = new CostEstimationController();
//# sourceMappingURL=costEstimation.controller.js.map