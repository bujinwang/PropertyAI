"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const notificationService_1 = require("../services/notificationService");
class NotificationController {
    async createNotification(req, res) {
        try {
            await (0, notificationService_1.sendNotification)(req.body.channel, req.body.to, req.body.subject, req.body.message);
            const notification = {}; // Placeholder
            res.status(201).json(notification);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getNotifications(req, res) {
        try {
            const notifications = {}; // Placeholder
            res.status(200).json(notifications);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async markAsRead(req, res) {
        try {
            const notification = {}; // Placeholder
            res.status(200).json(notification);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.default = new NotificationController();
//# sourceMappingURL=notificationController.js.map