"use strict";
// This is a placeholder for the push notification service.
// In a real application, this would involve using a service like
// Firebase Cloud Messaging (FCM) or Apple Push Notification Service (APNS)
// to send push notifications to mobile devices.
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushNotification = void 0;
const sendPushNotification = async (to, title, body) => {
    console.log(`Sending push notification to ${to}: ${title} - ${body}`);
    return Promise.resolve();
};
exports.sendPushNotification = sendPushNotification;
//# sourceMappingURL=pushNotificationService.js.map