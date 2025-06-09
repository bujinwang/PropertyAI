"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schedulingController = void 0;
const scheduling_service_1 = require("../services/scheduling.service");
class SchedulingController {
    async scheduleEvent(req, res) {
        try {
            const { workOrderId } = req.params;
            const scheduledEvent = await scheduling_service_1.schedulingService.scheduleEvent(workOrderId);
            if (scheduledEvent) {
                res.status(201).json(scheduledEvent);
            }
            else {
                res.status(404).json({ message: 'Could not schedule event.' });
            }
        }
        catch (error) {
            res.status(500).json({ message: 'Error scheduling event.', error });
        }
    }
}
exports.schedulingController = new SchedulingController();
//# sourceMappingURL=scheduling.controller.js.map