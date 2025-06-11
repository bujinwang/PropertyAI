import { Server, Socket } from 'socket.io';
import { verify } from 'jsonwebtoken';
import { config } from '../config/config';
import { Server as HttpServer } from 'http';

class WebSocketService {
  private io: Server;

  constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: '*',
      },
    });

    this.io.use((socket: Socket, next: (err?: Error) => void) => {
      if (socket.handshake.query && socket.handshake.query.token) {
        verify(socket.handshake.query.token as string, config.jwt.secret || '', (err: any, decoded: any) => {
          if (err) return next(new Error('Authentication error'));
          socket.data.user = decoded;
          next();
        });
      } else {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket: Socket) => {
      console.log('a user connected', socket.data.user);

      socket.on('disconnect', () => {
        console.log('user disconnected');
      });
    });
  }

  public getIO(): Server {
    return this.io;
  }
}

export let webSocketService: WebSocketService;

export const initializeWebSocket = (httpServer: HttpServer) => {
  webSocketService = new WebSocketService(httpServer);
};
