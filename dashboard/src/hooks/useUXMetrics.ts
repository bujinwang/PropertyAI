import { useCallback, useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

export interface UXMetricData {
  metricName: string;
  value: number;
  category: string;
  source: string;
  metadata?: Record<string, any>;
}

export interface UXMetricsOptions {
  autoTrack?: boolean;
  source?: string;
  category?: string;
}

export const useUXMetrics = (options: UXMetricsOptions = {}) => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<UXMetricData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { autoTrack = true, source = 'dashboard', category = 'general' } = options;

  const recordMetric = useCallback(async (metric: Omit<UXMetricData, 'source' | 'category'>) => {
    try {
      setIsLoading(true);
      setError(null);

      const metricData = {
        ...metric,
        source,
        category,
        metadata: {
          ...metric.metadata,
          userId: user?.id,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          screenSize: {
            width: window.screen.width,
            height: window.screen.height,
          },
          viewportSize: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
        },
      };

      await apiService.post('/ux-review/analytics', metricData);
      
      setMetrics(prev => [...prev, metricData as UXMetricData]);
      return true;
    } catch (err) {
      console.error('Failed to record UX metric:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, source, category]);

  const trackPageLoad = useCallback(async (pageName: string, loadTime: number) => {
    return recordMetric({
      metricName: 'PAGE_LOAD_TIME',
      value: loadTime,
      category: 'performance',
      metadata: {
        page: pageName,
        navigationType: performance.navigation.type,
        connection: (navigator as any).connection?.effectiveType || 'unknown',
      },
    });
  }, [recordMetric]);

  const trackUserInteraction = useCallback(async (
    interactionType: string,
    element: string,
    duration?: number
  ) => {
    return recordMetric({
      metricName: 'USER_INTERACTION',
      value: duration || 0,
      category: 'interaction',
      metadata: {
        interactionType,
        element,
        duration,
      },
    });
  }, [recordMetric]);

  const trackTaskCompletion = useCallback(async (
    taskName: string,
    success: boolean,
    duration: number,
    errors?: string[]
  ) => {
    return recordMetric({
      metricName: 'TASK_COMPLETION_RATE',
      value: success ? 1 : 0,
      category: 'usability',
      metadata: {
        taskName,
        success,
        duration,
        errorCount: errors?.length || 0,
        errors,
      },
    });
  }, [recordMetric]);

  const trackError = useCallback(async (
    errorType: string,
    message: string,
    context?: Record<string, any>
  ) => {
    return recordMetric({
      metricName: 'ERROR_RATE',
      value: 1,
      category: 'error',
      metadata: {
        errorType,
        message,
        context,
      },
    });
  }, [recordMetric]);

  const trackSatisfaction = useCallback(async (
    score: number,
    feedback?: string,
    context?: Record<string, any>
  ) => {
    return recordMetric({
      metricName: 'SATISFACTION_SCORE',
      value: score,
      category: 'satisfaction',
      metadata: {
        feedback,
        context,
      },
    });
  }, [recordMetric]);

  const trackNavigation = useCallback(async (
    fromPath: string,
    toPath: string,
    duration: number
  ) => {
    return recordMetric({
      metricName: 'NAVIGATION_TIME',
      value: duration,
      category: 'navigation',
      metadata: {
        from: fromPath,
        to: toPath,
      },
    });
  }, [recordMetric]);

  const getMetrics = useCallback(async (filters?: {
    metricName?: string;
    category?: string;
    startDate?: Date;
    endDate?: Date;
  }) => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters?.metricName) params.append('metricName', filters.metricName);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters?.endDate) params.append('endDate', filters.endDate.toISOString());

      const response = await apiService.get(`/ux-review/analytics?${params.toString()}`);
      return response;
    } catch (err) {
      console.error('Failed to get metrics:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getMetricsSummary = useCallback(async (startDate: Date, endDate: Date) => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('startDate', startDate.toISOString());
      params.append('endDate', endDate.toISOString());

      const response = await apiService.get(`/ux-review/analytics/summary?${params.toString()}`);
      return response;
    } catch (err) {
      console.error('Failed to get metrics summary:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-tracking for page load times
  useEffect(() => {
    if (!autoTrack) return;

    const handleLoad = () => {
      if (performance.timing) {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        trackPageLoad(window.location.pathname, loadTime);
      }
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, [autoTrack, trackPageLoad]);

  // Auto-tracking for navigation
  useEffect(() => {
    if (!autoTrack) return;

    let startTime = Date.now();
    let lastPath = window.location.pathname;

    const handleNavigation = () => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      trackNavigation(lastPath, window.location.pathname, duration);
      
      startTime = endTime;
      lastPath = window.location.pathname;
    };

    // Listen for route changes (you might need to adapt this for your router)
    const originalPushState = window.history.pushState;
    window.history.pushState = function(...args) {
      originalPushState.apply(this, args);
      handleNavigation();
    };

    return () => {
      window.history.pushState = originalPushState;
    };
  }, [autoTrack, trackNavigation]);

  // Auto-tracking for errors
  useEffect(() => {
    if (!autoTrack) return;

    const handleError = (event: ErrorEvent) => {
      trackError('javascript', event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      trackError('promise', String(event.reason));
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [autoTrack, trackError]);

  return {
    metrics,
    isLoading,
    error,
    recordMetric,
    trackPageLoad,
    trackUserInteraction,
    trackTaskCompletion,
    trackError,
    trackSatisfaction,
    trackNavigation,
    getMetrics,
    getMetricsSummary,
  };
};