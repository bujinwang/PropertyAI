/**
 * Performance Monitoring Service for Epic 21.5.1
 * Monitors database queries, cache performance, and system metrics
 */

const { sequelize, cacheService } = require('../config/database');

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      queries: [],
      cache: {
        hits: 0,
        misses: 0,
        hitRate: 0,
      },
      alerts: [],
      slowQueries: [],
    };

    this.alertThresholds = {
      queryTime: 500, // ms
      cacheHitRate: 80, // percentage
      errorRate: 5, // percentage
    };

    this.monitoringEnabled = process.env.NODE_ENV === 'production' ||
                           process.env.PERFORMANCE_MONITORING === 'true';
  }

  /**
   * Initialize performance monitoring
   */
  async initialize() {
    if (!this.monitoringEnabled) {
      console.log('📊 Performance monitoring disabled (not production or explicitly disabled)');
      return;
    }

    console.log('📊 Initializing performance monitoring...');

    // Hook into Sequelize query execution
    this.setupSequelizeHooks();

    // Start periodic metrics collection
    this.startMetricsCollection();

    // Setup alert checking
    this.startAlertMonitoring();

    console.log('✅ Performance monitoring initialized');
  }

  /**
   * Setup Sequelize hooks for query monitoring
   */
  setupSequelizeHooks() {
    sequelize.addHook('beforeQuery', (options) => {
      options.startTime = Date.now();
    });

    sequelize.addHook('afterQuery', (options, result) => {
      const executionTime = Date.now() - options.startTime;

      this.recordQuery({
        sql: options.sql,
        executionTime,
        timestamp: new Date(),
        type: options.type,
        table: this.extractTableName(options.sql),
        parameters: options.bind || [],
      });

      // Check for slow queries
      if (executionTime > this.alertThresholds.queryTime) {
        this.recordSlowQuery({
          sql: options.sql,
          executionTime,
          timestamp: new Date(),
          type: options.type,
        });
      }
    });
  }

  /**
   * Record query execution
   */
  recordQuery(queryData) {
    this.metrics.queries.push(queryData);

    // Keep only last 1000 queries to prevent memory issues
    if (this.metrics.queries.length > 1000) {
      this.metrics.queries = this.metrics.queries.slice(-1000);
    }
  }

  /**
   * Record slow query
   */
  recordSlowQuery(queryData) {
    this.metrics.slowQueries.push(queryData);

    // Alert for slow queries
    this.createAlert({
      type: 'slow_query',
      severity: 'medium',
      message: `Slow query detected: ${queryData.executionTime}ms`,
      details: {
        sql: queryData.sql,
        executionTime: queryData.executionTime,
        timestamp: queryData.timestamp,
      },
    });

    console.warn(`🐌 Slow query detected: ${queryData.executionTime}ms - ${queryData.sql.substring(0, 100)}...`);
  }

  /**
   * Record cache operation
   */
  recordCacheOperation(operation, success = true) {
    if (operation === 'hit') {
      this.metrics.cache.hits++;
    } else if (operation === 'miss') {
      this.metrics.cache.misses++;
    }

    this.updateCacheHitRate();
  }

  /**
   * Update cache hit rate
   */
  updateCacheHitRate() {
    const total = this.metrics.cache.hits + this.metrics.cache.misses;
    if (total > 0) {
      this.metrics.cache.hitRate = Math.round((this.metrics.cache.hits / total) * 100);
    }
  }

  /**
   * Create performance alert
   */
  createAlert(alertData) {
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...alertData,
    };

    this.metrics.alerts.push(alert);

    // Keep only last 100 alerts
    if (this.metrics.alerts.length > 100) {
      this.metrics.alerts = this.metrics.alerts.slice(-100);
    }

    // Log critical alerts
    if (alert.severity === 'critical') {
      console.error('🚨 CRITICAL PERFORMANCE ALERT:', alert.message);
    } else if (alert.severity === 'high') {
      console.error('⚠️ HIGH PRIORITY ALERT:', alert.message);
    }

    return alert;
  }

  /**
   * Start periodic metrics collection
   */
  startMetricsCollection() {
    // Collect metrics every 5 minutes
    setInterval(() => {
      this.collectSystemMetrics();
    }, 5 * 60 * 1000);

    // Clean up old metrics every hour
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 60 * 60 * 1000);
  }

  /**
   * Collect system metrics
   */
  async collectSystemMetrics() {
    try {
      // Database connection pool stats
      const poolStats = await this.getDatabasePoolStats();

      // Cache stats
      const cacheStats = await cacheService.getStats();

      // Memory usage
      const memoryUsage = process.memoryUsage();

      const metrics = {
        timestamp: new Date(),
        database: poolStats,
        cache: cacheStats,
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        },
      };

      // Store metrics (in production, this would go to a time-series database)
      console.log('📊 System metrics collected:', {
        dbConnections: poolStats?.size || 'N/A',
        cacheHitRate: cacheStats?.cacheHitRate || 'N/A',
        memoryMB: metrics.memory.heapUsed,
      });

    } catch (error) {
      console.error('Error collecting system metrics:', error.message);
    }
  }

  /**
   * Get database connection pool statistics
   */
  async getDatabasePoolStats() {
    try {
      // This would vary based on your database setup
      // For Sequelize, we can get some basic stats
      return {
        size: sequelize.connectionManager.pool?.size || 0,
        available: sequelize.connectionManager.pool?.available || 0,
        using: sequelize.connectionManager.pool?.using || 0,
        waiting: sequelize.connectionManager.pool?.waiting || 0,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Start alert monitoring
   */
  startAlertMonitoring() {
    // Check for alerts every minute
    setInterval(() => {
      this.checkPerformanceAlerts();
    }, 60 * 1000);
  }

  /**
   * Check for performance alerts
   */
  checkPerformanceAlerts() {
    // Check cache hit rate
    if (this.metrics.cache.hitRate < this.alertThresholds.cacheHitRate) {
      this.createAlert({
        type: 'cache_performance',
        severity: 'medium',
        message: `Cache hit rate below threshold: ${this.metrics.cache.hitRate}% (target: ${this.alertThresholds.cacheHitRate}%)`,
        details: {
          currentHitRate: this.metrics.cache.hitRate,
          threshold: this.alertThresholds.cacheHitRate,
        },
      });
    }

    // Check for recent slow queries
    const recentSlowQueries = this.metrics.slowQueries.filter(
      q => Date.now() - q.timestamp.getTime() < 10 * 60 * 1000 // Last 10 minutes
    );

    if (recentSlowQueries.length > 5) {
      this.createAlert({
        type: 'query_performance',
        severity: 'high',
        message: `${recentSlowQueries.length} slow queries detected in the last 10 minutes`,
        details: {
          slowQueryCount: recentSlowQueries.length,
          timeWindow: '10 minutes',
        },
      });
    }
  }

  /**
   * Clean up old metrics
   */
  cleanupOldMetrics() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);

    // Clean up old queries (keep last 24 hours)
    this.metrics.queries = this.metrics.queries.filter(
      q => q.timestamp.getTime() > oneDayAgo
    );

    // Clean up old slow queries (keep last hour)
    this.metrics.slowQueries = this.metrics.slowQueries.filter(
      q => q.timestamp.getTime() > oneHourAgo
    );

    console.log('🧹 Cleaned up old performance metrics');
  }

  /**
   * Extract table name from SQL query
   */
  extractTableName(sql) {
    try {
      // Simple regex to extract table name from common SQL patterns
      const patterns = [
        /FROM\s+["`]?(\w+)["`]?/i,
        /UPDATE\s+["`]?(\w+)["`]?/i,
        /INSERT\s+INTO\s+["`]?(\w+)["`]?/i,
        /DELETE\s+FROM\s+["`]?(\w+)["`]?/i,
      ];

      for (const pattern of patterns) {
        const match = sql.match(pattern);
        if (match) {
          return match[1];
        }
      }

      return 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Get performance report
   */
  getPerformanceReport(timeRange = '1h') {
    const now = Date.now();
    const timeRanges = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
    };

    const range = timeRanges[timeRange] || timeRanges['1h'];
    const startTime = now - range;

    // Filter metrics for time range
    const recentQueries = this.metrics.queries.filter(
      q => q.timestamp.getTime() > startTime
    );

    const recentSlowQueries = this.metrics.slowQueries.filter(
      q => q.timestamp.getTime() > startTime
    );

    const recentAlerts = this.metrics.alerts.filter(
      a => a.timestamp.getTime() > startTime
    );

    // Calculate statistics
    const avgQueryTime = recentQueries.length > 0
      ? recentQueries.reduce((sum, q) => sum + q.executionTime, 0) / recentQueries.length
      : 0;

    const queryCountByTable = recentQueries.reduce((acc, q) => {
      acc[q.table] = (acc[q.table] || 0) + 1;
      return acc;
    }, {});

    return {
      timeRange,
      summary: {
        totalQueries: recentQueries.length,
        averageQueryTime: Math.round(avgQueryTime * 100) / 100,
        slowQueries: recentSlowQueries.length,
        alerts: recentAlerts.length,
        cacheHitRate: this.metrics.cache.hitRate,
      },
      topTables: Object.entries(queryCountByTable)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5),
      recentAlerts: recentAlerts.slice(-10),
      performance: {
        status: avgQueryTime < 100 ? 'excellent' :
                avgQueryTime < 300 ? 'good' :
                avgQueryTime < 500 ? 'fair' : 'poor',
        recommendations: this.generateRecommendations(avgQueryTime, this.metrics.cache.hitRate),
      },
    };
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations(avgQueryTime, cacheHitRate) {
    const recommendations = [];

    if (avgQueryTime > 500) {
      recommendations.push('Consider adding more database indexes for frequently queried columns');
      recommendations.push('Review and optimize complex JOIN operations');
    }

    if (cacheHitRate < 80) {
      recommendations.push('Increase cache TTL for frequently accessed data');
      recommendations.push('Implement cache warming for common queries');
    }

    if (this.metrics.slowQueries.length > 10) {
      recommendations.push('Review slow query patterns and consider query optimization');
    }

    return recommendations;
  }

  /**
   * Health check
   */
  async healthCheck() {
    const report = this.getPerformanceReport('1h');

    return {
      status: report.performance.status === 'excellent' || report.performance.status === 'good'
        ? 'healthy' : 'degraded',
      metrics: report.summary,
      recommendations: report.performance.recommendations,
    };
  }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor();

module.exports = performanceMonitor;