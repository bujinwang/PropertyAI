import { Request, Response } from 'express';
import { cacheService, CacheKeys, CacheTTL } from '../services/cacheService';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

/**
 * Example controller demonstrating cache usage patterns
 */
export class CacheExampleController {
  /**
   * Example 1: Manual cache management
   */
  async getPropertyWithManualCache(req: Request, res: Response) {
    const { id } = req.params;
    const cacheKey = CacheKeys.property(id);

    try {
      // Try cache first
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        logger.debug(`Cache hit for property ${id}`);
        return res.json({
          success: true,
          data: cached,
          cached: true,
        });
      }

      // Cache miss - fetch from database
      logger.debug(`Cache miss for property ${id}`);
      const property = await prisma.property.findUnique({
        where: { id },
        include: {
          units: true,
          amenities: true,
        },
      });

      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found',
        });
      }

      // Cache for 5 minutes
      await cacheService.set(cacheKey, property, CacheTTL.MEDIUM);

      return res.json({
        success: true,
        data: property,
        cached: false,
      });
    } catch (error) {
      logger.error('Error fetching property:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Example 2: Get-or-set pattern (recommended)
   */
  async getPropertyWithGetOrSet(req: Request, res: Response) {
    const { id } = req.params;
    const cacheKey = CacheKeys.property(id);

    try {
      const property = await cacheService.getOrSet(
        cacheKey,
        async () => {
          return await prisma.property.findUnique({
            where: { id },
            include: {
              units: true,
              amenities: true,
            },
          });
        },
        CacheTTL.MEDIUM
      );

      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found',
        });
      }

      return res.json({
        success: true,
        data: property,
      });
    } catch (error) {
      logger.error('Error fetching property:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Example 3: Cache invalidation on update
   */
  async updateProperty(req: Request, res: Response) {
    const { id } = req.params;
    const data = req.body;

    try {
      const property = await prisma.property.update({
        where: { id },
        data,
      });

      // Invalidate specific property cache
      await cacheService.delete(CacheKeys.property(id));

      // Invalidate all property list caches
      await cacheService.deletePattern('properties:*');

      // Invalidate analytics cache for this property
      await cacheService.deletePattern(`analytics:${id}:*`);

      logger.info(`Cache invalidated for property ${id}`);

      return res.json({
        success: true,
        data: property,
      });
    } catch (error) {
      logger.error('Error updating property:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Example 4: Batch operations with multiple cache keys
   */
  async getPropertiesBatch(req: Request, res: Response) {
    const { ids } = req.query;
    
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({
        success: false,
        message: 'ids query parameter must be an array',
      });
    }

    try {
      // Generate cache keys for all requested properties
      const cacheKeys = ids.map((id) => CacheKeys.property(id));

      // Batch get from cache
      const cachedProperties = await cacheService.mget(cacheKeys);

      // Identify which properties need to be fetched
      const missingIds: string[] = [];
      const results: any[] = [];

      cachedProperties.forEach((cached, index) => {
        if (cached) {
          results[index] = cached;
        } else {
          missingIds.push(ids[index]);
        }
      });

      // Fetch missing properties from database
      if (missingIds.length > 0) {
        const fetchedProperties = await prisma.property.findMany({
          where: {
            id: { in: missingIds },
          },
          include: {
            units: true,
            amenities: true,
          },
        });

        // Cache the fetched properties
        const cacheEntries = fetchedProperties.map((property) => ({
          key: CacheKeys.property(property.id),
          value: property,
          ttl: CacheTTL.MEDIUM,
        }));

        await cacheService.mset(cacheEntries);

        // Add fetched properties to results
        fetchedProperties.forEach((property) => {
          const index = ids.indexOf(property.id);
          if (index !== -1) {
            results[index] = property;
          }
        });
      }

      return res.json({
        success: true,
        data: results.filter(Boolean), // Remove nulls
        cached: cachedProperties.filter(Boolean).length,
        fetched: missingIds.length,
      });
    } catch (error) {
      logger.error('Error fetching properties batch:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Example 5: Caching analytics/computed data
   */
  async getPropertyAnalytics(req: Request, res: Response) {
    const { id } = req.params;
    const { type = 'occupancy' } = req.query;
    const cacheKey = CacheKeys.analytics(id, type as string);

    try {
      const analytics = await cacheService.getOrSet(
        cacheKey,
        async () => {
          // Expensive computation here
          const property = await prisma.property.findUnique({
            where: { id },
            include: {
              units: {
                include: {
                  lease: true,
                },
              },
            },
          });

          if (!property) {
            return null;
          }

          // Calculate occupancy
          const totalUnits = property.units.length;
          const occupiedUnits = property.units.filter(
            (unit) => unit.lease?.status === 'ACTIVE'
          ).length;

          return {
            propertyId: id,
            type,
            metrics: {
              totalUnits,
              occupiedUnits,
              vacantUnits: totalUnits - occupiedUnits,
              occupancyRate: totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0,
            },
            calculatedAt: new Date().toISOString(),
          };
        },
        CacheTTL.LONG // Cache analytics for 1 hour
      );

      if (!analytics) {
        return res.status(404).json({
          success: false,
          message: 'Property not found',
        });
      }

      return res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      logger.error('Error fetching analytics:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Example 6: Rate limiting with cache
   */
  async checkRateLimit(req: Request, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const key = `ratelimit:api:${userId}`;
    const limit = 100; // 100 requests per minute
    const window = 60; // 60 seconds

    try {
      // Increment counter
      const count = await cacheService.increment(key);

      // Set expiration on first request
      if (count === 1) {
        await cacheService.expire(key, window);
      }

      // Check if limit exceeded
      if (count > limit) {
        return res.status(429).json({
          success: false,
          message: 'Rate limit exceeded',
          retryAfter: window,
        });
      }

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - count));
      res.setHeader('X-RateLimit-Reset', Date.now() + window * 1000);

      return res.json({
        success: true,
        message: 'Request allowed',
        remaining: limit - count,
      });
    } catch (error) {
      logger.error('Rate limit check error:', error);
      // Allow request on cache failure
      return res.json({
        success: true,
        message: 'Request allowed (cache unavailable)',
      });
    }
  }

  /**
   * Example 7: Cache statistics endpoint
   */
  async getCacheStats(req: Request, res: Response) {
    try {
      const stats = await cacheService.getStats();

      return res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error fetching cache stats:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Example 8: Manual cache flush (admin only)
   */
  async flushCache(req: Request, res: Response) {
    try {
      await cacheService.flush();

      logger.info('Cache flushed by admin');

      return res.json({
        success: true,
        message: 'Cache flushed successfully',
      });
    } catch (error) {
      logger.error('Error flushing cache:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}

export const cacheExampleController = new CacheExampleController();
