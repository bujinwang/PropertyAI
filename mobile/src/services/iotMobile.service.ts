import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import PushNotification from 'react-native-push-notification';
import NetInfo from '@react-native-community/netinfo';
import BackgroundTimer from 'react-native-background-timer';

interface MobileDeviceInfo {
  deviceId: string;
  platform: 'ios' | 'android';
  osVersion: string;
  appVersion: string;
  pushToken?: string;
  locationPermission: boolean;
  notificationPermission: boolean;
}

interface OfflineSensorData {
  id: string;
  sensorId: string;
  value: number;
  timestamp: Date;
  quality: number;
  synced: boolean;
}

interface PushNotificationData {
  title: string;
  message: string;
  data?: any;
  priority?: 'low' | 'medium' | 'high';
}

class IoTMobileService {
  private deviceInfo: MobileDeviceInfo | null = null;
  private offlineQueue: OfflineSensorData[] = [];
  private isOnline = true;
  private syncTimer: any = null;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Initialize device info
    await this.loadDeviceInfo();

    // Setup network monitoring
    this.setupNetworkMonitoring();

    // Setup push notifications
    this.setupPushNotifications();

    // Setup background sync
    this.setupBackgroundSync();

    // Load offline queue
    await this.loadOfflineQueue();
  }

  // Device Registration and Management
  async registerMobileDevice(propertyId: string): Promise<boolean> {
    try {
      if (!this.deviceInfo) {
        await this.createDeviceInfo();
      }

      const response = await fetch(`${this.getApiBaseUrl()}/mobile/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          ...this.deviceInfo,
          propertyId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to register mobile device');
      }

      const result = await response.json();
      await this.saveDeviceRegistration(result);

      return true;
    } catch (error) {
      console.error('Mobile device registration error:', error);
      return false;
    }
  }

  async updatePushToken(token: string): Promise<void> {
    if (!this.deviceInfo) return;

    this.deviceInfo.pushToken = token;
    await this.saveDeviceInfo();

    // Update server
    try {
      await fetch(`${this.getApiBaseUrl()}/mobile/push-token`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          deviceId: this.deviceInfo.deviceId,
          pushToken: token,
          platform: this.deviceInfo.platform
        })
      });
    } catch (error) {
      console.error('Push token update error:', error);
    }
  }

  // Sensor Data Collection (Mobile Sensors)
  async collectMobileSensorData(sensorType: string): Promise<any> {
    try {
      switch (sensorType) {
        case 'accelerometer':
          return await this.getAccelerometerData();
        case 'gyroscope':
          return await this.getGyroscopeData();
        case 'magnetometer':
          return await this.getMagnetometerData();
        case 'barometer':
          return await this.getBarometerData();
        case 'location':
          return await this.getLocationData();
        case 'battery':
          return await this.getBatteryData();
        default:
          throw new Error(`Unsupported sensor type: ${sensorType}`);
      }
    } catch (error) {
      console.error(`Sensor data collection error for ${sensorType}:`, error);
      return null;
    }
  }

  private async getAccelerometerData(): Promise<any> {
    // Implement accelerometer data collection
    // This would use react-native-sensors or similar
    return {
      x: 0,
      y: 0,
      z: 0,
      timestamp: new Date()
    };
  }

  private async getGyroscopeData(): Promise<any> {
    // Implement gyroscope data collection
    return {
      x: 0,
      y: 0,
      z: 0,
      timestamp: new Date()
    };
  }

  private async getMagnetometerData(): Promise<any> {
    // Implement magnetometer data collection
    return {
      x: 0,
      y: 0,
      z: 0,
      timestamp: new Date()
    };
  }

  private async getBarometerData(): Promise<any> {
    // Implement barometer data collection
    return {
      pressure: 1013.25,
      timestamp: new Date()
    };
  }

  private async getLocationData(): Promise<any> {
    // Implement location data collection
    return {
      latitude: 0,
      longitude: 0,
      altitude: 0,
      accuracy: 0,
      timestamp: new Date()
    };
  }

  private async getBatteryData(): Promise<any> {
    // Implement battery data collection
    return {
      level: 0.8,
      isCharging: false,
      temperature: 25,
      timestamp: new Date()
    };
  }

  // Offline Data Management
  async queueSensorData(sensorId: string, value: number, quality: number = 100): Promise<void> {
    const data: OfflineSensorData = {
      id: `offline_${Date.now()}_${Math.random()}`,
      sensorId,
      value,
      timestamp: new Date(),
      quality,
      synced: false
    };

    this.offlineQueue.push(data);
    await this.saveOfflineQueue();

    // Try to sync immediately if online
    if (this.isOnline) {
      await this.syncOfflineData();
    }
  }

  async syncOfflineData(): Promise<void> {
    if (!this.isOnline || this.offlineQueue.length === 0) return;

    const unsyncedData = this.offlineQueue.filter(item => !item.synced);

    if (unsyncedData.length === 0) return;

    try {
      const response = await fetch(`${this.getApiBaseUrl()}/iot/sensors/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          deviceId: this.deviceInfo?.deviceId,
          sensorReadings: unsyncedData.map(item => ({
            sensorId: item.sensorId,
            value: item.value,
            timestamp: item.timestamp,
            quality: item.quality
          }))
        })
      });

      if (response.ok) {
        // Mark as synced
        unsyncedData.forEach(item => {
          item.synced = true;
        });
        await this.saveOfflineQueue();

        // Clean up old synced data (keep last 100)
        if (this.offlineQueue.length > 100) {
          this.offlineQueue = this.offlineQueue.slice(-100);
          await this.saveOfflineQueue();
        }

        console.log(`Synced ${unsyncedData.length} offline sensor readings`);
      }
    } catch (error) {
      console.error('Offline data sync error:', error);
    }
  }

  // Push Notifications
  private setupPushNotifications(): void {
    PushNotification.configure({
      onRegister: (token) => {
        console.log('Push token:', token);
        this.updatePushToken(token.token);
      },

      onNotification: (notification) => {
        console.log('Notification received:', notification);
        this.handlePushNotification(notification);
      },

      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },

      popInitialNotification: true,
      requestPermissions: true,
    });

    // Create notification channel for Android
    if (Platform.OS === 'android') {
      PushNotification.createChannel(
        {
          channelId: 'iot-alerts',
          channelName: 'IoT Alerts',
          channelDescription: 'Notifications for IoT device alerts',
          soundName: 'default',
          importance: 4,
          vibrate: true,
        },
        (created) => console.log(`Notification channel created: ${created}`)
      );
    }
  }

  private handlePushNotification(notification: any): void {
    const { data, title, message } = notification;

    // Handle different types of notifications
    switch (data?.type) {
      case 'ALERT':
        this.showAlertNotification(title, message, data);
        break;
      case 'DEVICE_STATUS':
        this.showDeviceStatusNotification(title, message, data);
        break;
      case 'MAINTENANCE':
        this.showMaintenanceNotification(title, message, data);
        break;
      default:
        this.showDefaultNotification(title, message, data);
    }
  }

  private showAlertNotification(title: string, message: string, data: any): void {
    PushNotification.localNotification({
      channelId: 'iot-alerts',
      title: `🚨 ${title}`,
      message,
      data,
      priority: 'high',
      soundName: 'default',
      vibrate: true,
      vibration: 1000,
    });
  }

  private showDeviceStatusNotification(title: string, message: string, data: any): void {
    PushNotification.localNotification({
      channelId: 'iot-alerts',
      title: `📱 ${title}`,
      message,
      data,
      priority: 'default',
    });
  }

  private showMaintenanceNotification(title: string, message: string, data: any): void {
    PushNotification.localNotification({
      channelId: 'iot-alerts',
      title: `🔧 ${title}`,
      message,
      data,
      priority: 'default',
    });
  }

  private showDefaultNotification(title: string, message: string, data: any): void {
    PushNotification.localNotification({
      title,
      message,
      data,
    });
  }

  // Network Monitoring
  private setupNetworkMonitoring(): void {
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;

      if (!wasOnline && this.isOnline) {
        // Came back online, sync data
        this.syncOfflineData();
      }

      console.log('Network status changed:', this.isOnline);
    });
  }

  // Background Sync
  private setupBackgroundSync(): void {
    // Sync every 5 minutes when app is in background
    BackgroundTimer.runBackgroundTimer(() => {
      if (this.isOnline) {
        this.syncOfflineData();
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  // Device Info Management
  private async createDeviceInfo(): Promise<void> {
    const deviceId = `mobile_${Platform.OS}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.deviceInfo = {
      deviceId,
      platform: Platform.OS as 'ios' | 'android',
      osVersion: Platform.Version.toString(),
      appVersion: '1.0.0', // Get from package.json or native code
      locationPermission: false,
      notificationPermission: false
    };

    await this.saveDeviceInfo();
  }

  private async saveDeviceInfo(): Promise<void> {
    if (!this.deviceInfo) return;
    await AsyncStorage.setItem('mobileDeviceInfo', JSON.stringify(this.deviceInfo));
  }

  private async loadDeviceInfo(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('mobileDeviceInfo');
      if (stored) {
        this.deviceInfo = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading device info:', error);
    }
  }

  private async saveDeviceRegistration(registration: any): Promise<void> {
    await AsyncStorage.setItem('deviceRegistration', JSON.stringify(registration));
  }

  // Offline Queue Management
  private async saveOfflineQueue(): Promise<void> {
    await AsyncStorage.setItem('offlineSensorData', JSON.stringify(this.offlineQueue));
  }

  private async loadOfflineQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('offlineSensorData');
      if (stored) {
        this.offlineQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading offline queue:', error);
    }
  }

  // Utility Methods
  private getApiBaseUrl(): string {
    return 'http://localhost:3001/api'; // Replace with actual API URL
  }

  private async getAuthToken(): Promise<string> {
    // Get auth token from storage or auth service
    return await AsyncStorage.getItem('authToken') || '';
  }

  // Public API
  getDeviceInfo(): MobileDeviceInfo | null {
    return this.deviceInfo;
  }

  getOfflineQueueLength(): number {
    return this.offlineQueue.filter(item => !item.synced).length;
  }

  isDeviceOnline(): boolean {
    return this.isOnline;
  }

  async requestPermissions(): Promise<void> {
    // Request location and notification permissions
    // Implementation depends on specific permission libraries
    console.log('Requesting permissions...');
  }

  async cleanup(): Promise<void> {
    if (this.syncTimer) {
      BackgroundTimer.stopBackgroundTimer();
    }
  }
}

export const iotMobileService = new IoTMobileService();