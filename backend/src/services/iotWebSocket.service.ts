import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { iotDeviceService } from './iotDevice.service';
import { sensorAnalyticsService } from './sensorAnalytics.service';
import { realtimeAnalyticsService } from './realtimeAnalytics.service';
import { authenticateToken } from '../middleware/auth.middleware';

interface ConnectedClient {
  id: string;
  userId: string;
  propertyId?: string;
  subscriptions: Set<string>;
  connectedAt: Date;
}

class IoTWebSocketService {
  private io: SocketIOServer | null = null;
  private connectedClients: Map<string, ConnectedClient> = new Map();

  initialize(server: HTTPServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupEventHandlers();

    console.log('IoT WebSocket service initialized');
  }

  private setupMiddleware(): void {
    if (!this.io) return;

    // Authentication middleware
    this.io.use(async (socket: Socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verify token (simplified - you would implement proper JWT verification)
        const decoded = this.verifyToken(token as string);
        if (!decoded) {
          return next(new Error('Invalid token'));
        }

        socket.data.userId = decoded.userId;
        socket.data.propertyId = decoded.propertyId;

        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Register client
      const client: ConnectedClient = {
        id: socket.id,
        userId: socket.data.userId,
        propertyId: socket.data.propertyId,
        subscriptions: new Set(),
        connectedAt: new Date()
      };

      this.connectedClients.set(socket.id, client);

      // Handle subscription requests
      socket.on('subscribe', (channels: string | string[]) => {
        this.handleSubscription(socket, channels);
      });

      socket.on('unsubscribe', (channels: string | string[]) => {
        this.handleUnsubscription(socket, channels);
      });

      // Handle device commands
      socket.on('device-command', async (data: any) => {
        await this.handleDeviceCommand(socket, data);
      });

      // Handle sensor data submission
      socket.on('sensor-data', async (data: any) => {
        await this.handleSensorData(socket, data);
      });

      // Handle real-time analytics subscription
      socket.on('subscribe-analytics', (sensorIds: string[]) => {
        this.handleAnalyticsSubscription(socket, sensorIds);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        this.connectedClients.delete(socket.id);
      });

      // Send welcome message
      socket.emit('connected', {
        message: 'Connected to IoT WebSocket service',
        clientId: socket.id,
        timestamp: new Date()
      });
    });
  }

  private handleSubscription(socket: Socket, channels: string | string[]): void {
    const client = this.connectedClients.get(socket.id);
    if (!client) return;

    const channelList = Array.isArray(channels) ? channels : [channels];

    channelList.forEach(channel => {
      client.subscriptions.add(channel);
      socket.join(channel);
      console.log(`Client ${socket.id} subscribed to ${channel}`);
    });

    socket.emit('subscribed', { channels: channelList });
  }

  private handleUnsubscription(socket: Socket, channels: string | string[]): void {
    const client = this.connectedClients.get(socket.id);
    if (!client) return;

    const channelList = Array.isArray(channels) ? channels : [channels];

    channelList.forEach(channel => {
      client.subscriptions.delete(channel);
      socket.leave(channel);
      console.log(`Client ${socket.id} unsubscribed from ${channel}`);
    });

    socket.emit('unsubscribed', { channels: channelList });
  }

  private async handleDeviceCommand(socket: Socket, data: any): Promise<void> {
    try {
      const { deviceId, command, parameters } = data;

      const result = await iotDeviceService.sendDeviceCommand({
        deviceId,
        command,
        parameters
      });

      socket.emit('command-result', {
        deviceId,
        command,
        result,
        timestamp: new Date()
      });

    } catch (error) {
      socket.emit('command-error', {
        deviceId: data.deviceId,
        command: data.command,
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  private async handleSensorData(socket: Socket, data: any): Promise<void> {
    try {
      const { sensorId, value, timestamp, quality } = data;

      const reading = await iotDeviceService.recordSensorReading(
        sensorId,
        value,
        timestamp ? new Date(timestamp) : undefined,
        quality
      );

      // Process analytics
      await sensorAnalyticsService.processSensorReading(sensorId, value, reading.timestamp);

      socket.emit('sensor-data-acknowledged', {
        sensorId,
        readingId: reading.id,
        timestamp: reading.timestamp
      });

    } catch (error) {
      socket.emit('sensor-data-error', {
        sensorId: data.sensorId,
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  private handleAnalyticsSubscription(socket: Socket, sensorIds: string[]): void {
    // Subscribe to real-time analytics for specific sensors
    realtimeAnalyticsService.subscribeToRealTimeUpdates(socket.id, sensorIds);

    socket.emit('analytics-subscribed', {
      sensorIds,
      timestamp: new Date()
    });
  }

  // Public methods for broadcasting events

  broadcastToProperty(propertyId: string, event: string, data: any): void {
    if (!this.io) return;

    this.io.to(`property-${propertyId}`).emit(event, {
      ...data,
      timestamp: new Date()
    });
  }

  broadcastToDevice(deviceId: string, event: string, data: any): void {
    if (!this.io) return;

    this.io.to(`device-${deviceId}`).emit(event, {
      ...data,
      timestamp: new Date()
    });
  }

  broadcastToSensor(sensorId: string, event: string, data: any): void {
    if (!this.io) return;

    this.io.to(`sensor-${sensorId}`).emit(event, {
      ...data,
      timestamp: new Date()
    });
  }

  broadcastGlobal(event: string, data: any): void {
    if (!this.io) return;

    this.io.emit(event, {
      ...data,
      timestamp: new Date()
    });
  }

  // Send to specific client
  sendToClient(clientId: string, event: string, data: any): void {
    if (!this.io) return;

    this.io.to(clientId).emit(event, {
      ...data,
      timestamp: new Date()
    });
  }

  // Device status updates
  async broadcastDeviceStatusUpdate(deviceId: string, status: any): Promise<void> {
    const event = 'device-status-update';
    const data = { deviceId, status };

    this.broadcastToDevice(deviceId, event, data);
    this.broadcastToProperty(status.propertyId, event, data);
  }

  // Sensor readings
  async broadcastSensorReading(sensorId: string, reading: any): Promise<void> {
    const event = 'sensor-reading';
    const data = { sensorId, reading };

    this.broadcastToSensor(sensorId, event, data);
  }

  // Alerts
  async broadcastAlert(alert: any): Promise<void> {
    const event = 'alert';
    const data = { alert };

    // Broadcast to property
    this.broadcastToProperty(alert.propertyId, event, data);

    // Also broadcast globally for critical alerts
    if (alert.severity === 'CRITICAL' || alert.severity === 'HIGH') {
      this.broadcastGlobal('critical-alert', data);
    }
  }

  // Analytics updates
  async broadcastAnalyticsUpdate(sensorId: string, analytics: any): Promise<void> {
    const event = 'analytics-update';
    const data = { sensorId, analytics };

    this.broadcastToSensor(sensorId, event, data);
  }

  // Predictive maintenance alerts
  async broadcastPredictiveMaintenance(prediction: any): Promise<void> {
    const event = 'predictive-maintenance';
    const data = { prediction };

    this.broadcastToDevice(prediction.deviceId, event, data);
    this.broadcastToProperty(prediction.propertyId, event, data);
  }

  // Get connection statistics
  getConnectionStats(): any {
    const clients = Array.from(this.connectedClients.values());

    return {
      totalConnections: clients.length,
      connectionsByProperty: clients.reduce((acc, client) => {
        const propertyId = client.propertyId || 'unknown';
        acc[propertyId] = (acc[propertyId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      totalSubscriptions: clients.reduce((sum, client) => sum + client.subscriptions.size, 0),
      uptime: process.uptime(),
      timestamp: new Date()
    };
  }

  // Health check
  getHealthStatus(): any {
    return {
      status: this.io ? 'healthy' : 'unhealthy',
      connections: this.connectedClients.size,
      timestamp: new Date()
    };
  }

  // Cleanup inactive connections
  cleanupInactiveConnections(maxAge: number = 3600000): number { // 1 hour default
    const now = Date.now();
    let cleaned = 0;

    for (const [clientId, client] of this.connectedClients) {
      const age = now - client.connectedAt.getTime();
      if (age > maxAge) {
        // Force disconnect
        const socket = this.io?.sockets.sockets.get(clientId);
        if (socket) {
          socket.disconnect(true);
        }
        this.connectedClients.delete(clientId);
        cleaned++;
      }
    }

    return cleaned;
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    console.log('Shutting down IoT WebSocket service...');

    if (this.io) {
      // Disconnect all clients
      const sockets = await this.io.fetchSockets();
      for (const socket of sockets) {
        socket.emit('shutdown', { message: 'Server is shutting down' });
        socket.disconnect(true);
      }

      this.io.close();
      this.io = null;
    }

    this.connectedClients.clear();
    console.log('IoT WebSocket service shut down');
  }

  // Simplified token verification (replace with actual JWT verification)
  private verifyToken(token: string): any {
    // This is a placeholder - implement proper JWT verification
    // For now, just return a mock decoded token
    return {
      userId: 'mock-user-id',
      propertyId: 'mock-property-id'
    };
  }
}

export const iotWebSocketService = new IoTWebSocketService();