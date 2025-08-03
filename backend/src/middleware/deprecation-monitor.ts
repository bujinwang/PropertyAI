import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';

interface DeprecationLog {
  timestamp: string;
  endpoint: string;
  method: string;
  userAgent?: string;
  ip?: string;
  referer?: string;
}

class DeprecationMonitor {
  private logFile: string;
  private deprecatedEndpoints: Set<string>;

  constructor() {
    this.logFile = path.join(__dirname, '../../logs/deprecated-endpoints.log');
    this.deprecatedEndpoints = new Set([
      '/api/properties',
      '/api/units', 
      '/api/listings'
    ]);

    // Ensure log directory exists
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  middleware = (req: Request, res: Response, next: NextFunction) => {
    const basePath = '/' + req.path.split('/').slice(1, 3).join('/');
    
    if (this.deprecatedEndpoints.has(basePath)) {
      this.logDeprecatedUsage(req);
      
      // Add deprecation headers
      res.setHeader('X-API-Deprecated', 'true');
      res.setHeader('X-API-Deprecation-Date', '2025-01-02');
      res.setHeader('X-API-Sunset-Date', '2025-02-01');
      res.setHeader('X-API-Migration-Guide', '/docs/migration-guide');
    }

    next();
  };

  private logDeprecatedUsage(req: Request): void {
    const logEntry: DeprecationLog = {
      timestamp: new Date().toISOString(),
      endpoint: req.originalUrl,
      method: req.method,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      referer: req.get('Referer')
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    
    fs.appendFile(this.logFile, logLine, (err) => {
      if (err) {
        console.error('Failed to log deprecated endpoint usage:', err);
      }
    });

    // Also log to console for immediate visibility
    console.warn(`🚨 DEPRECATED ENDPOINT USED: ${req.method} ${req.originalUrl} from ${logEntry.ip}`);
  }

  // Method to generate usage reports
  generateReport(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(this.logFile)) {
        resolve({ message: 'No deprecated endpoint usage found' });
        return;
      }

      fs.readFile(this.logFile, 'utf8', (err, data) => {
        if (err) {
          reject(err);
          return;
        }

        const logs = data.trim().split('\n')
          .filter(line => line)
          .map(line => JSON.parse(line));

        const report = {
          totalUsage: logs.length,
          uniqueIPs: new Set(logs.map(log => log.ip)).size,
          endpointBreakdown: this.groupBy(logs, 'endpoint'),
          methodBreakdown: this.groupBy(logs, 'method'),
          dailyUsage: this.groupByDate(logs),
          recentUsage: logs.slice(-10)
        };

        resolve(report);
      });
    });
  }

  private groupBy(array: any[], key: string): Record<string, number> {
    return array.reduce((acc, item) => {
      const value = item[key];
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  private groupByDate(logs: DeprecationLog[]): Record<string, number> {
    return logs.reduce((acc, log) => {
      const date = log.timestamp.split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}

export const deprecationMonitor = new DeprecationMonitor();
export const deprecationMiddleware = deprecationMonitor.middleware;