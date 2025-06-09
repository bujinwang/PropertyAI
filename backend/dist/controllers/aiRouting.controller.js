"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiRoutingController = void 0;
const aiRouting_service_1 = require("../services/aiRouting.service");
class AIRoutingController {
    async findBestVendor(req, res) {
        try {
            const { workOrderId } = req.params;
            const vendorId = await aiRouting_service_1.aiRoutingService.findBestVendor(workOrderId);
            if (vendorId) {
                res.status(200).json({ vendorId });
            }
            else {
                res.status(404).json({ message: 'No suitable vendor found.' });
            }
        }
        catch (error) {
            res.status(500).json({ message: 'Error finding best vendor.', error });
        }
    }
}
exports.aiRoutingController = new AIRoutingController();
//# sourceMappingURL=aiRouting.controller.js.map