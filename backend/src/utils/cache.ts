import { createClient } from 'redis';
import { Request, Response, NextFunction } from 'express';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

(async () => {
  await redisClient.connect();
})();

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

export const clearCache = (key: string) => {
  redisClient.del(key);
};
