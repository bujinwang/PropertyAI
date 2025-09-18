import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import { measurePerformance } from '../utils/performanceMonitor';

interface RealtimeConfig {
  url: string;
  authToken?: string;
  userId?: string;
  autoReconnect: boolean;
  reconnectAttempts: number;
  reconnectDelay: number;
}

interface RealtimeEvent {
  type: string;
  data: any;
  timestamp: number;
  source: 'websocket' | 'push' | 'background';
}

interface Subscription {
  event: string;
  callback: (data: any) => void;
  id: string;
}

class RealtimeService {
  private socket: Socket | null = null;
  private config: RealtimeConfig;
  private subscriptions = new Map<string, Subscription[]>();
  private eventQueue: RealtimeEvent[] = [];
  private isConnected = false;
  private reconnectAttempts = 0;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private connectionListeners = new Set<(connected: boolean) => void>();

  constructor(config: Partial<RealtimeConfig> = {}) {
    this.config = {
      url: __DEV__
        ? 'ws://localhost:3001'
        : 'wss://api.propertyai.com',
      autoReconnect: true,
      reconnectAttempts: 5,
      reconnectDelay: 1000,
      ...config,
    };

    this.initializeNetworkMonitoring();
    this.loadStoredEvents();
  }

  // Connection Management
  async connect(authToken?: string): Promise<boolean> {
    return measurePerformance('websocket-connect', async () => {
      try {
        if (authToken) {
          this.config.authToken = authToken;
        }

        // Check network connectivity
        const netInfo = await NetInfo.fetch();
        if (!netInfo.isConnected) {
          console.warn('No network connection available');
          return false;
        }

        this.socket = io(this.config.url, {
          auth: {
            token: this.config.authToken,
            userId: this.config.userId,
          },
          transports: ['websocket', 'polling'],
          timeout: 10000,
          forceNew: true,
        });

        return new Promise((resolve) => {
          const timeout = setTimeout(() => {
            console.error('WebSocket connection timeout');
            resolve(false);
          }, 10000);

          this.socket?.on('connect', () => {
            clearTimeout(timeout);
            this.isConnected = true;
            this.reconnectAttempts = 0;
            console.log('🟢 WebSocket connected');

            this.startHeartbeat();
            this.processQueuedEvents();
            this.notifyConnectionListeners(true);

            resolve(true);
          });

          this.socket?.on('connect_error', (error) => {
            clearTimeout(timeout);
            console.error('WebSocket connection error:', error);
            this.handleConnectionError();
            resolve(false);
          });

          this.socket?.on('disconnect', (reason) => {
            console.log('🔴 WebSocket disconnected:', reason);
            this.isConnected = false;
            this.stopHeartbeat();
            this.notifyConnectionListeners(false);

            if (this.config.autoReconnect && reason !== 'io client disconnect') {
              this.scheduleReconnect();
            }
          });
        });

      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        return false;
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.stopHeartbeat();
    this.notifyConnectionListeners(false);
  }

  // Event Subscription Management
  subscribe(event: string, callback: (data: any) => void): string {
    const subscriptionId = `${event}_${Date.now()}_${Math.random()}`;

    if (!this.subscriptions.has(event)) {
      this.subscriptions.set(event, []);
    }

    const subscription: Subscription = {
      event,
      callback,
      id: subscriptionId,
    };

    this.subscriptions.get(event)!.push(subscription);

    // Set up WebSocket listener if connected
    if (this.isConnected && this.socket) {
      this.socket.on(event, (data) => {
        this.handleRealtimeEvent(event, data, 'websocket');
      });
    }

    return subscriptionId;
  }

  unsubscribe(subscriptionId: string): boolean {
    for (const [event, subs] of this.subscriptions.entries()) {
      const index = subs.findIndex(sub => sub.id === subscriptionId);
      if (index !== -1) {
        subs.splice(index, 1);

        // Remove WebSocket listener if no more subscriptions
        if (subs.length === 0 && this.socket) {
          this.socket.off(event);
          this.subscriptions.delete(event);
        }

        return true;
      }
    }
    return false;
  }

  unsubscribeAll(event?: string): void {
    if (event) {
      const subs = this.subscriptions.get(event);
      if (subs && this.socket) {
        this.socket.off(event);
      }
      this.subscriptions.delete(event);
    } else {
      // Unsubscribe from all events
      for (const [eventName] of this.subscriptions.entries()) {
        if (this.socket) {
          this.socket.off(eventName);
        }
      }
      this.subscriptions.clear();
    }
  }

  // Event Emission
  emit(event: string, data: any): boolean {
    if (!this.isConnected || !this.socket) {
      // Queue event for later
      this.queueEvent({
        type: event,
        data,
        timestamp: Date.now(),
        source: 'websocket',
      });
      return false;
    }

    try {
      this.socket.emit(event, data);
      return true;
    } catch (error) {
      console.error('Failed to emit event:', error);
      this.queueEvent({
        type: event,
        data,
        timestamp: Date.now(),
        source: 'websocket',
      });
      return false;
    }
  }

  // Real-time Property Updates
  subscribeToPropertyUpdates(propertyId: string, callback: (data: any) => void): string {
    return this.subscribe(`property:${propertyId}:update`, callback);
  }

  subscribeToPropertyAlerts(propertyId: string, callback: (data: any) => void): string {
    return this.subscribe(`property:${propertyId}:alert`, callback);
  }

  subscribeToMaintenanceUpdates(callback: (data: any) => void): string {
    return this.subscribe('maintenance:update', callback);
  }

  subscribeToPaymentUpdates(callback: (data: any) => void): string {
    return this.subscribe('payment:update', callback);
  }

  // Real-time Analytics
  subscribeToAnalyticsUpdates(callback: (data: any) => void): string {
    return this.subscribe('analytics:update', callback);
  }

  subscribeToMarketDataUpdates(callback: (data: any) => void): string {
    return this.subscribe('market-data:update', callback);
  }

  // Real-time Notifications
  subscribeToNotifications(callback: (data: any) => void): string {
    return this.subscribe('notification:new', callback);
  }

  subscribeToSystemAlerts(callback: (data: any) => void): string {
    return this.subscribe('system:alert', callback);
  }

  // Private Methods
  private initializeNetworkMonitoring(): void {
    NetInfo.addEventListener((state) => {
      if (state.isConnected && !this.isConnected && this.config.autoReconnect) {
        console.log('Network restored, attempting to reconnect...');
        this.connect();
      } else if (!state.isConnected && this.isConnected) {
        console.log('Network lost, disconnecting...');
        this.disconnect();
      }
    });
  }

  private handleConnectionError(): void {
    this.isConnected = false;
    if (this.config.autoReconnect) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.reconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.isConnected) {
        this.socket.emit('heartbeat', { timestamp: Date.now() });
      }
    }, 30000); // Every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private handleRealtimeEvent(event: string, data: any, source: 'websocket' | 'push' | 'background'): void {
    const subscriptions = this.subscriptions.get(event);
    if (subscriptions) {
      subscriptions.forEach(sub => {
        try {
          sub.callback(data);
        } catch (error) {
          console.error(`Error in ${event} subscription callback:`, error);
        }
      });
    }

    // Store event for offline processing if needed
    this.storeEvent({
      type: event,
      data,
      timestamp: Date.now(),
      source,
    });
  }

  private queueEvent(event: RealtimeEvent): void {
    this.eventQueue.push(event);

    // Limit queue size to prevent memory issues
    if (this.eventQueue.length > 100) {
      this.eventQueue = this.eventQueue.slice(-50);
    }
  }

  private processQueuedEvents(): void {
    if (!this.isConnected || !this.socket) return;

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      if (event) {
        this.socket.emit(event.type, event.data);
      }
    }
  }

  private async storeEvent(event: RealtimeEvent): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('realtime_events') || '[]';
      const events: RealtimeEvent[] = JSON.parse(stored);

      events.push(event);

      // Keep only last 100 events
      if (events.length > 100) {
        events.splice(0, events.length - 100);
      }

      await AsyncStorage.setItem('realtime_events', JSON.stringify(events));
    } catch (error) {
      console.warn('Failed to store realtime event:', error);
    }
  }

  private async loadStoredEvents(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('realtime_events');
      if (stored) {
        this.eventQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load stored events:', error);
    }
  }

  private notifyConnectionListeners(connected: boolean): void {
    this.connectionListeners.forEach(listener => {
      try {
        listener(connected);
      } catch (error) {
        console.error('Error in connection listener:', error);
      }
    });
  }

  // Public API
  public onConnectionChange(callback: (connected: boolean) => void): () => void {
    this.connectionListeners.add(callback);
    return () => this.connectionListeners.delete(callback);
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public getQueuedEventsCount(): number {
    return this.eventQueue.length;
  }

  public clearEventQueue(): void {
    this.eventQueue = [];
  }

  public updateAuthToken(token: string): void {
    this.config.authToken = token;
    if (this.socket) {
      this.socket.auth = { token, userId: this.config.userId };
    }
  }

  public updateUserId(userId: string): void {
    this.config.userId = userId;
    if (this.socket) {
      this.socket.auth = { token: this.config.authToken, userId };
    }
  }
}

// Singleton instance
export const realtimeService = new RealtimeService();

// React hooks for easy integration
export const useRealtimeConnection = () => {
  const [isConnected, setIsConnected] = React.useState(realtimeService.getConnectionStatus());

  React.useEffect(() => {
    const unsubscribe = realtimeService.onConnectionChange(setIsConnected);
    return unsubscribe;
  }, []);

  return isConnected;
};

export const useRealtimeSubscription = (
  event: string,
  callback: (data: any) => void,
  deps: React.DependencyList = []
) => {
  React.useEffect(() => {
    const subscriptionId = realtimeService.subscribe(event, callback);
    return () => {
      realtimeService.unsubscribe(subscriptionId);
    };
  }, deps);
};

// Utility functions
export const realtimeUtils = {
  formatEventTimestamp: (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  },

  isEventRecent: (timestamp: number, maxAge: number = 300000): boolean => {
    return Date.now() - timestamp < maxAge; // 5 minutes default
  },

  debounceRealtimeCallback: (
    callback: (data: any) => void,
    delay: number = 1000
  ): ((data: any) => void) => {
    let timeoutId: NodeJS.Timeout;
    return (data: any) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => callback(data), delay);
    };
  },

  throttleRealtimeCallback: (
    callback: (data: any) => void,
    limit: number = 1000
  ): ((data: any) => void) => {
    let inThrottle: boolean;
    return (data: any) => {
      if (!inThrottle) {
        callback(data);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },
};

export default realtimeService;
