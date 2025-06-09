"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
class WebSocketService {
    constructor(server) {
        this.wss = new ws_1.WebSocketServer({ server });
        this.initialize();
    }
    initialize() {
        this.wss.on('connection', (ws) => {
            console.log('Client connected');
            ws.on('message', (message) => {
                console.log(`Received message: ${message}`);
                ws.send(`Echo: ${message}`);
            });
            ws.on('close', () => {
                console.log('Client disconnected');
            });
            ws.on('error', (error) => {
                console.error(`WebSocket error: ${error.message}`);
            });
        });
    }
    broadcast(data) {
        const message = JSON.stringify(data);
        this.wss.clients.forEach((client) => {
            if (client.readyState === ws_1.WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
}
exports.default = WebSocketService;
//# sourceMappingURL=webSocketService.js.map