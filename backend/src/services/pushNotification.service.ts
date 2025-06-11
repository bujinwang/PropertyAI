import * as admin from 'firebase-admin';
import * as apn from 'node-apn';
import { config } from '../config/config';

class PushNotificationService {
  private apnProvider: apn.Provider;

  constructor() {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.google.projectId,
        clientEmail: config.google.clientEmail,
        privateKey: config.google.privateKey,
      }),
    });

    this.apnProvider = new apn.Provider({
      token: {
        key: config.apn.key,
        keyId: config.apn.keyId,
        teamId: config.apn.teamId,
      },
      production: process.env.NODE_ENV === 'production',
    });
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
    const notification = new apn.Notification();
    notification.alert = {
      title,
      body,
    };
    notification.topic = config.apn.bundleId;

    await this.apnProvider.send(notification, token);
  }
}

export const pushNotificationService = new PushNotificationService();
