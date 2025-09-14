import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

class NotificationService {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Set notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted');
        return;
      }

      // Configure for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });

        await Notifications.setNotificationChannelAsync('maintenance', {
          name: 'Maintenance',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });

        await Notifications.setNotificationChannelAsync('payments', {
          name: 'Payments',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      this.isInitialized = true;
      console.log('Notification service initialized');
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  }

  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: any,
    delay?: number
  ): Promise<string> {
    try {
      const trigger = delay ? { seconds: delay, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL } : null;

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: 'default',
        },
        trigger: trigger as any,
      });

      return notificationId;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      throw error;
    }
  }

  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }

  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to get scheduled notifications:', error);
      return [];
    }
  }

  // Maintenance-specific notifications
  async notifyMaintenanceRequest(title: string, description: string, requestId: string): Promise<void> {
    await this.scheduleLocalNotification(
      'New Maintenance Request',
      `${title}: ${description}`,
      { type: 'maintenance', requestId },
      1 // Show immediately
    );
  }

  async notifyMaintenanceUpdate(requestId: string, status: string, title: string): Promise<void> {
    await this.scheduleLocalNotification(
      'Maintenance Update',
      `${title} status changed to ${status}`,
      { type: 'maintenance_update', requestId },
      1
    );
  }

  // Payment-specific notifications
  async notifyPaymentReceived(amount: number, description: string): Promise<void> {
    await this.scheduleLocalNotification(
      'Payment Received',
      `$${amount.toFixed(2)} - ${description}`,
      { type: 'payment_received', amount },
      1
    );
  }

  async notifyPaymentDue(amount: number, dueDate: string, propertyName: string): Promise<void> {
    const delay = Math.max(0, new Date(dueDate).getTime() - Date.now() - 86400000); // 1 day before
    const delaySeconds = Math.floor(delay / 1000);

    if (delaySeconds > 0) {
      await this.scheduleLocalNotification(
        'Payment Due Soon',
        `$${amount.toFixed(2)} due for ${propertyName}`,
        { type: 'payment_due', amount, dueDate, propertyName },
        delaySeconds
      );
    }
  }

  // Property-specific notifications
  async notifyPropertyUpdate(propertyName: string, update: string): Promise<void> {
    await this.scheduleLocalNotification(
      'Property Update',
      `${propertyName}: ${update}`,
      { type: 'property_update', propertyName },
      1
    );
  }

  // General notifications
  async notifySystemMessage(title: string, message: string): Promise<void> {
    await this.scheduleLocalNotification(
      title,
      message,
      { type: 'system' },
      1
    );
  }

  // Firebase token management (for push notifications from server)
  async getDeviceToken(): Promise<string | null> {
    try {
      // This would integrate with Firebase Cloud Messaging
      // For now, return a mock token
      const token = await Notifications.getDevicePushTokenAsync();
      return token.data;
    } catch (error) {
      console.error('Failed to get device token:', error);
      return null;
    }
  }

  async registerForPushNotifications(): Promise<void> {
    try {
      const token = await this.getDeviceToken();
      if (token) {
        // Send token to server for push notifications
        console.log('Device token:', token);
        // TODO: Send token to backend API
      }
    } catch (error) {
      console.error('Failed to register for push notifications:', error);
    }
  }

  // Badge management
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Failed to set badge count:', error);
    }
  }

  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Failed to get badge count:', error);
      return 0;
    }
  }

  // Notification listener setup
  setupNotificationListeners(): void {
    // Handle notification received while app is foregrounded
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      // Handle foreground notification
    });

    // Handle notification response (when user taps notification)
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      // Handle notification tap
      const data = response.notification.request.content.data;
      this.handleNotificationResponse(data);
    });

    // Cleanup function
    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }

  private handleNotificationResponse(data: any): void {
    // Handle different types of notifications
    switch (data.type) {
      case 'maintenance':
        // Navigate to maintenance details
        console.log('Navigate to maintenance:', data.requestId);
        break;
      case 'maintenance_update':
        // Navigate to maintenance details
        console.log('Navigate to maintenance update:', data.requestId);
        break;
      case 'payment_received':
        // Navigate to payments
        console.log('Navigate to payments');
        break;
      case 'payment_due':
        // Navigate to payments
        console.log('Navigate to payments due');
        break;
      case 'property_update':
        // Navigate to property details
        console.log('Navigate to property:', data.propertyName);
        break;
      default:
        console.log('Unknown notification type:', data.type);
    }
  }
}

export const notificationService = new NotificationService();