/**
 * Cache Service for Epic 21.5.1 Performance Optimization
 * Implements Redis-based caching for query results and API responses
 */

const Redis = require('ioredis');
const crypto = require('crypto');

class CacheService {
  constructor() {
    this.redis = null;
    this.isConnected = false;
    this.defaultTTL = 300; // 5 minutes default TTL
    this.cachePrefix = 'propertyai:cache:';
  }

  /**
   * Initialize Redis connection
   */
  async initialize() {
    try {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: process.env.REDIS_DB || 0,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        reconnectOnError: (err) => {
          console.warn('Redis reconnect on error:', err.message);
          return err.message.includes('READONLY');
        },
      });

      this.redis.on('connect', () => {
        console.log('✅ Redis cache service connected');
        this.isConnected = true;
      });

      this.redis.on('error', (err) => {
        console.error('❌ Redis cache service error:', err.message);
        this.isConnected = false;
      });

      this.redis.on('close', () => {
        console.log('📡 Redis cache service connection closed');
        this.isConnected = false;
      });

      await this.redis.connect();
    } catch (error) {
      console.error('Failed to initialize Redis cache service:', error.message);
      // Continue without caching if Redis is unavailable
      this.isConnected = false;
    }
  }

  /**
   * Generate cache key from query parameters
   */
  generateCacheKey(queryType, params = {}) {
    const keyData = {
      type: queryType,
      params: this.normalizeParams(params),
      timestamp: Math.floor(Date.now() / (1000 * 60 * 5)), // 5-minute windows for time-based invalidation
    };

    const keyString = JSON.stringify(keyData);
    const hash = crypto.createHash('md5').update(keyString).digest('hex');
    return `${this.cachePrefix}${queryType}:${hash}`;
  }

  /**
   * Normalize parameters for consistent cache keys
   */
  normalizeParams(params) {
    const normalized = { ...params };

    // Remove sensitive data from cache keys
    delete normalized.apiKey;
    delete normalized.token;
    delete normalized.password;

    // Sort object keys for consistent hashing
    return Object.keys(normalized)
      .sort()
      .reduce((result, key) => {
        result[key] = normalized[key];
        return result;
      }, {});
  }

  /**
   * Get cached data
   */
  async get(cacheKey) {
    if (!this.isConnected || !this.redis) {
      return null;
    }

    try {
      const cachedData = await this.redis.get(cacheKey);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        console.log(`✅ Cache hit for key: ${cacheKey}`);
        return parsed;
      }
      console.log(`❌ Cache miss for key: ${cacheKey}`);
      return null;
    } catch (error) {
      console.error('Error retrieving from cache:', error.message);
      return null;
    }
  }

  /**
   * Set cached data with TTL
   */
  async set(cacheKey, data, ttl = this.defaultTTL) {
    if (!this.isConnected || !this.redis) {
      return false;
    }

    try {
      const serializedData = JSON.stringify(data);
      await this.redis.setex(cacheKey, ttl, serializedData);
      console.log(`💾 Cached data for key: ${cacheKey} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      console.error('Error setting cache:', error.message);
      return false;
    }
  }

  /**
   * Delete cached data
   */
  async delete(cacheKey) {
    if (!this.isConnected || !this.redis) {
      return false;
    }

    try {
      await this.redis.del(cacheKey);
      console.log(`🗑️ Deleted cache key: ${cacheKey}`);
      return true;
    } catch (error) {
      console.error('Error deleting from cache:', error.message);
      return false;
    }
  }

  /**
   * Delete cache keys by pattern
   */
  async deleteByPattern(pattern) {
    if (!this.isConnected || !this.redis) {
      return 0;
    }

    try {
      const keys = await this.redis.keys(`${this.cachePrefix}${pattern}`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        console.log(`🗑️ Deleted ${keys.length} cache keys matching pattern: ${pattern}`);
        return keys.length;
      }
      return 0;
    } catch (error) {
      console.error('Error deleting cache by pattern:', error.message);
      return 0;
    }
  }

  /**
   * Cache query results with automatic key generation
   */
  async cacheQueryResult(queryType, params, queryFunction, ttl = this.defaultTTL) {
    const cacheKey = this.generateCacheKey(queryType, params);

    // Try to get from cache first
    const cachedResult = await this.get(cacheKey);
    if (cachedResult !== null) {
      return cachedResult;
    }

    // Execute query if not cached
    try {
      const result = await queryFunction();
      // Cache the result
      await this.set(cacheKey, result, ttl);
      return result;
    } catch (error) {
      console.error('Error executing cached query:', error.message);
      throw error;
    }
  }

  /**
   * Invalidate cache for specific data types
   */
  async invalidateDataType(dataType, identifiers = []) {
    if (!this.isConnected) return;

    const patterns = [];

    switch (dataType) {
      case 'property':
        patterns.push('property:*');
        if (identifiers.length > 0) {
          identifiers.forEach(id => {
            patterns.push(`*:property_id:${id}:*`);
            patterns.push(`*:propertyId:${id}:*`);
          });
        }
        break;

      case 'maintenance':
        patterns.push('maintenance:*');
        if (identifiers.length > 0) {
          identifiers.forEach(id => {
            patterns.push(`*:maintenance:*${id}*`);
          });
        }
        break;

      case 'market_data':
        patterns.push('market:*');
        patterns.push('market_data:*');
        break;

      case 'tenant':
        patterns.push('tenant:*');
        break;

      case 'dashboard':
        patterns.push('dashboard:*');
        break;

      default:
        patterns.push(`${dataType}:*`);
    }

    let totalDeleted = 0;
    for (const pattern of patterns) {
      totalDeleted += await this.deleteByPattern(pattern);
    }

    if (totalDeleted > 0) {
      console.log(`🚫 Invalidated ${totalDeleted} cache entries for ${dataType}`);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    if (!this.isConnected || !this.redis) {
      return { connected: false };
    }

    try {
      const info = await this.redis.info();
      const keys = await this.redis.keys(`${this.cachePrefix}*`);

      return {
        connected: true,
        totalKeys: keys.length,
        redisInfo: this.parseRedisInfo(info),
        cacheHitRate: await this.calculateHitRate(),
      };
    } catch (error) {
      console.error('Error getting cache stats:', error.message);
      return { connected: false, error: error.message };
    }
  }

  /**
   * Parse Redis INFO command output
   */
  parseRedisInfo(info) {
    const lines = info.split('\n');
    const parsed = {};

    lines.forEach(line => {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        parsed[key] = value;
      }
    });

    return {
      version: parsed.redis_version,
      uptime: parsed.uptime_in_seconds,
      memory: parsed.used_memory_human,
      connections: parsed.connected_clients,
      hits: parsed.keyspace_hits,
      misses: parsed.keyspace_misses,
    };
  }

  /**
   * Calculate cache hit rate (simplified)
   */
  async calculateHitRate() {
    try {
      const info = await this.redis.info();
      const hits = parseInt(info.match(/keyspace_hits:(\d+)/)?.[1] || '0');
      const misses = parseInt(info.match(/keyspace_misses:(\d+)/)?.[1] || '0');

      const total = hits + misses;
      return total > 0 ? Math.round((hits / total) * 100) : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    if (!this.redis) {
      return { status: 'disconnected', message: 'Redis client not initialized' };
    }

    try {
      await this.redis.ping();
      return { status: 'healthy', message: 'Cache service is operational' };
    } catch (error) {
      return { status: 'unhealthy', message: error.message };
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    if (this.redis) {
      console.log('Shutting down cache service...');
      await this.redis.quit();
      this.isConnected = false;
    }
  }
}

// Singleton instance
const cacheService = new CacheService();

module.exports = cacheService;