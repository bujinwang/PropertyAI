import { Request, Response, NextFunction } from 'express';

interface CacheEntry {
  value: any;
  expiry: number;
}

const cache = new Map<string, CacheEntry>();

export const getCache = (key: string) => {
  const entry = cache.get(key);
  if (!entry) return null;
  
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return null;
  }
  
  return entry.value;
};

export const setCache = (key: string, value: any, ttl: number) => {
  const expiry = Date.now() + (ttl * 1000);
  cache.set(key, { value, expiry });
};

export const cacheMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const key = `cache:${req.method}:${req.originalUrl}`;
  const cached = getCache(key);
  
  if (cached) {
    return res.json(cached);
  }
  
  const originalJson = res.json.bind(res);
  res.json = function(body: any) {
    if (res.statusCode === 200) {
      setCache(key, body, 300); // Cache for 5 minutes by default
    }
    return originalJson(body);
  };
  
  next();
};

export const clearCache = (key: string) => {
  cache.delete(key);
};

export const clearAllCache = () => {
  cache.clear();
};
