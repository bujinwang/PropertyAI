import { sendEmail } from './emailService';
import { sendSms } from './smsService';
import { sendPushNotification } from './pushNotificationService';

export const sendNotification = async (channel: 'email' | 'sms' | 'push', to: string, subject: string, message: string) => {
  switch (channel) {
    case 'email':
      await sendEmail(to, subject, message);
      break;
    case 'sms':
      await sendSms(to, message);
      break;
    case 'push':
      await sendPushNotification(to, subject, message);
      break;
    default:
      throw new Error(`Invalid notification channel: ${channel}`);
  }
};
