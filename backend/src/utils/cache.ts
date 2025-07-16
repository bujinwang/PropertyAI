import { createClient } from 'redis';
import { Request, Response, NextFunction } from 'express';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

(async () => {
  await redisClient.connect();
})();

// Add the missing cache functions
export const getCache = async (key: string): Promise<any> => {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('Redis get error:', err);
    return null;
  }
};

export const setCache = async (key: string, value: any, ttl: number = 3600): Promise<void> => {
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
  } catch (err) {
    console.error('Redis set error:', err);
  }
};

export const cacheMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const key = req.originalUrl;
  try {
    const data = await redisClient.get(key);
    if (data) {
      return res.send(JSON.parse(data));
    }

    const originalSend = res.send.bind(res);
    (res as any).send = (body: any) => {
      redisClient.setEx(key, 3600, JSON.stringify(body));
      originalSend(body);
    };
    next();
  } catch (err) {
    console.error('Redis error:', err);
    next();
  }
};

export const clearCache = async (key: string): Promise<void> => {
  try {
    await redisClient.del(key);
  } catch (err) {
    console.error('Redis delete error:', err);
  }
};
