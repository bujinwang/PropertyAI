/**
 * Analytics and Performance Monitoring Utilities
 * Centralized tracking for user interactions and performance metrics
 */

import { config, debugLog } from '../config/environment';

export interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  customDimensions?: Record<string, string | number>;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  timestamp: number;
  metadata?: Record<string, any>;
}

class AnalyticsService {
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (config.monitoring.analytics.enabled && config.monitoring.analytics.googleAnalyticsId) {
      this.initializeGoogleAnalytics();
    }
    
    if (config.ai.performanceMonitoring) {
      this.initializePerformanceMonitoring();
    }

    this.initialized = true;
    debugLog('Analytics service initialized');
  }

  private initializeGoogleAnalytics() {
    // Initialize Google Analytics 4
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${config.monitoring.analytics.googleAnalyticsId}`;
    document.head.appendChild(script);

    // Initialize gtag
    (window as any).dataLayer = (window as any).dataLayer || [];
    function gtag(...args: any[]) {
      (window as any).dataLayer.push(args);
    }
    (window as any).gtag = gtag;

    gtag('js', new Date());
    gtag('config', config.monitoring.analytics.googleAnalyticsId, {
      app_name: 'PropertyFlow AI Dashboard',
      app_version: config.version,
      debug_mode: config.features.debugMode,
    });

    debugLog('Google Analytics initialized');
  }

  private initializePerformanceMonitoring() {
    // Monitor Core Web Vitals
    this.observeWebVitals();
    
    // Monitor AI component performance
    this.observeAIPerformance();
    
    // Monitor API performance
    this.observeAPIPerformance();

    debugLog('Performance monitoring initialized');
  }

  private observeWebVitals() {
    // Largest Contentful Paint (LCP)
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.trackPerformance({
          name: 'LCP',
          value: entry.startTime,
          unit: 'ms',
          timestamp: Date.now(),
        });
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay (FID)
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.trackPerformance({
          name: 'FID',
          value: (entry as any).processingStart - entry.startTime,
          unit: 'ms',
          timestamp: Date.now(),
        });
      }
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      this.trackPerformance({
        name: 'CLS',
        value: clsValue,
        unit: 'count',
        timestamp: Date.now(),
      });
    }).observe({ entryTypes: ['layout-shift'] });
  }

  private observeAIPerformance() {
    // Monitor AI component render times
    const aiComponentObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name.includes('ai-component')) {
          this.trackPerformance({
            name: 'AI_Component_Render',
            value: entry.duration,
            unit: 'ms',
            timestamp: Date.now(),
            metadata: {
              componentName: entry.name,
            },
          });
        }
      }
    });

    try {
      aiComponentObserver.observe({ entryTypes: ['measure'] });
    } catch (error) {
      debugLog('AI performance observer not supported:', error);
    }
  }

  private observeAPIPerformance() {
    // Monitor fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = typeof args[0] === 'string' ? args[0] : args[0].url;
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        
        this.trackPerformance({
          name: 'API_Request',
          value: endTime - startTime,
          unit: 'ms',
          timestamp: Date.now(),
          metadata: {
            url,
            status: response.status,
            method: args[1]?.method || 'GET',
          },
        });
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        
        this.trackPerformance({
          name: 'API_Request_Error',
          value: endTime - startTime,
          unit: 'ms',
          timestamp: Date.now(),
          metadata: {
            url,
            error: (error as Error).message,
            method: args[1]?.method || 'GET',
          },
        });
        
        throw error;
      }
    };
  }

  /**
   * Track user interaction events
   */
  trackEvent(event: AnalyticsEvent) {
    if (!this.initialized || !config.monitoring.analytics.enabled) {
      return;
    }

    debugLog('Tracking event:', event);

    // Send to Google Analytics
    if ((window as any).gtag) {
      (window as any).gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        custom_map: event.customDimensions,
      });
    }

    // Send to custom analytics endpoint if needed
    this.sendToCustomAnalytics(event);
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metric: PerformanceMetric) {
    if (!this.initialized || !config.ai.performanceMonitoring) {
      return;
    }

    debugLog('Tracking performance:', metric);

    // Send to monitoring service
    this.sendToMonitoringService(metric);
  }

  /**
   * Track AI-specific events
   */
  trackAIEvent(action: string, metadata?: Record<string, any>) {
    this.trackEvent({
      category: 'AI_Interaction',
      action,
      customDimensions: {
        ...metadata,
        timestamp: Date.now(),
        environment: config.environment,
      },
    });
  }

  /**
   * Track page views
   */
  trackPageView(path: string, title?: string) {
    if (!this.initialized || !config.monitoring.analytics.enabled) {
      return;
    }

    debugLog('Tracking page view:', path);

    if ((window as any).gtag) {
      (window as any).gtag('config', config.monitoring.analytics.googleAnalyticsId, {
        page_path: path,
        page_title: title,
      });
    }
  }

  /**
   * Track user properties
   */
  setUserProperties(properties: Record<string, string | number>) {
    if (!this.initialized || !config.monitoring.analytics.enabled) {
      return;
    }

    debugLog('Setting user properties:', properties);

    if ((window as any).gtag) {
      (window as any).gtag('config', config.monitoring.analytics.googleAnalyticsId, {
        custom_map: properties,
      });
    }
  }

  private sendToCustomAnalytics(event: AnalyticsEvent) {
    // Send to custom analytics endpoint
    if (config.environment === 'production') {
      fetch(`${config.api.baseUrl}/analytics/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...event,
          timestamp: Date.now(),
          environment: config.environment,
          version: config.version,
        }),
      }).catch(error => {
        debugLog('Failed to send analytics event:', error);
      });
    }
  }

  private sendToMonitoringService(metric: PerformanceMetric) {
    // Send to monitoring service
    if (config.environment === 'production') {
      fetch(`${config.api.baseUrl}/monitoring/metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...metric,
          environment: config.environment,
          version: config.version,
        }),
      }).catch(error => {
        debugLog('Failed to send performance metric:', error);
      });
    }
  }
}

// Create singleton instance
export const analytics = new AnalyticsService();

// Convenience functions
export const trackEvent = (event: AnalyticsEvent) => analytics.trackEvent(event);
export const trackPerformance = (metric: PerformanceMetric) => analytics.trackPerformance(metric);
export const trackAIEvent = (action: string, metadata?: Record<string, any>) => 
  analytics.trackAIEvent(action, metadata);
export const trackPageView = (path: string, title?: string) => 
  analytics.trackPageView(path, title);
export const setUserProperties = (properties: Record<string, string | number>) => 
  analytics.setUserProperties(properties);

export default analytics;