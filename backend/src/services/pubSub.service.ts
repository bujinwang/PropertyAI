import { createClient, RedisClientType } from 'redis';
import { config } from '../config/config';
import WebSocketService from './webSocket.service';

class PubSubService {
  private publisher: RedisClientType;
  private subscriber: RedisClientType;

  constructor() {
    this.publisher = createClient({
      url: config.redis.url,
      password: config.redis.password,
    });

    this.subscriber = this.publisher.duplicate();

    this.publisher.on('error', (err) => console.error('Redis Publisher Error', err));
    this.subscriber.on('error', (err) => console.error('Redis Subscriber Error', err));

    this.connect();
  }

  private async connect() {
    await this.publisher.connect();
    await this.subscriber.connect();
  }

  async publish(channel: string, message: string) {
    await this.publisher.publish(channel, message);
  }

  async subscribe(channel: string, callback: (message: string) => void) {
    await this.subscriber.subscribe(channel, callback);
  }
}

export const pubSubService = new PubSubService();

pubSubService.subscribe('dashboard-updates', (message) => {
  try {
    const data = JSON.parse(message);
    console.log('Dashboard update received:', data);
  } catch (error) {
    console.error('Error parsing dashboard update:', error);
  }
});
