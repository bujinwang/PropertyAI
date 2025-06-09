"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const reminderService_1 = __importDefault(require("../services/reminderService"));
class ReminderController {
    async sendReminders(req, res) {
        try {
            await reminderService_1.default.sendReminders();
            res.status(200).json({ message: 'Reminders sent successfully' });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.default = new ReminderController();
//# sourceMappingURL=reminderController.js.map