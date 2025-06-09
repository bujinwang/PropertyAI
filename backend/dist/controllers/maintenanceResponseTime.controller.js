"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maintenanceResponseTimeController = void 0;
const maintenanceResponseTime_service_1 = require("../services/maintenanceResponseTime.service");
class MaintenanceResponseTimeController {
    async trackResponseTime(req, res) {
        try {
            const { maintenanceRequestId } = req.params;
            const responseTime = await maintenanceResponseTime_service_1.maintenanceResponseTimeService.trackResponseTime(maintenanceRequestId);
            if (responseTime) {
                res.status(201).json(responseTime);
            }
            else {
                res.status(404).json({ message: 'Could not track response time.' });
            }
        }
        catch (error) {
            res.status(500).json({ message: 'Error tracking response time.', error });
        }
    }
}
exports.maintenanceResponseTimeController = new MaintenanceResponseTimeController();
//# sourceMappingURL=maintenanceResponseTime.controller.js.map