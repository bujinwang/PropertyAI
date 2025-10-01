import Redis from 'ioredis';
import { logger } from '../utils/logger';

class CacheService {
  private redis: Redis | null = null;
  private isConnected = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        reconnectOnError: (err) => {
          const targetError = 'READONLY';
          if (err.message.includes(targetError)) {
            return true;
          }
          return false;
        },
      });

      this.redis.on('connect', () => {
        this.isConnected = true;
        logger.info('Redis connected successfully');
      });

      this.redis.on('error', (error) => {
        this.isConnected = false;
        logger.error('Redis connection error:', error);
      });

      this.redis.on('close', () => {
        this.isConnected = false;
        logger.warn('Redis connection closed');
      });
    } catch (error) {
      logger.error('Failed to initialize Redis:', error);
      this.redis = null;
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected || !this.redis) {
      return null;
    }

    try {
      const value = await this.redis.get(key);
      if (!value) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache with optional TTL (in seconds)
   */
  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      
      if (ttl) {
        await this.redis.setex(key, ttl, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
      
      return true;
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      return false;
    }

    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    if (!this.isConnected || !this.redis) {
      return 0;
    }

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }
      
      await this.redis.del(...keys);
      return keys.length;
    } catch (error) {
      logger.error(`Cache delete pattern error for ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      return false;
    }

    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Set expiration time for a key
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      return false;
    }

    try {
      await this.redis.expire(key, ttl);
      return true;
    } catch (error) {
      logger.error(`Cache expire error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get or set pattern - get from cache, or compute and cache if not found
   */
  async getOrSet<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Compute value
    const value = await fn();

    // Cache the result (don't await to avoid blocking)
    this.set(key, value, ttl).catch((error) => {
      logger.error(`Failed to cache result for key ${key}:`, error);
    });

    return value;
  }

  /**
   * Increment counter
   */
  async increment(key: string, amount: number = 1): Promise<number> {
    if (!this.isConnected || !this.redis) {
      return 0;
    }

    try {
      return await this.redis.incrby(key, amount);
    } catch (error) {
      logger.error(`Cache increment error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Get multiple values
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (!this.isConnected || !this.redis || keys.length === 0) {
      return keys.map(() => null);
    }

    try {
      const values = await this.redis.mget(...keys);
      return values.map((value) => {
        if (!value) return null;
        try {
          return JSON.parse(value) as T;
        } catch {
          return null;
        }
      });
    } catch (error) {
      logger.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  }

  /**
   * Set multiple values
   */
  async mset(entries: { key: string; value: any; ttl?: number }[]): Promise<boolean> {
    if (!this.isConnected || !this.redis || entries.length === 0) {
      return false;
    }

    try {
      const pipeline = this.redis.pipeline();
      
      for (const entry of entries) {
        const serialized = JSON.stringify(entry.value);
        if (entry.ttl) {
          pipeline.setex(entry.key, entry.ttl, serialized);
        } else {
          pipeline.set(entry.key, serialized);
        }
      }
      
      await pipeline.exec();
      return true;
    } catch (error) {
      logger.error('Cache mset error:', error);
      return false;
    }
  }

  /**
   * Add to set
   */
  async sadd(key: string, ...members: string[]): Promise<number> {
    if (!this.isConnected || !this.redis) {
      return 0;
    }

    try {
      return await this.redis.sadd(key, ...members);
    } catch (error) {
      logger.error(`Cache sadd error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Get set members
   */
  async smembers(key: string): Promise<string[]> {
    if (!this.isConnected || !this.redis) {
      return [];
    }

    try {
      return await this.redis.smembers(key);
    } catch (error) {
      logger.error(`Cache smembers error for key ${key}:`, error);
      return [];
    }
  }

  /**
   * Check if member exists in set
   */
  async sismember(key: string, member: string): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      return false;
    }

    try {
      const result = await this.redis.sismember(key, member);
      return result === 1;
    } catch (error) {
      logger.error(`Cache sismember error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Flush all cache
   */
  async flush(): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      return false;
    }

    try {
      await this.redis.flushdb();
      logger.info('Cache flushed successfully');
      return true;
    } catch (error) {
      logger.error('Cache flush error:', error);
      return false;
    }
  }

  /**
   * Get cache stats
   */
  async getStats(): Promise<{
    connected: boolean;
    usedMemory?: string;
    keys?: number;
  }> {
    if (!this.isConnected || !this.redis) {
      return { connected: false };
    }

    try {
      const info = await this.redis.info('memory');
      const dbSize = await this.redis.dbsize();
      
      // Parse used_memory from info
      const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
      const usedMemory = memoryMatch ? memoryMatch[1] : 'unknown';

      return {
        connected: true,
        usedMemory,
        keys: dbSize,
      };
    } catch (error) {
      logger.error('Failed to get cache stats:', error);
      return { connected: this.isConnected };
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.isConnected = false;
      logger.info('Redis connection closed');
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();

// Export cache key builders
export const CacheKeys = {
  property: (id: string) => `property:${id}`,
  properties: (page: number, limit: number) => `properties:${page}:${limit}`,
  unit: (id: string) => `unit:${id}`,
  tenant: (id: string) => `tenant:${id}`,
  maintenance: (id: string) => `maintenance:${id}`,
  payment: (id: string) => `payment:${id}`,
  user: (id: string) => `user:${id}`,
  analytics: (propertyId: string, type: string) => `analytics:${propertyId}:${type}`,
  report: (id: string) => `report:${id}`,
} as const;

// Cache TTL constants (in seconds)
export const CacheTTL = {
  SHORT: 60,           // 1 minute
  MEDIUM: 300,         // 5 minutes
  LONG: 3600,          // 1 hour
  DAY: 86400,          // 24 hours
  WEEK: 604800,        // 7 days
} as const;
