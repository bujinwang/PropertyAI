/**
 * WebSocket Service for Real-time Updates
 * Provides centralized WebSocket management for AI dashboard components
 */

import { queryClient } from '../config/queryClient';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: Date;
  id?: string;
}

export interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export class WebSocketService {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private connectionStatus: ConnectionStatus = 'disconnected';
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();

  constructor(config: WebSocketConfig) {
    this.config = {
      reconnectInterval: 5000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000,
      ...config,
    };
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.setConnectionStatus('connecting');
      
      try {
        this.ws = new WebSocket(this.config.url);
        
        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.setConnectionStatus('connected');
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            message.timestamp = new Date(message.timestamp);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.setConnectionStatus('disconnected');
          this.stopHeartbeat();
          
          if (!event.wasClean && this.shouldReconnect()) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.setConnectionStatus('error');
          reject(error);
        };
      } catch (error) {
        this.setConnectionStatus('error');
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.setConnectionStatus('disconnected');
  }

  send(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent:', message);
    }
  }

  subscribe(eventType: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    
    this.listeners.get(eventType)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(eventType);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  onConnectionStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  private handleMessage(message: WebSocketMessage): void {
    const listeners = this.listeners.get(message.type);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(message.data);
        } catch (error) {
          console.error('Error in WebSocket message handler:', error);
        }
      });
    }

    // Handle specific message types for cache updates
    this.handleCacheUpdates(message);
  }

  private handleCacheUpdates(message: WebSocketMessage): void {
    switch (message.type) {
      case 'emergency_alert_created':
      case 'emergency_alert_updated':
        queryClient.invalidateQueries({ queryKey: ['emergency-alerts'] });
        if (message.data.id) {
          queryClient.invalidateQueries({ queryKey: ['emergency-alert', message.data.id] });
        }
        break;

      case 'building_health_updated':
        if (message.data.propertyId) {
          queryClient.invalidateQueries({ 
            queryKey: ['building-health-overview', message.data.propertyId] 
          });
          queryClient.invalidateQueries({ 
            queryKey: ['building-health-alerts', message.data.propertyId] 
          });
        }
        break;

      case 'market_data_updated':
        queryClient.invalidateQueries({ queryKey: ['market-intelligence-trends'] });
        queryClient.invalidateQueries({ queryKey: ['market-intelligence-competitors'] });
        break;

      case 'ai_insight_generated':
        queryClient.invalidateQueries({ queryKey: ['insights-dashboard'] });
        break;

      case 'document_verification_updated':
        if (message.data.userId) {
          queryClient.invalidateQueries({ 
            queryKey: ['document-verification-status', message.data.userId] 
          });
        }
        break;

      case 'personalization_updated':
        if (message.data.userId) {
          queryClient.invalidateQueries({ 
            queryKey: ['personalization-recommendations', message.data.userId] 
          });
        }
        break;

      case 'heartbeat':
        // Respond to heartbeat
        this.send({ type: 'heartbeat_response', timestamp: new Date() });
        break;

      default:
        // Handle unknown message types
        console.log('Unknown WebSocket message type:', message.type);
    }
  }

  private setConnectionStatus(status: ConnectionStatus): void {
    if (this.connectionStatus !== status) {
      this.connectionStatus = status;
      this.statusListeners.forEach(callback => {
        try {
          callback(status);
        } catch (error) {
          console.error('Error in connection status handler:', error);
        }
      });
    }
  }

  private shouldReconnect(): boolean {
    return this.reconnectAttempts < (this.config.maxReconnectAttempts || 5);
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    const delay = this.config.reconnectInterval! * Math.pow(2, this.reconnectAttempts);
    console.log(`Scheduling WebSocket reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect().catch(error => {
        console.error('WebSocket reconnect failed:', error);
        if (this.shouldReconnect()) {
          this.scheduleReconnect();
        }
      });
    }, delay);
  }

  private startHeartbeat(): void {
    if (this.config.heartbeatInterval && this.config.heartbeatInterval > 0) {
      this.heartbeatTimer = setInterval(() => {
        this.send({ type: 'heartbeat', timestamp: new Date() });
      }, this.config.heartbeatInterval);
    }
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}

// Create service instances for different endpoints
const baseUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:3001';

export const emergencyWebSocketService = new WebSocketService({
  url: `${baseUrl}/emergency-response`,
  reconnectInterval: 3000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000,
});

export const buildingHealthWebSocketService = new WebSocketService({
  url: `${baseUrl}/building-health`,
  reconnectInterval: 5000,
  maxReconnectAttempts: 5,
  heartbeatInterval: 60000,
});

export const marketIntelligenceWebSocketService = new WebSocketService({
  url: `${baseUrl}/market-intelligence`,
  reconnectInterval: 10000,
  maxReconnectAttempts: 3,
  heartbeatInterval: 120000,
});

export const aiInsightsWebSocketService = new WebSocketService({
  url: `${baseUrl}/ai-insights`,
  reconnectInterval: 5000,
  maxReconnectAttempts: 5,
  heartbeatInterval: 60000,
});

// Utility hook for using WebSocket services
export const useWebSocketService = (service: WebSocketService) => {
  const [connectionStatus, setConnectionStatus] = React.useState<ConnectionStatus>(
    service.getConnectionStatus()
  );

  React.useEffect(() => {
    const unsubscribe = service.onConnectionStatusChange(setConnectionStatus);
    
    // Connect if not already connected
    if (service.getConnectionStatus() === 'disconnected') {
      service.connect().catch(console.error);
    }

    return () => {
      unsubscribe();
    };
  }, [service]);

  return {
    connectionStatus,
    connect: () => service.connect(),
    disconnect: () => service.disconnect(),
    subscribe: (eventType: string, callback: (data: any) => void) => 
      service.subscribe(eventType, callback),
    send: (message: any) => service.send(message),
  };
};

// React import for the hook
import React from 'react';

export default WebSocketService;