class WebSocketService {
  private ws: WebSocket;

  constructor(url: string) {
    this.ws = new WebSocket(url);
    this.initialize();
  }

  private initialize() {
    this.ws.onopen = () => {
      console.log('Connected to WebSocket server');
    };

    this.ws.onmessage = (e) => {
      console.log(`Received message: ${e.data}`);
    };

    this.ws.onerror = (e) => {
      console.error('WebSocket error:', e);
    };

    this.ws.onclose = (e) => {
      console.log('Disconnected from WebSocket server');
    };
  }

  public send(data: unknown) {
    const message = JSON.stringify(data);
    this.ws.send(message);
  }

  public close() {
    this.ws.close();
  }
}

export default WebSocketService;
