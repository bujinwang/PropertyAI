import * as admin from 'firebase-admin';
import { config } from '../config/config';

class PushNotificationService {
  constructor() {
    // Temporarily comment out Firebase initialization to bypass missing credentials during development.
    // admin.initializeApp({
    //   credential: admin.credential.cert({
    //     projectId: config.google.projectId,
    //     clientEmail: config.google.clientEmail,
    //     privateKey: config.google.privateKey,
    //   }),
    // });
  }

  async sendAndroidNotification(token: string, title: string, body: string) {
    const message = {
      notification: {
        title,
        body,
      },
      token: token,
    };

    await admin.messaging().send(message);
  }

  async sendIOSNotification(token: string, title: string, body: string) {
    const message = {
      notification: {
        title,
        body,
      },
      token: token,
    };

    await admin.messaging().send(message);
  }
}

export const pushNotificationService = new PushNotificationService();
