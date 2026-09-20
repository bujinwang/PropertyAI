import { createClient } from 'redis';
import { Request, Response, NextFunction } from 'express';

let redisClient: any = null;
let redisAvailable = false;

// Under Jest the cache module is automocked (see __tests__/setup.ts). Jest
// implements automock by evaluating the real module to introspect its export
// shape, which means this module is executed once per test file. Opening a real
// Redis connection at import time under those circumstances leaks sockets and
// keeps the event loop alive, so the suite never exits. Skip connecting entirely
// in a test environment; the exported helpers already fall back to no-cache when
// no client is present, which is exactly what the tests expect.
const isTest =
  process.env.NODE_ENV === 'test' || !!process.env.JEST_WORKER_ID;

// Initialize Redis with error handling
if (!isTest) {
  (async () => {
    try {
      redisClient = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          connectTimeout: 5000, // 5 second timeout
          // Bound the reconnect so a dead Redis cannot spin forever. Without a
          // limit the client retries indefinitely and starves the timer/microtask
          // queues, which hangs any process that imports this module.
          reconnectStrategy: (retries: number) => {
            if (retries > 5) {
              return new Error('Redis reconnect limit reached');
            }
            return Math.min(retries * 200, 2000);
          }
        }
      });

      redisClient.on('error', (err: any) => {
        console.log('Redis Client Error:', err.message);
        redisAvailable = false;
      });

      redisClient.on('connect', () => {
        console.log('Redis connected successfully');
        redisAvailable = true;
      });

      await redisClient.connect();

      // Do not let an idle Redis connection keep the process alive. redis@4
      // exposes a public `unref()` on the client, so this is safe to call.
      if (typeof redisClient.unref === 'function') {
        redisClient.unref();
      }
    } catch (error) {
      console.log('Redis connection failed, running without cache:', (error as Error).message);
      redisAvailable = false;
    }
  })();
}

// Cache functions with Redis fallback
export const getCache = async (key: string): Promise<any> => {
  if (!redisAvailable || !redisClient) {
    return null;
  }
  
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('Redis get error:', err);
    return null;
  }
};

export const setCache = async (key: string, value: any, ttl: number = 3600): Promise<void> => {
  if (!redisAvailable || !redisClient) {
    return;
  }
  
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
  } catch (err) {
    console.error('Redis set error:', err);
  }
};

export const cacheMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  if (!redisAvailable || !redisClient) {
    return next();
  }
  
  const key = req.originalUrl;
  try {
    const data = await redisClient.get(key);
    if (data) {
      return res.send(JSON.parse(data));
    }

    const originalSend = res.send.bind(res);
    (res as any).send = (body: any) => {
      if (redisAvailable && redisClient) {
        redisClient.setEx(key, 3600, JSON.stringify(body)).catch((err: any) => {
          console.error('Redis cache set error:', err);
        });
      }
      originalSend(body);
    };
    next();
  } catch (err) {
    console.error('Redis error:', err);
    next();
  }
};

export const clearCache = async (key: string): Promise<void> => {
  if (!redisAvailable || !redisClient) {
    return;
  }
  
  try {
    await redisClient.del(key);
  } catch (err) {
    console.error('Redis delete error:', err);
  }
};

/**
 * Gracefully close the Redis connection and clear module references so the
 * process can exit. Safe to call when Redis was never connected (no-op).
 */
export const closeCache = async (): Promise<void> => {
  const client = redisClient;
  redisClient = null;
  redisAvailable = false;

  if (!client) {
    return;
  }

  try {
    await client.quit();
  } catch (err) {
    console.error('Redis quit error:', (err as Error).message);
  }
};
