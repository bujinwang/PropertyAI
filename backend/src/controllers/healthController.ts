import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { cacheService } from '../services/cacheService';
import { logger } from '../utils/logger';
import os from 'os';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    database: ServiceHealth;
    cache: ServiceHealth;
    mlApi?: ServiceHealth;
  };
  system: SystemMetrics;
}

interface ServiceHealth {
  status: 'up' | 'down' | 'degraded';
  latency?: number;
  message?: string;
  details?: any;
}

interface SystemMetrics {
  memory: {
    total: number;
    free: number;
    used: number;
    usagePercent: number;
  };
  cpu: {
    cores: number;
    loadAverage: number[];
  };
  process: {
    memoryUsage: NodeJS.MemoryUsage;
    uptime: number;
  };
}

export class HealthController {
  /**
   * Basic health check - fast, minimal checks
   */
  async getHealth(req: Request, res: Response) {
    try {
      const health: HealthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        services: {
          database: await this.checkDatabase(),
          cache: await this.checkCache(),
        },
        system: this.getSystemMetrics(),
      };

      // Check ML API if configured
      if (process.env.ML_API_URL) {
        health.services.mlApi = await this.checkMlApi();
      }

      // Determine overall status
      const serviceStatuses = Object.values(health.services).map((s) => s.status);
      if (serviceStatuses.some((s) => s === 'down')) {
        health.status = 'unhealthy';
      } else if (serviceStatuses.some((s) => s === 'degraded')) {
        health.status = 'degraded';
      }

      const statusCode = health.status === 'healthy' ? 200 : 503;

      return res.status(statusCode).json({
        success: health.status === 'healthy',
        data: health,
      });
    } catch (error) {
      logger.error('Health check error:', error);
      return res.status(503).json({
        success: false,
        status: 'unhealthy',
        message: 'Health check failed',
      });
    }
  }

  /**
   * Detailed health check - comprehensive diagnostics
   */
  async getDetailedHealth(req: Request, res: Response) {
    try {
      const startTime = Date.now();

      const health: any = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        services: {
          database: await this.checkDatabaseDetailed(),
          cache: await this.checkCacheDetailed(),
        },
        system: this.getDetailedSystemMetrics(),
        metrics: await this.getMetrics(),
      };

      // Check ML API if configured
      if (process.env.ML_API_URL) {
        health.services.mlApi = await this.checkMlApiDetailed();
      }

      // Determine overall status
      const serviceStatuses = Object.values(health.services).map((s: any) => s.status);
      if (serviceStatuses.some((s) => s === 'down')) {
        health.status = 'unhealthy';
      } else if (serviceStatuses.some((s) => s === 'degraded')) {
        health.status = 'degraded';
      }

      health.responseTime = Date.now() - startTime;

      const statusCode = health.status === 'healthy' ? 200 : 503;

      return res.status(statusCode).json({
        success: health.status === 'healthy',
        data: health,
      });
    } catch (error) {
      logger.error('Detailed health check error:', error);
      return res.status(503).json({
        success: false,
        status: 'unhealthy',
        message: 'Detailed health check failed',
      });
    }
  }

  /**
   * Readiness probe - is the service ready to accept traffic?
   */
  async getReadiness(req: Request, res: Response) {
    try {
      // Check critical services
      const dbHealth = await this.checkDatabase();
      
      if (dbHealth.status === 'down') {
        return res.status(503).json({
          success: false,
          ready: false,
          message: 'Database not ready',
        });
      }

      return res.status(200).json({
        success: true,
        ready: true,
        message: 'Service is ready',
      });
    } catch (error) {
      logger.error('Readiness check error:', error);
      return res.status(503).json({
        success: false,
        ready: false,
        message: 'Service not ready',
      });
    }
  }

  /**
   * Liveness probe - is the service alive?
   */
  async getLiveness(req: Request, res: Response) {
    // Simple liveness check - if we can respond, we're alive
    return res.status(200).json({
      success: true,
      alive: true,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Check database health
   */
  private async checkDatabase(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;

      return {
        status: latency < 100 ? 'up' : 'degraded',
        latency,
      };
    } catch (error) {
      logger.error('Database health check failed:', error);
      return {
        status: 'down',
        message: 'Database connection failed',
      };
    }
  }

  /**
   * Check database health with details
   */
  private async checkDatabaseDetailed(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      // Test query
      await prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;

      // Get connection pool status (if available)
      const metrics = await prisma.$metrics.json();

      // Count records in key tables
      const [userCount, propertyCount] = await Promise.all([
        prisma.user.count(),
        prisma.property.count(),
      ]);

      return {
        status: latency < 100 ? 'up' : 'degraded',
        latency,
        details: {
          connectionPool: metrics?.counters?.find((c: any) => c.key === 'prisma_pool_connections_open'),
          tables: {
            users: userCount,
            properties: propertyCount,
          },
        },
      };
    } catch (error) {
      logger.error('Database detailed health check failed:', error);
      return {
        status: 'down',
        message: 'Database connection failed',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Check cache health
   */
  private async checkCache(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      const stats = await cacheService.getStats();
      const latency = Date.now() - start;

      return {
        status: stats.connected ? (latency < 50 ? 'up' : 'degraded') : 'down',
        latency,
      };
    } catch (error) {
      logger.error('Cache health check failed:', error);
      return {
        status: 'down',
        message: 'Cache connection failed',
      };
    }
  }

  /**
   * Check cache health with details
   */
  private async checkCacheDetailed(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      const stats = await cacheService.getStats();
      const latency = Date.now() - start;

      return {
        status: stats.connected ? (latency < 50 ? 'up' : 'degraded') : 'down',
        latency,
        details: stats,
      };
    } catch (error) {
      logger.error('Cache detailed health check failed:', error);
      return {
        status: 'down',
        message: 'Cache connection failed',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Check ML API health
   */
  private async checkMlApi(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      const axios = require('axios');
      const response = await axios.get(`${process.env.ML_API_URL}/health`, {
        timeout: 5000,
      });
      const latency = Date.now() - start;

      return {
        status: response.status === 200 ? (latency < 1000 ? 'up' : 'degraded') : 'down',
        latency,
      };
    } catch (error) {
      logger.error('ML API health check failed:', error);
      return {
        status: 'down',
        message: 'ML API connection failed',
      };
    }
  }

  /**
   * Check ML API health with details
   */
  private async checkMlApiDetailed(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      const axios = require('axios');
      const response = await axios.get(`${process.env.ML_API_URL}/health`, {
        timeout: 5000,
      });
      const latency = Date.now() - start;

      return {
        status: response.status === 200 ? (latency < 1000 ? 'up' : 'degraded') : 'down',
        latency,
        details: response.data,
      };
    } catch (error) {
      logger.error('ML API detailed health check failed:', error);
      return {
        status: 'down',
        message: 'ML API connection failed',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Get system metrics
   */
  private getSystemMetrics(): SystemMetrics {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    return {
      memory: {
        total: totalMem,
        free: freeMem,
        used: usedMem,
        usagePercent: (usedMem / totalMem) * 100,
      },
      cpu: {
        cores: os.cpus().length,
        loadAverage: os.loadavg(),
      },
      process: {
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
      },
    };
  }

  /**
   * Get detailed system metrics
   */
  private getDetailedSystemMetrics(): any {
    const basic = this.getSystemMetrics();

    return {
      ...basic,
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      hostname: os.hostname(),
      networkInterfaces: os.networkInterfaces(),
    };
  }

  /**
   * Get application metrics
   */
  private async getMetrics(): Promise<any> {
    try {
      // Get cache stats
      const cacheStats = await cacheService.getStats();

      return {
        cache: cacheStats,
        requests: {
          // These would come from a metrics service in production
          total: 0,
          errors: 0,
          averageResponseTime: 0,
        },
      };
    } catch (error) {
      logger.error('Error getting metrics:', error);
      return null;
    }
  }
}

export const healthController = new HealthController();
