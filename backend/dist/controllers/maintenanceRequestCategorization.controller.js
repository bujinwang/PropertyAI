"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maintenanceRequestCategorizationController = void 0;
const maintenanceRequestCategorization_service_1 = require("../services/maintenanceRequestCategorization.service");
class MaintenanceRequestCategorizationController {
    async categorizeRequest(req, res) {
        try {
            const { maintenanceRequestId } = req.params;
            const category = await maintenanceRequestCategorization_service_1.maintenanceRequestCategorizationService.categorizeRequest(maintenanceRequestId);
            if (category) {
                res.status(200).json(category);
            }
            else {
                res.status(404).json({ message: 'Could not categorize request.' });
            }
        }
        catch (error) {
            res.status(500).json({ message: 'Error categorizing request.', error });
        }
    }
}
exports.maintenanceRequestCategorizationController = new MaintenanceRequestCategorizationController();
//# sourceMappingURL=maintenanceRequestCategorization.controller.js.map