"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emergencyRoutingController = void 0;
const emergencyRouting_service_1 = require("../services/emergencyRouting.service");
class EmergencyRoutingController {
    async routeEmergencyRequest(req, res) {
        try {
            const { maintenanceRequestId } = req.params;
            const vendorId = await emergencyRouting_service_1.emergencyRoutingService.routeEmergencyRequest(maintenanceRequestId);
            if (vendorId) {
                res.status(200).json({ vendorId });
            }
            else {
                res.status(404).json({ message: 'No suitable vendor found for this emergency.' });
            }
        }
        catch (error) {
            res.status(500).json({ message: 'Error routing emergency request.', error });
        }
    }
}
exports.emergencyRoutingController = new EmergencyRoutingController();
//# sourceMappingURL=emergencyRouting.controller.js.map