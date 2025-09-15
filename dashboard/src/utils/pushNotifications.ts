/**
 * Push Notification Service
 * Handles push notification subscriptions and delivery
 * Epic 21.5.2 - Mobile Experience Enhancement
 */

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  url?: string;
  type: 'maintenance' | 'payment' | 'emergency' | 'general' | 'property';
  priority: 'high' | 'normal' | 'low';
  data?: any;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface PushSubscriptionInfo {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class PushNotificationService {
  private vapidPublicKey: string;
  private subscription: PushSubscription | null = null;
  private permissionGranted = false;

  constructor(vapidPublicKey?: string) {
    this.vapidPublicKey = vapidPublicKey || (import.meta as any).env.VITE_VAPID_PUBLIC_KEY || '';
    this.initialize();
  }

  private async initialize() {
    // Check if push notifications are supported
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('[Push] Push notifications not supported');
      return;
    }

    // Check current permission status
    this.permissionGranted = Notification.permission === 'granted';

    // Listen for permission changes
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'notifications' }).then((permission) => {
        this.permissionGranted = permission.state === 'granted';
        permission.addEventListener('change', () => {
          this.permissionGranted = permission.state === 'granted';
          console.log('[Push] Permission changed:', permission.state);
        });
      });
    }
  }

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('[Push] Notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        console.log('[Push] Notification permission granted');
        this.permissionGranted = true;
        return true;
      } else {
        console.log('[Push] Notification permission denied');
        this.permissionGranted = false;
        return false;
      }
    } catch (error) {
      console.error('[Push] Error requesting permission:', error);
      return false;
    }
  }

  // Subscribe to push notifications
  async subscribe(): Promise<PushSubscriptionInfo | null> {
    if (!this.permissionGranted) {
      console.warn('[Push] Cannot subscribe: permission not granted');
      return null;
    }

    if (!('serviceWorker' in navigator)) {
      console.warn('[Push] Service worker not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey) as any
      });

      this.subscription = subscription;
      console.log('[Push] Successfully subscribed to push notifications');

      const subscriptionInfo: PushSubscriptionInfo = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
        }
      };

      // Store subscription on server
      await this.storeSubscription(subscriptionInfo);

      return subscriptionInfo;
    } catch (error) {
      console.error('[Push] Error subscribing to push notifications:', error);
      return null;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe(): Promise<boolean> {
    if (!this.subscription) {
      console.log('[Push] No active subscription to unsubscribe');
      return true;
    }

    try {
      const result = await this.subscription.unsubscribe();
      if (result) {
        console.log('[Push] Successfully unsubscribed from push notifications');
        this.subscription = null;
        await this.removeSubscription();
      }
      return result;
    } catch (error) {
      console.error('[Push] Error unsubscribing:', error);
      return false;
    }
  }

  // Get current subscription status
  async getSubscriptionStatus(): Promise<{
    isSubscribed: boolean;
    permission: NotificationPermission;
    subscription: PushSubscriptionInfo | null;
  }> {
    const permission = Notification.permission;
    const isSubscribed = !!this.subscription;

    let subscriptionInfo: PushSubscriptionInfo | null = null;
    if (this.subscription) {
      subscriptionInfo = {
        endpoint: this.subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(this.subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(this.subscription.getKey('auth')!)
        }
      };
    }

    return {
      isSubscribed,
      permission,
      subscription: subscriptionInfo
    };
  }

  // Send test notification (for development)
  async sendTestNotification(): Promise<boolean> {
    if (!this.subscription) {
      console.warn('[Push] No subscription available for test notification');
      return false;
    }

    const testPayload: PushNotificationPayload = {
      title: 'PropertyAI Test Notification',
      body: 'This is a test push notification to verify your setup is working correctly.',
      type: 'general',
      priority: 'normal',
      icon: '/logo192.png',
      badge: '/logo192.png'
    };

    return this.sendNotification(testPayload);
  }

  // Send notification (typically called from server)
  async sendNotification(payload: PushNotificationPayload): Promise<boolean> {
    if (!this.subscription) {
      console.warn('[Push] No subscription available');
      return false;
    }

    try {
      // In a real implementation, this would send to your push service (FCM, etc.)
      // For now, we'll simulate by showing a local notification
      await this.showLocalNotification(payload);
      return true;
    } catch (error) {
      console.error('[Push] Error sending notification:', error);
      return false;
    }
  }

  // Show local notification (fallback for development)
  private async showLocalNotification(payload: PushNotificationPayload): Promise<void> {
    if (!this.permissionGranted) {
      console.warn('[Push] Cannot show notification: permission not granted');
      return;
    }

    const options: NotificationOptions = {
      body: payload.body,
      icon: payload.icon || '/logo192.png',
      data: {
        url: payload.url,
        type: payload.type,
        ...payload.data
      },
      tag: `propertyai-${payload.type}`,
      requireInteraction: payload.priority === 'high',
      silent: payload.priority === 'low'
    };

    // Add badge if supported (fallback to icon)
    if ('badge' in options) {
      (options as any).badge = payload.badge || '/logo192.png';
    }

    // Add image if supported
    if ('image' in options && payload.image) {
      (options as any).image = payload.image;
    }

    // Add actions if supported
    if ('actions' in options && payload.actions && payload.actions.length > 0) {
      (options as any).actions = payload.actions;
    }

    try {
      const notification = new Notification(payload.title, options);

      // Auto-close after 5 seconds for non-high priority
      if (payload.priority !== 'high') {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }

      // Handle notification click
      notification.onclick = () => {
        if (payload.url) {
          window.focus();
          window.location.href = payload.url;
        }
        notification.close();
      };

      // Handle notification close
      notification.onclose = () => {
        console.log('[Push] Notification closed by user');
      };

    } catch (error) {
      console.error('[Push] Error showing local notification:', error);
    }
  }

  // Store subscription on server
  private async storeSubscription(subscription: PushSubscriptionInfo): Promise<void> {
    try {
      // In a real implementation, send to your backend
      console.log('[Push] Storing subscription:', subscription.endpoint);

      // Simulate API call
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });

      if (!response.ok) {
        throw new Error('Failed to store subscription');
      }
    } catch (error) {
      console.error('[Push] Error storing subscription:', error);
      // Don't throw - subscription storage failure shouldn't break the flow
    }
  }

  // Remove subscription from server
  private async removeSubscription(): Promise<void> {
    try {
      console.log('[Push] Removing subscription from server');

      // Simulate API call
      await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('[Push] Error removing subscription:', error);
    }
  }

  // Utility: Convert VAPID key
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

  // Utility: Convert ArrayBuffer to base64
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  // Check if notifications are supported
  isSupported(): boolean {
    return 'Notification' in window &&
           'serviceWorker' in navigator &&
           'PushManager' in window;
  }

  // Get notification support status
  getSupportStatus(): {
    notifications: boolean;
    serviceWorker: boolean;
    pushManager: boolean;
    permission: NotificationPermission;
  } {
    return {
      notifications: 'Notification' in window,
      serviceWorker: 'serviceWorker' in navigator,
      pushManager: 'PushManager' in window,
      permission: Notification.permission
    };
  }
}

// Global instance
const pushNotificationService = new PushNotificationService();

export default pushNotificationService;
export { PushNotificationService };