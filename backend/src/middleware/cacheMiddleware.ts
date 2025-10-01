import { Request, Response, NextFunction } from 'express';
import { cacheService, CacheTTL } from '../services/cacheService';
import { logger } from '../utils/logger';

interface CacheOptions {
  ttl?: number;
  keyPrefix?: string;
  excludeQuery?: string[];
  cacheCondition?: (req: Request, res: Response) => boolean;
}

/**
 * Generate cache key from request
 */
function generateCacheKey(req: Request, options: CacheOptions): string {
  const prefix = options.keyPrefix || 'api';
  const path = req.path;
  const method = req.method;
  
  // Build query string excluding specified params
  const queryParams = { ...req.query };
  if (options.excludeQuery) {
    options.excludeQuery.forEach((param) => {
      delete queryParams[param];
    });
  }
  
  const queryString = Object.keys(queryParams).length > 0
    ? JSON.stringify(queryParams)
    : '';

  // Include user ID if authenticated
  const userId = req.user?.id || 'anonymous';

  return `${prefix}:${method}:${path}:${userId}:${queryString}`;
}

/**
 * Cache middleware factory
 */
export function cacheMiddleware(options: CacheOptions = {}) {
  const ttl = options.ttl || CacheTTL.MEDIUM;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = generateCacheKey(req, options);

    try {
      // Try to get from cache
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        logger.debug(`Cache hit: ${cacheKey}`);
        res.setHeader('X-Cache', 'HIT');
        return res.json(cached);
      }

      logger.debug(`Cache miss: ${cacheKey}`);
      res.setHeader('X-Cache', 'MISS');

      // Store original json function
      const originalJson = res.json.bind(res);

      // Override json function to cache response
      res.json = function (body: any) {
        // Check cache condition if provided
        if (options.cacheCondition && !options.cacheCondition(req, res)) {
          return originalJson(body);
        }

        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheService.set(cacheKey, body, ttl).catch((error) => {
            logger.error(`Failed to cache response for ${cacheKey}:`, error);
          });
        }

        return originalJson(body);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
}

/**
 * Cache invalidation middleware
 * Invalidates cache for specific patterns on POST/PUT/PATCH/DELETE
 */
export function cacheInvalidationMiddleware(patterns: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only invalidate on write operations
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return next();
    }

    // Store original json function
    const originalJson = res.json.bind(res);

    // Override json to invalidate after successful response
    res.json = function (body: any) {
      // Only invalidate on success
      if (res.statusCode >= 200 && res.statusCode < 300) {
        Promise.all(
          patterns.map((pattern) => cacheService.deletePattern(pattern))
        ).catch((error) => {
          logger.error('Cache invalidation error:', error);
        });
      }

      return originalJson(body);
    };

    next();
  };
}

/**
 * Conditional cache middleware - cache based on custom logic
 */
export function conditionalCache(
  condition: (req: Request) => boolean,
  ttl: number = CacheTTL.MEDIUM
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!condition(req)) {
      return next();
    }

    return cacheMiddleware({ ttl })(req, res, next);
  };
}

/**
 * Cache warming utility
 * Pre-populate cache with common queries
 */
export async function warmCache(
  url: string,
  data: any,
  ttl: number = CacheTTL.LONG
): Promise<void> {
  const key = `api:GET:${url}:anonymous:`;
  await cacheService.set(key, data, ttl);
  logger.info(`Cache warmed for: ${url}`);
}

/**
 * Bulk cache invalidation
 */
export async function invalidateCache(patterns: string[]): Promise<void> {
  for (const pattern of patterns) {
    const count = await cacheService.deletePattern(pattern);
    logger.info(`Invalidated ${count} cache entries for pattern: ${pattern}`);
  }
}

/**
 * Cache decorator for route handlers
 */
export function Cached(ttl: number = CacheTTL.MEDIUM) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const req = args[0] as Request;
      const res = args[1] as Response;

      if (req.method !== 'GET') {
        return originalMethod.apply(this, args);
      }

      const cacheKey = `controller:${target.constructor.name}:${propertyKey}:${
        req.user?.id || 'anonymous'
      }:${JSON.stringify(req.params)}:${JSON.stringify(req.query)}`;

      const cached = await cacheService.get(cacheKey);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(cached);
      }

      res.setHeader('X-Cache', 'MISS');

      const result = await originalMethod.apply(this, args);

      if (res.statusCode >= 200 && res.statusCode < 300) {
        await cacheService.set(cacheKey, result, ttl);
      }

      return result;
    };

    return descriptor;
  };
}

/**
 * Predefined cache configurations for common use cases
 */
export const CacheConfigs = {
  // Short-lived cache for frequently changing data
  shortLived: {
    ttl: CacheTTL.SHORT,
    keyPrefix: 'short',
  },

  // Medium cache for semi-static data
  medium: {
    ttl: CacheTTL.MEDIUM,
    keyPrefix: 'medium',
  },

  // Long-lived cache for static data
  longLived: {
    ttl: CacheTTL.LONG,
    keyPrefix: 'long',
  },

  // User-specific cache
  userSpecific: {
    ttl: CacheTTL.MEDIUM,
    keyPrefix: 'user',
  },

  // Public data cache (longer TTL)
  public: {
    ttl: CacheTTL.DAY,
    keyPrefix: 'public',
    cacheCondition: (req: Request) => !req.user,
  },
};
