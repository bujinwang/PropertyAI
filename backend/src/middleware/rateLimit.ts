import { Request, Response, NextFunction } from 'express';
import redis from 'redis';
import { promisify } from 'util';
import { config } from '../config/config';

// Create Redis client for storing rate limit data
const redisClient = redis.createClient({
  url: config.redis.url,
  password: config.redis.password,
});

// Promisify Redis methods for async/await usage
const getAsync = promisify(redisClient.get).bind(redisClient);
const setAsync = promisify(redisClient.set).bind(redisClient);
const incrAsync = promisify(redisClient.incr).bind(redisClient);
const expireAsync = promisify(redisClient.expire).bind(redisClient);

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

interface RateLimitOptions {
  // Maximum number of requests allowed in the window
  max: number;
  // Time window in seconds
  windowMs: number;
  // Message to send when rate limit is exceeded
  message?: string;
  // Custom key generator function
  keyGenerator?: (req: Request) => string;
  // Skip rate limiting for certain requests
  skip?: (req: Request) => boolean;
  // Headers to include in the response
  headers?: boolean;
}

/**
 * Creates a rate limiting middleware with the specified options
 */
export const rateLimit = (options: RateLimitOptions) => {
  const {
    max = 5,
    windowMs = 60 * 1000, // 1 minute default
    message = 'Too many requests, please try again later.',
    keyGenerator = (req: Request): string => {
      // Default key is IP address and route
      return `ratelimit:${req.ip}:${req.path}`;
    },
    skip = (): boolean => false,
    headers = true,
  } = options;

  // Convert windowMs to seconds for Redis expiry
  const windowSeconds = Math.ceil(windowMs / 1000);

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Skip rate limiting if specified
    if (skip(req)) {
      return next();
    }

    const key = keyGenerator(req);
    
    try {
      // Get current count
      let current = await getAsync(key);
      
      // Initialize if not exists
      if (!current) {
        await setAsync(key, '0');
        await expireAsync(key, windowSeconds);
        current = '0';
      }
      
      // Increment count
      const count = await incrAsync(key);
      
      // Set Redis expiry if it's the first request
      if (count === 1) {
        await expireAsync(key, windowSeconds);
      }
      
      // Add headers if enabled
      if (headers) {
        res.setHeader('X-RateLimit-Limit', max.toString());
        res.setHeader('X-RateLimit-Remaining', Math.max(0, max - count).toString());
        
        // Get TTL for reset header
        const ttl = await promisify(redisClient.ttl).bind(redisClient)(key);
        res.setHeader('X-RateLimit-Reset', (Date.now() + ttl * 1000).toString());
      }
      
      // Allow the request if under the limit
      if (count <= max) {
        return next();
      }
      
      // Rate limit exceeded
      res.status(429).json({
        message,
        retryAfter: windowSeconds,
      });
    } catch (err) {
      console.error('Rate limit error:', err);
      // Don't block the request if Redis fails
      return next();
    }
  };
};

/**
 * Specialized rate limiter for login attempts
 * More strict limits for login attempts to prevent brute force attacks
 */
export const loginRateLimit = rateLimit({
  max: 5, // 5 login attempts
  windowMs: 15 * 60 * 1000, // per 15 minutes
  message: 'Too many login attempts. Please try again later.',
  keyGenerator: (req: Request): string => {
    // Use email or IP if email not available
    const email = req.body.email || '';
    return `login:${email || req.ip}`;
  },
});

/**
 * Specialized rate limiter for password reset requests
 */
export const passwordResetRateLimit = rateLimit({
  max: 3, // 3 reset requests
  windowMs: 60 * 60 * 1000, // per hour
  message: 'Too many password reset requests. Please try again later.',
  keyGenerator: (req: Request): string => {
    // Use email or IP if email not available
    const email = req.body.email || '';
    return `pwreset:${email || req.ip}`;
  },
});

/**
 * General API rate limiter for all routes
 * Less strict than login/password reset limiters
 */
export const apiRateLimit = rateLimit({
  max: 100, // 100 requests
  windowMs: 60 * 1000, // per minute
  message: 'Too many requests. Please try again later.',
});

export default {
  rateLimit,
  loginRateLimit,
  passwordResetRateLimit,
  apiRateLimit,
};
