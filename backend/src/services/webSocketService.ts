import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

class WebSocketService {
  private wss: WebSocketServer;

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server });
    this.initialize();
  }

  private initialize() {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('Client connected');

      ws.on('message', (message: string) => {
        console.log(`Received message: ${message}`);
        ws.send(`Echo: ${message}`);
      });

      ws.on('close', () => {
        console.log('Client disconnected');
      });

      ws.on('error', (error: Error) => {
        console.error(`WebSocket error: ${error.message}`);
      });
    });
  }

  public broadcast(data: any) {
    const message = JSON.stringify(data);
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

export default WebSocketService;
