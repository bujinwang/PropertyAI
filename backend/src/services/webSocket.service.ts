import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { RedisAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

interface AuthenticatedSocket {
  userId: string;
  email: string;
  role: string; // Changed from 'roles: string[]' to 'role: string' since User has a single role field
}

interface RealtimeEventData {
  id?: string;
  type?: string;
  message?: string;
  title?: string;
  body?: string;
  data?: any;
  timestamp?: number;
  propertyId?: string;
  maintenanceId?: string;
  paymentId?: string;
  userId?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export class WebSocketService {
  private io: Server;
  private connectedUsers = new Map<string, Set<string>>(); // userId -> socketIds
  private eventHistory = new Map<string, RealtimeEventData[]>(); // userId -> events
  private maxHistorySize = 50;
  private redisEnabled = false;
  private pubClient: any = null;
  private subClient: any = null;

  constructor(server: HttpServer) {
    // Initialize Redis clients for scaling (optional)
    this.initializeRedis();

    this.io = new Server(server, {
      cors: {
        origin: [
          process.env.FRONTEND_URL || "http://localhost:3000",
          "http://localhost:3002", // Dashboard alternative
          "http://localhost:3003", // Dashboard current
          "http://localhost:8081", // Expo web app
          "exp://localhost:19000", // Expo development
          "http://localhost:19006" // Expo web alternative
        ],
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    // Set up Redis adapter if Redis is available
    if (this.redisEnabled && this.pubClient && this.subClient) {
      this.io.adapter(new RedisAdapter(this.pubClient, this.subClient));
      console.log('🔴 Redis adapter enabled for horizontal scaling');
    }

    this.setupMiddleware();
    this.setupEventHandlers();
    this.setupRealtimeEventHandlers();
  }

  private async initializeRedis() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

      if (process.env.REDIS_URL || process.env.NODE_ENV === 'production') {
        this.pubClient = createClient({ url: redisUrl });
        this.subClient = this.pubClient.duplicate();

        // Handle Redis connection events
        this.pubClient.on('error', (err: any) => {
          console.warn('Redis Pub Client Error:', err.message);
          this.redisEnabled = false;
        });

        this.subClient.on('error', (err: any) => {
          console.warn('Redis Sub Client Error:', err.message);
          this.redisEnabled = false;
        });

        this.pubClient.on('connect', () => {
          console.log('✅ Redis Pub Client Connected');
          this.redisEnabled = true;
        });

        this.subClient.on('connect', () => {
          console.log('✅ Redis Sub Client Connected');
        });

        // Connect to Redis
        await Promise.all([
          this.pubClient.connect(),
          this.subClient.connect()
        ]);

      } else {
        console.log('ℹ️ Redis not configured, running in single-server mode');
      }
    } catch (error) {
      console.warn('Failed to initialize Redis:', error);
      this.redisEnabled = false;
    }
  }

  private setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { 
            id: true, 
            email: true, 
            role: true // Changed from 'roles: { select: { name: true } }' to 'role: true'
          }
        });

        if (!user) {
          return next(new Error('User not found'));
        }

        (socket as any).user = {
          userId: user.id,
          email: user.email,
          role: user.role // Changed from 'roles: user.roles.map(r => r.name)' to 'role: user.role'
        };

        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      const user = (socket as any).user as AuthenticatedSocket;
      const userId = user.userId;

      // Track user connection
      if (!this.connectedUsers.has(userId)) {
        this.connectedUsers.set(userId, new Set());
      }
      this.connectedUsers.get(userId)!.add(socket.id);

      console.log(`User ${user.email} connected. Total users: ${this.connectedUsers.size}`);

      // Join user-specific room
      socket.join(`user:${userId}`);

      // Emergency Response WebSocket events
      socket.on('emergency:join', () => {
        socket.join('emergency-response');
        console.log(`User ${user.email} joined emergency response channel`);
      });

      socket.on('emergency:leave', () => {
        socket.leave('emergency-response');
        console.log(`User ${user.email} left emergency response channel`);
      });

      socket.on('emergency:alert-update', (data: any) => {
        socket.to('emergency-response').emit('emergency:alert-updated', {
          ...data,
          updatedBy: user.userId,
          timestamp: new Date()
        });
      });

      socket.on('emergency:status-change', (data: any) => {
        socket.to('emergency-response').emit('emergency:status-changed', {
          ...data,
          changedBy: user.userId,
          timestamp: new Date()
        });
      });

      // UX Review real-time events
      socket.on('ux:join-review', (reviewId: string) => {
        socket.join(`review:${reviewId}`);
        this.broadcastReviewPresence(reviewId);
      });

      socket.on('ux:leave-review', (reviewId: string) => {
        socket.leave(`review:${reviewId}`);
        this.broadcastReviewPresence(reviewId);
      });

      socket.on('ux:typing', ({ reviewId, isTyping }: { reviewId: string; isTyping: boolean }) => {
        socket.to(`review:${reviewId}`).emit('ux:user-typing', {
          userId,
          userName: user.email,
          isTyping
        });
      });

      socket.on('ux:review-updated', (reviewId: string) => {
        socket.to(`review:${reviewId}`).emit('ux:review-changed', {
          reviewId,
          updatedBy: user.userId
        });
      });

      socket.on('ux:comment-added', (reviewId: string) => {
        socket.to(`review:${reviewId}`).emit('ux:new-comment', {
          reviewId,
          authorId: user.userId
        });
      });

      socket.on('ux:review-created', (review: any) => {
        socket.broadcast.emit('ux:new-review', review);
      });

      socket.on('ux:review-deleted', (reviewId: string) => {
        socket.broadcast.emit('ux:review-removed', reviewId);
      });

      socket.on('disconnect', () => {
        const sockets = this.connectedUsers.get(userId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            this.connectedUsers.delete(userId);
          }
        }
        console.log(`User ${user.email} disconnected. Total users: ${this.connectedUsers.size}`);
      });
    });
  }

  private broadcastReviewPresence(reviewId: string) {
    const room = this.io.sockets.adapter.rooms.get(`review:${reviewId}`);
    const userIds = room ? [...room].map(socketId => {
      const socket = this.io.sockets.sockets.get(socketId);
      return socket ? (socket as any).user.userId : null;
    }).filter(Boolean) : [];

    this.io.to(`review:${reviewId}`).emit('ux:presence-update', userIds);
  }

  // Public methods for emitting events
  public emitToUser(userId: string, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  public emitToReview(reviewId: string, event: string, data: any) {
    this.io.to(`review:${reviewId}`).emit(event, data);
  }

  public broadcastToAll(event: string, data: any) {
    this.io.emit(event, data);
  }

  // Emergency Response specific methods
  public emitEmergencyAlert(data: any) {
    this.io.to('emergency-response').emit('emergency:new-alert', {
      ...data,
      timestamp: new Date()
    });
  }

  public emitEmergencyUpdate(data: any) {
    this.io.to('emergency-response').emit('emergency:alert-updated', {
      ...data,
      timestamp: new Date()
    });
  }

  public emitEmergencyStatusChange(data: any) {
    this.io.to('emergency-response').emit('emergency:status-changed', {
      ...data,
      timestamp: new Date()
    });
  }

  public getActiveUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  public isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  private setupRealtimeEventHandlers() {
    // Set up real-time event handlers for mobile app integration
    this.setupPropertyEvents();
    this.setupMaintenanceEvents();
    this.setupPaymentEvents();
    this.setupAnalyticsEvents();
    this.setupMarketDataEvents();
    this.setupSystemEvents();
  }

  private setupPropertyEvents() {
    // Property-related real-time events
    this.io.on('connection', (socket) => {
      socket.on('property:subscribe', (propertyId: string) => {
        socket.join(`property:${propertyId}`);
        console.log(`User subscribed to property: ${propertyId}`);
      });

      socket.on('property:unsubscribe', (propertyId: string) => {
        socket.leave(`property:${propertyId}`);
        console.log(`User unsubscribed from property: ${propertyId}`);
      });
    });
  }

  private setupMaintenanceEvents() {
    // Maintenance-related real-time events
    this.io.on('connection', (socket) => {
      socket.on('maintenance:subscribe', (maintenanceId: string) => {
        socket.join(`maintenance:${maintenanceId}`);
        console.log(`User subscribed to maintenance: ${maintenanceId}`);
      });

      socket.on('maintenance:unsubscribe', (maintenanceId: string) => {
        socket.leave(`maintenance:${maintenanceId}`);
        console.log(`User unsubscribed from maintenance: ${maintenanceId}`);
      });
    });
  }

  private setupPaymentEvents() {
    // Payment-related real-time events
    this.io.on('connection', (socket) => {
      socket.on('payment:subscribe', (paymentId: string) => {
        socket.join(`payment:${paymentId}`);
        console.log(`User subscribed to payment: ${paymentId}`);
      });

      socket.on('payment:unsubscribe', (paymentId: string) => {
        socket.leave(`payment:${paymentId}`);
        console.log(`User unsubscribed from payment: ${paymentId}`);
      });
    });
  }

  private setupAnalyticsEvents() {
    // Analytics-related real-time events
    this.io.on('connection', (socket) => {
      socket.on('analytics:subscribe', () => {
        socket.join('analytics');
        console.log(`User subscribed to analytics`);
      });

      socket.on('analytics:unsubscribe', () => {
        socket.leave('analytics');
        console.log(`User unsubscribed from analytics`);
      });
    });
  }

  private setupMarketDataEvents() {
    // Market data-related real-time events
    this.io.on('connection', (socket) => {
      socket.on('market-data:subscribe', () => {
        socket.join('market-data');
        console.log(`User subscribed to market data`);
      });

      socket.on('market-data:unsubscribe', () => {
        socket.leave('market-data');
        console.log(`User unsubscribed from market data`);
      });
    });
  }

  private setupSystemEvents() {
    // System-related real-time events
    this.io.on('connection', (socket) => {
      socket.on('system:subscribe', () => {
        socket.join('system');
        console.log(`User subscribed to system events`);
      });

      socket.on('system:unsubscribe', () => {
        socket.leave('system');
        console.log(`User unsubscribed from system events`);
      });
    });
  }

  // Real-time event emission methods for mobile app integration
  public emitPropertyUpdate(propertyId: string, data: RealtimeEventData) {
    const eventData = {
      ...data,
      id: data.id || `property-${Date.now()}`,
      type: 'property_update',
      timestamp: data.timestamp || Date.now(),
      propertyId,
    };

    // Emit to property-specific room
    this.io.to(`property:${propertyId}`).emit('property:update', eventData);

    // Also emit to user's personal room for notifications
    if (data.userId) {
      this.emitToUser(data.userId, 'notification:new', {
        title: data.title || 'Property Update',
        body: data.body || data.message || 'Property information has been updated',
        data: eventData,
        priority: data.priority || 'medium',
      });
    }

    console.log(`📤 Emitted property update for property ${propertyId}`);
  }

  public emitMaintenanceUpdate(maintenanceId: string, data: RealtimeEventData) {
    const eventData = {
      ...data,
      id: data.id || `maintenance-${Date.now()}`,
      type: 'maintenance_update',
      timestamp: data.timestamp || Date.now(),
      maintenanceId,
    };

    // Emit to maintenance-specific room
    this.io.to(`maintenance:${maintenanceId}`).emit('maintenance:update', eventData);

    // Also emit to user's personal room for notifications
    if (data.userId) {
      this.emitToUser(data.userId, 'notification:new', {
        title: data.title || 'Maintenance Update',
        body: data.body || data.message || 'Maintenance request has been updated',
        data: eventData,
        priority: data.priority || 'high',
      });
    }

    console.log(`🔧 Emitted maintenance update for maintenance ${maintenanceId}`);
  }

  public emitPaymentUpdate(paymentId: string, data: RealtimeEventData) {
    const eventData = {
      ...data,
      id: data.id || `payment-${Date.now()}`,
      type: 'payment_update',
      timestamp: data.timestamp || Date.now(),
      paymentId,
    };

    // Emit to payment-specific room
    this.io.to(`payment:${paymentId}`).emit('payment:update', eventData);

    // Also emit to user's personal room for notifications
    if (data.userId) {
      this.emitToUser(data.userId, 'notification:new', {
        title: data.title || 'Payment Update',
        body: data.body || data.message || 'Payment status has been updated',
        data: eventData,
        priority: data.priority || 'medium',
      });
    }

    console.log(`💳 Emitted payment update for payment ${paymentId}`);
  }

  public emitAnalyticsUpdate(data: RealtimeEventData) {
    const eventData = {
      ...data,
      id: data.id || `analytics-${Date.now()}`,
      type: 'analytics_update',
      timestamp: data.timestamp || Date.now(),
    };

    // Emit to analytics room
    this.io.to('analytics').emit('analytics:update', eventData);

    console.log(`📊 Emitted analytics update`);
  }

  public emitMarketDataUpdate(data: RealtimeEventData) {
    const eventData = {
      ...data,
      id: data.id || `market-data-${Date.now()}`,
      type: 'market_data_update',
      timestamp: data.timestamp || Date.now(),
    };

    // Emit to market-data room
    this.io.to('market-data').emit('market-data:update', eventData);

    console.log(`📈 Emitted market data update`);
  }

  public emitSystemAlert(data: RealtimeEventData) {
    const eventData = {
      ...data,
      id: data.id || `system-${Date.now()}`,
      type: 'system_alert',
      timestamp: data.timestamp || Date.now(),
    };

    // Emit to system room
    this.io.to('system').emit('system:alert', eventData);

    // Also broadcast to all connected users
    this.io.emit('notification:new', {
      title: data.title || 'System Alert',
      body: data.body || data.message || 'System notification',
      data: eventData,
      priority: data.priority || 'high',
    });

    console.log(`🚨 Emitted system alert`);
  }

  // Notification management
  public emitNotification(userId: string, notification: RealtimeEventData) {
    const notificationData = {
      ...notification,
      id: notification.id || `notification-${Date.now()}`,
      timestamp: notification.timestamp || Date.now(),
      read: false,
    };

    // Store in user's event history
    this.addToUserHistory(userId, notificationData);

    // Emit to user's personal room
    this.emitToUser(userId, 'notification:new', notificationData);

    console.log(`🔔 Emitted notification to user ${userId}`);
  }

  private addToUserHistory(userId: string, event: RealtimeEventData) {
    if (!this.eventHistory.has(userId)) {
      this.eventHistory.set(userId, []);
    }

    const userEvents = this.eventHistory.get(userId)!;
    userEvents.unshift(event);

    // Keep only the most recent events
    if (userEvents.length > this.maxHistorySize) {
      userEvents.splice(this.maxHistorySize);
    }
  }

  // Connection status methods
  public getConnectionStats() {
    return {
      totalUsers: this.connectedUsers.size,
      totalSockets: Array.from(this.connectedUsers.values()).reduce((sum, sockets) => sum + sockets.size, 0),
      activeUsers: Array.from(this.connectedUsers.keys()),
    };
  }

  public getUserEventHistory(userId: string): RealtimeEventData[] {
    return this.eventHistory.get(userId) || [];
  }

  public clearUserHistory(userId: string) {
    this.eventHistory.delete(userId);
    console.log(`🧹 Cleared event history for user ${userId}`);
  }

  // Cleanup method
  public cleanup() {
    this.connectedUsers.clear();
    this.eventHistory.clear();
    console.log('🧹 WebSocket service cleaned up');
  }

}

export default WebSocketService;
