import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { realtimeService } from './realtimeService';
import { measurePerformance } from '../utils/performanceMonitor';

interface PushNotificationData {
  title: string;
  body: string;
  data?: any;
  sound?: boolean;
  priority?: 'default' | 'high' | 'low';
  ttl?: number;
}

interface NotificationHistory {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  data?: any;
  read: boolean;
}

class PushNotificationService {
  private notificationHistory: NotificationHistory[] = [];
  private isInitialized = false;
  private deviceToken: string | null = null;
  private notificationListeners = new Set<(notification: any) => void>();

  constructor() {
    this.initializeNotifications();
    this.loadNotificationHistory();
  }

  private async initializeNotifications(): Promise<void> {
    return measurePerformance('push-notification-init', async () => {
      try {
        // Request permissions
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          console.warn('Push notification permissions not granted');
          return;
        }

        // Configure notification handler
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          }),
        });

        // Get device token
        if (Device.isDevice) {
          const token = await Notifications.getExpoPushTokenAsync();
          this.deviceToken = token.data;
          console.log('📱 Push notification token:', this.deviceToken);

          // Register token with backend
          await this.registerDeviceToken();
        }

        // Set up notification listeners
        this.setupNotificationListeners();

        this.isInitialized = true;
        console.log('🔔 Push notifications initialized successfully');

      } catch (error) {
        console.error('Failed to initialize push notifications:', error);
      }
    });
  }

  private setupNotificationListeners(): void {
    // Handle notification received while app is foregrounded
    const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('📬 Notification received in foreground:', notification);
      this.handleNotificationReceived(notification, 'foreground');
    });

    // Handle notification tapped
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response);
      this.handleNotificationTapped(response);
    });

    // Store subscriptions for cleanup
    this.notificationSubscriptions = { receivedSubscription, responseSubscription };
  }

  private async handleNotificationReceived(
    notification: Notifications.Notification,
    context: 'foreground' | 'background'
  ): Promise<void> {
    const notificationData = {
      id: notification.request.identifier,
      title: notification.request.content.title || '',
      body: notification.request.content.body || '',
      data: notification.request.content.data,
      timestamp: Date.now(),
      context,
      read: false,
    };

    // Add to history
    await this.addToNotificationHistory(notificationData);

    // Notify listeners
    this.notifyListeners(notificationData);

    // Handle real-time integration
    if (notification.request.content.data?.realtimeEvent) {
      realtimeService.emit('notification:received', notificationData);
    }

    // Handle specific notification types
    await this.handleNotificationType(notificationData);
  }

  private async handleNotificationTapped(response: Notifications.NotificationResponse): Promise<void> {
    const notification = response.notification;
    const data = notification.request.content.data;

    // Mark as read
    await this.markNotificationAsRead(notification.request.identifier);

    // Handle deep linking
    if (data?.deepLink) {
      this.handleDeepLink(data.deepLink);
    }

    // Handle action buttons
    if (response.actionIdentifier) {
      this.handleNotificationAction(response.actionIdentifier, data);
    }

    // Emit real-time event
    realtimeService.emit('notification:tapped', {
      id: notification.request.identifier,
      data,
      timestamp: Date.now(),
    });
  }

  private async handleNotificationType(notification: any): Promise<void> {
    const { data } = notification;

    switch (data?.type) {
      case 'property_alert':
        await this.handlePropertyAlert(notification);
        break;
      case 'maintenance_update':
        await this.handleMaintenanceUpdate(notification);
        break;
      case 'payment_reminder':
        await this.handlePaymentReminder(notification);
        break;
      case 'market_update':
        await this.handleMarketUpdate(notification);
        break;
      case 'system_alert':
        await this.handleSystemAlert(notification);
        break;
      default:
        console.log('Unknown notification type:', data?.type);
    }
  }

  private async handlePropertyAlert(notification: any): Promise<void> {
    // Update local property data
    const propertyId = notification.data?.propertyId;
    if (propertyId) {
      realtimeService.emit(`property:${propertyId}:alert`, notification);
    }
  }

  private async handleMaintenanceUpdate(notification: any): Promise<void> {
    // Update maintenance status
    realtimeService.emit('maintenance:update', notification);
  }

  private async handlePaymentReminder(notification: any): Promise<void> {
    // Update payment status
    realtimeService.emit('payment:reminder', notification);
  }

  private async handleMarketUpdate(notification: any): Promise<void> {
    // Update market data
    realtimeService.emit('market-data:update', notification);
  }

  private async handleSystemAlert(notification: any): Promise<void> {
    // Handle system-wide alerts
    realtimeService.emit('system:alert', notification);
  }

  private handleDeepLink(deepLink: string): void {
    // Handle deep linking to specific app sections
    console.log('🔗 Handling deep link:', deepLink);

    // Example: navigate to specific screen
    if (deepLink.startsWith('property/')) {
      const propertyId = deepLink.split('/')[1];
      // Navigation logic would go here
      console.log('Navigate to property:', propertyId);
    }
  }

  private handleNotificationAction(actionId: string, data: any): void {
    console.log('🎯 Handling notification action:', actionId, data);

    switch (actionId) {
      case 'view':
        // Handle view action
        break;
      case 'dismiss':
        // Handle dismiss action
        break;
      case 'snooze':
        // Handle snooze action
        break;
      default:
        console.log('Unknown action:', actionId);
    }
  }

  // Public API Methods
  async sendLocalNotification(notificationData: PushNotificationData): Promise<string | null> {
    if (!this.isInitialized) {
      console.warn('Push notifications not initialized');
      return null;
    }

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationData.title,
          body: notificationData.body,
          data: notificationData.data,
          sound: notificationData.sound !== false,
          priority: notificationData.priority || 'default',
        },
        trigger: null, // Send immediately
      });

      console.log('📤 Local notification sent:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Failed to send local notification:', error);
      return null;
    }
  }

  async scheduleNotification(
    notificationData: PushNotificationData,
    trigger: Notifications.NotificationTriggerInput
  ): Promise<string | null> {
    if (!this.isInitialized) {
      console.warn('Push notifications not initialized');
      return null;
    }

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationData.title,
          body: notificationData.body,
          data: notificationData.data,
          sound: notificationData.sound !== false,
          priority: notificationData.priority || 'default',
        },
        trigger,
      });

      console.log('⏰ Notification scheduled:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      return null;
    }
  }

  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('❌ Notification cancelled:', notificationId);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('❌ All notifications cancelled');
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }

  // Notification History Management
  private async addToNotificationHistory(notification: NotificationHistory): Promise<void> {
    this.notificationHistory.unshift(notification);

    // Keep only last 100 notifications
    if (this.notificationHistory.length > 100) {
      this.notificationHistory = this.notificationHistory.slice(0, 100);
    }

    await this.saveNotificationHistory();
  }

  private async markNotificationAsRead(notificationId: string): Promise<void> {
    const notification = this.notificationHistory.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      await this.saveNotificationHistory();
    }
  }

  private async saveNotificationHistory(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        'notification_history',
        JSON.stringify(this.notificationHistory)
      );
    } catch (error) {
      console.warn('Failed to save notification history:', error);
    }
  }

  private async loadNotificationHistory(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('notification_history');
      if (stored) {
        this.notificationHistory = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load notification history:', error);
    }
  }

  // Device Token Management
  private async registerDeviceToken(): Promise<void> {
    if (!this.deviceToken) return;

    try {
      // Register token with backend
      await fetch('/api/notifications/register-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: this.deviceToken,
          platform: Platform.OS,
          deviceId: Device.deviceName || 'unknown',
        }),
      });

      console.log('✅ Device token registered with backend');
    } catch (error) {
      console.warn('Failed to register device token:', error);
    }
  }

  // Listener Management
  public addNotificationListener(callback: (notification: any) => void): () => void {
    this.notificationListeners.add(callback);
    return () => this.notificationListeners.delete(callback);
  }

  private notifyListeners(notification: any): void {
    this.notificationListeners.forEach(listener => {
      try {
        listener(notification);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  // Public Getters
  public getNotificationHistory(): NotificationHistory[] {
    return [...this.notificationHistory];
  }

  public getUnreadCount(): number {
    return this.notificationHistory.filter(n => !n.read).length;
  }

  public getDeviceToken(): string | null {
    return this.deviceToken;
  }

  public isReady(): boolean {
    return this.isInitialized;
  }

  // Cleanup
  public async cleanup(): Promise<void> {
    try {
      await this.cancelAllNotifications();
      this.notificationHistory = [];
      await AsyncStorage.removeItem('notification_history');

      if (this.notificationSubscriptions) {
        this.notificationSubscriptions.receivedSubscription.remove();
        this.notificationSubscriptions.responseSubscription.remove();
      }

      console.log('🧹 Push notification service cleaned up');
    } catch (error) {
      console.error('Failed to cleanup push notifications:', error);
    }
  }
}

// Singleton instance
export const pushNotificationService = new PushNotificationService();

// React hooks for easy integration
export const usePushNotifications = () => {
  const [notifications, setNotifications] = React.useState(pushNotificationService.getNotificationHistory());
  const [unreadCount, setUnreadCount] = React.useState(pushNotificationService.getUnreadCount());

  React.useEffect(() => {
    const unsubscribe = pushNotificationService.addNotificationListener(() => {
      setNotifications(pushNotificationService.getNotificationHistory());
      setUnreadCount(pushNotificationService.getUnreadCount());
    });

    return unsubscribe;
  }, []);

  return {
    notifications,
    unreadCount,
    sendNotification: pushNotificationService.sendLocalNotification.bind(pushNotificationService),
    scheduleNotification: pushNotificationService.scheduleNotification.bind(pushNotificationService),
    cancelNotification: pushNotificationService.cancelNotification.bind(pushNotificationService),
  };
};

export const useNotificationPermissions = () => {
  const [permissions, setPermissions] = React.useState<Notifications.NotificationPermissionsStatus | null>(null);

  React.useEffect(() => {
    const checkPermissions = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissions({ status });
    };

    checkPermissions();
  }, []);

  const requestPermissions = async () => {
    const result = await Notifications.requestPermissionsAsync();
    setPermissions(result);
    return result;
  };

  return {
    permissions,
    requestPermissions,
    hasPermission: permissions?.status === 'granted',
  };
};

// Utility functions
export const notificationUtils = {
  formatNotificationTime: (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  },

  createNotificationActions: (actions: Array<{ identifier: string; title: string; options?: any }>) => {
    return actions.map(action => ({
      identifier: action.identifier,
      buttonTitle: action.title,
      options: action.options || {},
    }));
  },

  groupNotificationsByDate: (notifications: NotificationHistory[]) => {
    const groups: { [key: string]: NotificationHistory[] } = {};

    notifications.forEach(notification => {
      const date = new Date(notification.timestamp).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(notification);
    });

    return groups;
  },

  filterNotifications: (
    notifications: NotificationHistory[],
    filter: 'all' | 'unread' | 'read' = 'all'
  ) => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.read);
      case 'read':
        return notifications.filter(n => n.read);
      default:
        return notifications;
    }
  },
};

export default pushNotificationService;
