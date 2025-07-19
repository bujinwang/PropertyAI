/**
 * Production Monitoring and Error Reporting
 * Comprehensive monitoring setup for production deployments
 */

import { config, debugLog } from '../config/environment';

export interface ErrorReport {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: string;
  userAgent: string;
  url: string;
  userId?: string;
  environment: string;
  version: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  tags?: Record<string, string>;
  extra?: Record<string, any>;
}

export interface PerformanceReport {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  environment: string;
  version: string;
  metadata?: Record<string, any>;
}

class MonitoringService {
  private initialized = false;
  private errorQueue: ErrorReport[] = [];
  private performanceQueue: PerformanceReport[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (config.monitoring.enabled) {
      this.initializeSentry();
      this.initializePerformanceObserver();
      this.initializeErrorHandlers();
      this.startQueueFlush();
    }

    this.initialized = true;
    debugLog('Monitoring service initialized');
  }

  private initializeSentry() {
    if (!config.monitoring.sentryDsn) {
      debugLog('Sentry DSN not configured');
      return;
    }

    // In a real implementation, you would import and configure Sentry here
    // import * as Sentry from '@sentry/react';
    // 
    // Sentry.init({
    //   dsn: config.monitoring.sentryDsn,
    //   environment: config.environment,
    //   release: config.version,
    //   integrations: [
    //     new Sentry.BrowserTracing(),
    //   ],
    //   tracesSampleRate: config.environment === 'production' ? 0.1 : 1.0,
    // });

    debugLog('Sentry initialized (mock)');
  }

  private initializePerformanceObserver() {
    if (!config.monitoring.performanceMonitoring) {
      return;
    }

    // Observe Long Tasks
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.reportPerformance({
              name: 'long_task',
              value: entry.duration,
              unit: 'ms',
              timestamp: new Date().toISOString(),
              environment: config.environment,
              version: config.version,
              metadata: {
                startTime: entry.startTime,
                name: entry.name,
              },
            });
          }
        });

        longTaskObserver.observe({ entryTypes: ['longtask'] });
      } catch (error) {
        debugLog('Long task observer not supported:', error);
      }

      // Observe Layout Shifts
      try {
        const layoutShiftObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }

          if (clsValue > 0) {
            this.reportPerformance({
              name: 'cumulative_layout_shift',
              value: clsValue,
              unit: 'score',
              timestamp: new Date().toISOString(),
              environment: config.environment,
              version: config.version,
            });
          }
        });

        layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        debugLog('Layout shift observer not supported:', error);
      }
    }
  }

  private initializeErrorHandlers() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.reportError({
        message: event.message,
        stack: event.error?.stack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: this.getUserId(),
        environment: config.environment,
        version: config.version,
        severity: 'high',
        tags: {
          type: 'javascript_error',
          filename: event.filename,
          lineno: event.lineno?.toString(),
          colno: event.colno?.toString(),
        },
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: this.getUserId(),
        environment: config.environment,
        version: config.version,
        severity: 'high',
        tags: {
          type: 'unhandled_promise_rejection',
        },
        extra: {
          reason: event.reason,
        },
      });
    });
  }

  private startQueueFlush() {
    // Flush queues every 30 seconds
    this.flushInterval = setInterval(() => {
      this.flushQueues();
    }, 30000);

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flushQueues();
    });
  }

  private flushQueues() {
    if (this.errorQueue.length > 0) {
      this.sendErrorBatch([...this.errorQueue]);
      this.errorQueue = [];
    }

    if (this.performanceQueue.length > 0) {
      this.sendPerformanceBatch([...this.performanceQueue]);
      this.performanceQueue = [];
    }
  }

  private async sendErrorBatch(errors: ErrorReport[]) {
    if (config.environment === 'development') {
      debugLog('Error batch:', errors);
      return;
    }

    try {
      await fetch(`${config.apiBaseUrl}/monitoring/errors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ errors }),
      });
    } catch (error) {
      debugLog('Failed to send error batch:', error);
    }
  }

  private async sendPerformanceBatch(metrics: PerformanceReport[]) {
    if (config.environment === 'development') {
      debugLog('Performance batch:', metrics);
      return;
    }

    try {
      await fetch(`${config.apiBaseUrl}/monitoring/performance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ metrics }),
      });
    } catch (error) {
      debugLog('Failed to send performance batch:', error);
    }
  }

  private getUserId(): string | null {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user).id : null;
    } catch {
      return null;
    }
  }

  /**
   * Report an error to the monitoring service
   */
  reportError(error: Partial<ErrorReport>) {
    if (!this.initialized || !config.monitoring.enabled) {
      return;
    }

    const errorReport: ErrorReport = {
      message: error.message || 'Unknown error',
      stack: error.stack,
      componentStack: error.componentStack,
      timestamp: error.timestamp || new Date().toISOString(),
      userAgent: error.userAgent || navigator.userAgent,
      url: error.url || window.location.href,
      userId: error.userId || this.getUserId(),
      environment: config.environment,
      version: config.version,
      severity: error.severity || 'medium',
      tags: error.tags,
      extra: error.extra,
    };

    this.errorQueue.push(errorReport);

    // Flush immediately for critical errors
    if (errorReport.severity === 'critical') {
      this.sendErrorBatch([errorReport]);
    }

    debugLog('Error reported:', errorReport);
  }

  /**
   * Report a performance metric
   */
  reportPerformance(metric: Partial<PerformanceReport>) {
    if (!this.initialized || !config.monitoring.performanceMonitoring) {
      return;
    }

    const performanceReport: PerformanceReport = {
      name: metric.name || 'unknown_metric',
      value: metric.value || 0,
      unit: metric.unit || 'ms',
      timestamp: metric.timestamp || new Date().toISOString(),
      environment: config.environment,
      version: config.version,
      metadata: metric.metadata,
    };

    this.performanceQueue.push(performanceReport);
    debugLog('Performance metric reported:', performanceReport);
  }

  /**
   * Set user context for error reporting
   */
  setUserContext(user: { id: string; email?: string; role?: string }) {
    if (!this.initialized) {
      return;
    }

    // In a real implementation, you would set user context in Sentry
    // Sentry.setUser({
    //   id: user.id,
    //   email: user.email,
    //   role: user.role,
    // });

    debugLog('User context set:', user);
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(message: string, category: string, level: 'info' | 'warning' | 'error' = 'info') {
    if (!this.initialized) {
      return;
    }

    // In a real implementation, you would add breadcrumb to Sentry
    // Sentry.addBreadcrumb({
    //   message,
    //   category,
    //   level,
    //   timestamp: Date.now() / 1000,
    // });

    debugLog('Breadcrumb added:', { message, category, level });
  }

  /**
   * Cleanup monitoring service
   */
  cleanup() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    this.flushQueues();
    this.initialized = false;
  }
}

// Create singleton instance
export const monitoring = new MonitoringService();

// Convenience functions
export const reportError = (error: Partial<ErrorReport>) => monitoring.reportError(error);
export const reportPerformance = (metric: Partial<PerformanceReport>) => monitoring.reportPerformance(metric);
export const setUserContext = (user: { id: string; email?: string; role?: string }) => monitoring.setUserContext(user);
export const addBreadcrumb = (message: string, category: string, level?: 'info' | 'warning' | 'error') => 
  monitoring.addBreadcrumb(message, category, level);

export default monitoring;