/**
 * AI Performance Optimization Utilities
 * Provides memoization, lazy loading, and performance monitoring for AI components
 */

import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { debounce, throttle } from 'lodash-es';

// Performance monitoring types
export interface AIPerformanceMetrics {
  componentName: string;
  renderTime: number;
  calculationTime: number;
  memoryUsage?: number;
  timestamp: number;
}

export interface AICalculationCache {
  [key: string]: {
    result: any;
    timestamp: number;
    ttl: number;
  };
}

// Global cache for expensive AI calculations
const aiCalculationCache: AICalculationCache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Memoized confidence level calculation
 */
export const useConfidenceLevel = (confidence: number) => {
  return useMemo(() => {
    if (confidence >= 80) return 'high';
    if (confidence >= 60) return 'medium';
    return 'low';
  }, [confidence]);
};

/**
 * Memoized confidence color calculation
 */
export const useConfidenceColor = (confidence: number, colorCoded: boolean = true) => {
  return useMemo(() => {
    if (!colorCoded) return 'primary';
    if (confidence >= 80) return 'success';
    if (confidence >= 60) return 'warning';
    return 'error';
  }, [confidence, colorCoded]);
};

/**
 * Cached AI calculation hook with TTL
 */
export const useCachedAICalculation = <T>(
  key: string,
  calculationFn: () => T,
  dependencies: any[],
  ttl: number = CACHE_TTL
): T => {
  return useMemo(() => {
    const cacheKey = `${key}_${JSON.stringify(dependencies)}`;
    const cached = aiCalculationCache[cacheKey];
    
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.result;
    }
    
    const result = calculationFn();
    aiCalculationCache[cacheKey] = {
      result,
      timestamp: Date.now(),
      ttl,
    };
    
    return result;
  }, dependencies);
};

/**
 * Debounced callback for AI feedback submissions
 */
export const useDebouncedAIFeedback = (
  callback: (feedback: any) => void,
  delay: number = 300
) => {
  return useCallback(
    debounce(callback, delay),
    [callback, delay]
  );
};

/**
 * Throttled callback for AI real-time updates
 */
export const useThrottledAIUpdate = (
  callback: (data: any) => void,
  delay: number = 1000
) => {
  return useCallback(
    throttle(callback, delay),
    [callback, delay]
  );
};

/**
 * Performance monitoring hook for AI components
 */
export const useAIPerformanceMonitor = (componentName: string) => {
  const renderStartTime = useRef<number>(0);
  const calculationStartTime = useRef<number>(0);

  const startRender = useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);

  const endRender = useCallback(() => {
    const renderTime = performance.now() - renderStartTime.current;
    
    // Report performance metrics
    const metrics: AIPerformanceMetrics = {
      componentName,
      renderTime,
      calculationTime: 0,
      timestamp: Date.now(),
    };
    
    // Send to analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'ai_component_performance', {
        component_name: componentName,
        render_time: renderTime,
      });
    }
    
    return metrics;
  }, [componentName]);

  const startCalculation = useCallback(() => {
    calculationStartTime.current = performance.now();
  }, []);

  const endCalculation = useCallback(() => {
    return performance.now() - calculationStartTime.current;
  }, []);

  return {
    startRender,
    endRender,
    startCalculation,
    endCalculation,
  };
};

/**
 * Simple performance monitoring hook for AI components
 * Alias for useAIPerformanceMonitor for backward compatibility
 */
export const useAIComponentPerformance = (componentName: string) => {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Send to analytics if available
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'ai_component_performance', {
          component_name: componentName,
          render_time: renderTime,
        });
      }
    };
  }, [componentName]);
};

/**
 * Memory-efficient AI explanation generator
 */
export const useAIExplanation = (
  confidence: number,
  customExplanation?: string
) => {
  return useMemo(() => {
    if (customExplanation) return customExplanation;
    
    const level = confidence >= 80 ? 'high' : confidence >= 60 ? 'medium' : 'low';
    const baseExplanation = `This AI prediction has a ${level} confidence level (${Math.round(confidence)}%).`;
    
    switch (level) {
      case 'high':
        return `${baseExplanation} The model is very confident in this prediction based on strong data patterns and high-quality input data. This prediction is highly reliable.`;
      case 'medium':
        return `${baseExplanation} The model has moderate confidence in this prediction. While generally reliable, consider reviewing additional factors or seeking expert validation for critical decisions.`;
      case 'low':
        return `${baseExplanation} The model has low confidence in this prediction due to limited data or conflicting patterns. Manual review and expert validation are strongly recommended before making decisions.`;
      default:
        return baseExplanation;
    }
  }, [confidence, customExplanation]);
};

/**
 * Optimized AI component props memoization
 */
export const useOptimizedAIProps = <T extends Record<string, any>>(props: T): T => {
  return useMemo(() => {
    // Deep clone props to prevent reference issues
    return JSON.parse(JSON.stringify(props));
  }, [JSON.stringify(props)]);
};

/**
 * Cache cleanup utility
 */
export const cleanupAICache = () => {
  const now = Date.now();
  Object.keys(aiCalculationCache).forEach(key => {
    const cached = aiCalculationCache[key];
    if (now - cached.timestamp > cached.ttl) {
      delete aiCalculationCache[key];
    }
  });
};

/**
 * Initialize cache cleanup interval
 */
export const initializeAICacheCleanup = () => {
  if (typeof window !== 'undefined') {
    setInterval(cleanupAICache, 60000); // Cleanup every minute
  }
};

/**
 * Lazy loading utility for AI components
 */
export const createLazyAIComponent = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) => {
  const LazyComponent = React.lazy(importFn);
  
  return React.forwardRef<any, React.ComponentProps<T>>((props, ref) => {
    const fallbackElement = fallback ? React.createElement(fallback) : React.createElement('div', {}, 'Loading...');
    
    return React.createElement(
      React.Suspense,
      { fallback: fallbackElement },
      React.createElement(LazyComponent, { ...props, ref })
    );
  });
};