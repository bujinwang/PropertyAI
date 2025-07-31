import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthenticatedSocket {
  userId: string;
  email: string;
  roles: string[];
}

export class WebSocketService {
  private io: Server;
  private connectedUsers = new Map<string, Set<string>>(); // userId -> socketIds

  constructor(server: HttpServer) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    this.setupMiddleware();
    this.setupEventHandlers();
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
            roles: { select: { name: true } }
          }
        });

        if (!user) {
          return next(new Error('User not found'));
        }

        (socket as any).user = {
          userId: user.id,
          email: user.email,
          roles: user.roles.map(r => r.name)
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

  public getActiveUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  public isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  public getUserSocketCount(userId: string): number {
    return this.connectedUsers.get(userId)?.size || 0;
  }
}

export default WebSocketService;
