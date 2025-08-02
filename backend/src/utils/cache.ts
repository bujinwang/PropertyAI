import { createClient } from 'redis';
import { Request, Response, NextFunction } from 'express';

let redisClient: any = null;
let redisAvailable = false;

// Initialize Redis with error handling
(async () => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        connectTimeout: 5000 // 5 second timeout
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
  } catch (error) {
    console.log('Redis connection failed, running without cache:', (error as Error).message);
    redisAvailable = false;
  }
})();

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
