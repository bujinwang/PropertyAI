import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { parse } from 'url';
import jwt from 'jsonwebtoken';

interface EmergencyWebSocketMessage {
  type: string;
  data?: any;
  timestamp?: Date;
}

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  isAuthenticated?: boolean;
}

class EmergencyWebSocketService {
  private wss: WebSocketServer;
  private clients: Set<AuthenticatedWebSocket> = new Set();

  constructor(server: any) {
    this.wss = new WebSocketServer({
      server,
      path: '/api/emergency-response/ws',
      verifyClient: this.verifyClient.bind(this)
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    console.log('Emergency WebSocket service initialized on /api/emergency-response/ws');
  }

  private verifyClient(info: { origin: string; secure: boolean; req: IncomingMessage }): boolean {
    try {
      const url = parse(info.req.url || '', true);
      const token = url.query.token as string;

      if (!token) {
        console.log('WebSocket connection rejected: No token provided');
        return false;
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
      
      // Store user info in request for later use
      (info.req as any).userId = decoded.userId || decoded.id;
      
      return true;
    } catch (error) {
      console.log('WebSocket connection rejected: Invalid token', error);
      return false;
    }
  }

  private handleConnection(ws: AuthenticatedWebSocket, req: IncomingMessage): void {
    console.log('New emergency WebSocket connection established');
    
    // Set user info from verification
    ws.userId = (req as any).userId;
    ws.isAuthenticated = true;
    
    this.clients.add(ws);

    // Send welcome message
    this.sendToClient(ws, {
      type: 'connection_established',
      data: { message: 'Connected to emergency response WebSocket' },
      timestamp: new Date()
    });

    // Handle incoming messages
    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString()) as EmergencyWebSocketMessage;
        this.handleMessage(ws, message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        this.sendToClient(ws, {
          type: 'error',
          data: { message: 'Invalid message format' },
          timestamp: new Date()
        });
      }
    });

    // Handle connection close
    ws.on('close', () => {
      console.log('Emergency WebSocket connection closed');
      this.clients.delete(ws);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('Emergency WebSocket error:', error);
      this.clients.delete(ws);
    });

    // Send heartbeat every 30 seconds
    const heartbeatInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        this.sendToClient(ws, {
          type: 'heartbeat',
          timestamp: new Date()
        });
      } else {
        clearInterval(heartbeatInterval);
      }
    }, 30000);
  }

  private handleMessage(ws: AuthenticatedWebSocket, message: EmergencyWebSocketMessage): void {
    console.log('Received emergency WebSocket message:', message.type);

    switch (message.type) {
      case 'heartbeat_response':
        // Client responded to heartbeat, no action needed
        break;

      case 'subscribe_alerts':
        // Client wants to subscribe to alert updates
        this.sendToClient(ws, {
          type: 'subscription_confirmed',
          data: { subscription: 'alerts' },
          timestamp: new Date()
        });
        break;

      case 'subscribe_status':
        // Client wants to subscribe to status updates
        this.sendToClient(ws, {
          type: 'subscription_confirmed',
          data: { subscription: 'status' },
          timestamp: new Date()
        });
        break;

      default:
        console.log('Unknown emergency WebSocket message type:', message.type);
        this.sendToClient(ws, {
          type: 'unknown_message_type',
          data: { originalType: message.type },
          timestamp: new Date()
        });
    }
  }

  private sendToClient(ws: AuthenticatedWebSocket, message: EmergencyWebSocketMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error sending message to WebSocket client:', error);
      }
    }
  }

  // Public methods for broadcasting emergency updates
  public broadcastAlert(alert: any): void {
    const message: EmergencyWebSocketMessage = {
      type: 'emergency_alert_created',
      data: alert,
      timestamp: new Date()
    };

    this.broadcast(message);
  }

  public broadcastAlertUpdate(alert: any): void {
    const message: EmergencyWebSocketMessage = {
      type: 'emergency_alert_updated',
      data: alert,
      timestamp: new Date()
    };

    this.broadcast(message);
  }

  public broadcastStatusChange(status: any): void {
    const message: EmergencyWebSocketMessage = {
      type: 'emergency_status_changed',
      data: status,
      timestamp: new Date()
    };

    this.broadcast(message);
  }

  private broadcast(message: EmergencyWebSocketMessage): void {
    console.log(`Broadcasting emergency message to ${this.clients.size} clients:`, message.type);
    
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN && client.isAuthenticated) {
        this.sendToClient(client, message);
      }
    });
  }

  public getConnectedClientsCount(): number {
    return this.clients.size;
  }
}

export default EmergencyWebSocketService;