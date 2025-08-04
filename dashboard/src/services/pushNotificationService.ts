import { 
  PushNotificationConfig, 
  NotificationDelivery, 
  EmergencyAlert 
} from '../types/emergency-response';

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: {
    alertId: string;
    type: EmergencyAlert['type'];
    priority: EmergencyAlert['priority'];
    url?: string;
    timestamp: string;
  };
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  tag?: string;
}

export interface NotificationPermissionStatus {
  permission: NotificationPermission;
  supported: boolean;
  serviceWorkerRegistered: boolean;
  subscriptionActive: boolean;
}

class PushNotificationService {
  private baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  private vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;

  constructor() {
    this.initializeServiceWorker();
  }

  private async initializeServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/service-worker.js');
        console.log('Push Notification Service: Service Worker registered');
        
        // Listen for service worker messages
        navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));
      } catch (error) {
        console.error('Push Notification Service: Service Worker registration failed', error);
      }
    }
  }

  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { type, data } = event.data;
    
    switch (type) {
      case 'notification-clicked':
        this.handleNotificationClick(data);
        break;
      case 'notification-closed':
        this.handleNotificationClose(data);
        break;
      default:
        console.log('Push Notification Service: Unknown message type', type);
    }
  }

  private handleNotificationClick(data: any): void {
    // Handle notification click actions
    if (data.action === 'view-alert' && data.alertId) {
      // Navigate to alert details
      window.location.href = `/emergency-response/alerts/${data.alertId}`;
    } else if (data.action === 'acknowledge' && data.alertId) {
      // Acknowledge alert
      this.acknowledgeAlert(data.alertId);
    }
  }

  private handleNotificationClose(data: any): void {
    // Track notification dismissal
    this.trackNotificationEvent('dismissed', data.alertId);
  }

  private async acknowledgeAlert(alertId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/emergency-response/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to acknowledge alert');
      }

      this.trackNotificationEvent('acknowledged', alertId);
    } catch (error) {
      console.error('Push Notification Service: Failed to acknowledge alert', error);
    }
  }

  private async trackNotificationEvent(event: string, alertId?: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/api/emergency-response/notifications/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          event,
          alertId,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Push Notification Service: Failed to track notification event', error);
    }
  }

  // Permission management
  async getPermissionStatus(): Promise<NotificationPermissionStatus> {
    const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    
    if (!supported) {
      return {
        permission: 'denied',
        supported: false,
        serviceWorkerRegistered: false,
        subscriptionActive: false,
      };
    }

    const permission = Notification.permission;
    const serviceWorkerRegistered = this.registration !== null;
    const subscriptionActive = this.subscription !== null && !this.subscription.expirationTime;

    return {
      permission,
      supported,
      serviceWorkerRegistered,
      subscriptionActive,
    };
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      await this.subscribeToPushNotifications();
    }

    return permission;
  }

  private async subscribeToPushNotifications(): Promise<void> {
    if (!this.registration) {
      throw new Error('Service Worker not registered');
    }

    try {
      // Check for existing subscription
      this.subscription = await this.registration.pushManager.getSubscription();

      if (!this.subscription) {
        // Create new subscription
        const applicationServerKey = this.urlBase64ToUint8Array(this.vapidPublicKey);
        
        this.subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });
      }

      // Send subscription to server
      await this.sendSubscriptionToServer(this.subscription);
      
      console.log('Push Notification Service: Subscribed to push notifications');
    } catch (error) {
      console.error('Push Notification Service: Failed to subscribe to push notifications', error);
      throw error;
    }
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/emergency-response/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send subscription to server');
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Notification configuration
  async getNotificationConfig(userId: string): Promise<PushNotificationConfig> {
    const response = await fetch(`${this.baseUrl}/api/emergency-response/notifications/config/${userId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch notification config');
    }

    return response.json();
  }

  async updateNotificationConfig(config: PushNotificationConfig): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/emergency-response/notifications/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error('Failed to update notification config');
    }
  }

  // Test notifications
  async sendTestNotification(): Promise<void> {
    const testPayload: PushNotificationPayload = {
      title: 'PropertyFlow AI - Test Notification',
      body: 'This is a test notification to verify your settings are working correctly.',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: {
        alertId: 'test',
        type: 'other',
        priority: 'low',
        timestamp: new Date().toISOString(),
      },
      actions: [
        {
          action: 'dismiss',
          title: 'Dismiss',
        },
      ],
      tag: 'test-notification',
    };

    const response = await fetch(`${this.baseUrl}/api/emergency-response/notifications/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(testPayload),
    });

    if (!response.ok) {
      throw new Error('Failed to send test notification');
    }
  }

  // Notification delivery tracking
  async getNotificationDeliveries(alertId?: string): Promise<NotificationDelivery[]> {
    const params = new URLSearchParams();
    if (alertId) params.append('alertId', alertId);

    const response = await fetch(`${this.baseUrl}/api/emergency-response/notifications/deliveries?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch notification deliveries');
    }

    const deliveries = await response.json();
    return deliveries.map((delivery: any) => ({
      ...delivery,
      timestamp: new Date(delivery.timestamp),
    }));
  }

  // Unsubscribe from notifications
  async unsubscribe(): Promise<void> {
    if (this.subscription) {
      await this.subscription.unsubscribe();
      this.subscription = null;

      // Notify server
      await fetch(`${this.baseUrl}/api/emergency-response/notifications/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      console.log('Push Notification Service: Unsubscribed from push notifications');
    }
  }

  // Utility methods
  createNotificationPayload(alert: EmergencyAlert): PushNotificationPayload {
    const priorityEmojis = {
      low: '🔵',
      medium: '🟡',
      high: '🟠',
      critical: '🔴',
    };

    const typeEmojis = {
      fire: '🔥',
      medical: '🚑',
      security: '🚨',
      maintenance: '🔧',
      weather: '🌪️',
      other: '⚠️',
    };

    const emoji = typeEmojis[alert.type] || '⚠️';
    const priorityEmoji = priorityEmojis[alert.priority] || '🔵';

    return {
      title: `${emoji} ${priorityEmoji} Emergency Alert`,
      body: `${alert.title} at ${alert.location.propertyName}${alert.location.unitNumber ? ` - Unit ${alert.location.unitNumber}` : ''}`,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: {
        alertId: alert.id,
        type: alert.type,
        priority: alert.priority,
        url: `/emergency-response/alerts/${alert.id}`,
        timestamp: alert.timestamp.toISOString(),
      },
      actions: [
        {
          action: 'view-alert',
          title: 'View Alert',
        },
        {
          action: 'acknowledge',
          title: 'Acknowledge',
        },
      ],
      requireInteraction: alert.priority === 'critical',
      vibrate: alert.priority === 'critical' ? [200, 100, 200, 100, 200] : [100, 50, 100],
      tag: `alert-${alert.id}`,
    };
  }

  shouldSendNotification(alert: EmergencyAlert, config: PushNotificationConfig): boolean {
    if (!config.enabled) {
      return false;
    }

    // Check alert type filter
    if (config.alertTypes.length > 0 && !config.alertTypes.includes(alert.type)) {
      return false;
    }

    // Check priority filter
    if (config.priorities.length > 0 && !config.priorities.includes(alert.priority)) {
      return false;
    }

    // Check property filter
    if (config.properties.length > 0 && !config.properties.includes(alert.location.propertyId)) {
      return false;
    }

    // Check quiet hours
    if (config.quietHours) {
      const now = new Date();
      const currentTime = now.toLocaleTimeString('en-US', { 
        hour12: false, 
        timeZone: config.quietHours.timezone 
      }).substring(0, 5);
      
      const startTime = config.quietHours.start;
      const endTime = config.quietHours.end;

      // Handle quiet hours that span midnight
      if (startTime > endTime) {
        if (currentTime >= startTime || currentTime <= endTime) {
          // Only send critical alerts during quiet hours
          return alert.priority === 'critical';
        }
      } else {
        if (currentTime >= startTime && currentTime <= endTime) {
          // Only send critical alerts during quiet hours
          return alert.priority === 'critical';
        }
      }
    }

    return true;
  }
}

export const pushNotificationService = new PushNotificationService();