"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = void 0;
const emailService_1 = require("./emailService");
const smsService_1 = require("./smsService");
const pushNotificationService_1 = require("./pushNotificationService");
const sendNotification = async (channel, to, subject, message) => {
    switch (channel) {
        case 'email':
            await (0, emailService_1.sendEmail)(to, subject, message);
            break;
        case 'sms':
            await (0, smsService_1.sendSms)(to, message);
            break;
        case 'push':
            await (0, pushNotificationService_1.sendPushNotification)(to, subject, message);
            break;
        default:
            throw new Error(`Invalid notification channel: ${channel}`);
    }
};
exports.sendNotification = sendNotification;
//# sourceMappingURL=notificationService.js.map