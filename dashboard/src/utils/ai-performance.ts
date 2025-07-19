/**
 * Performance utilities for AI components
 * Provides memoization, caching, and optimization helpers for AI-related calculations
 */

import { useMemo, useCallback, useRef, useEffect } from 'react';

// Memoization cache for expensive AI calculations
const aiCalculationCache = new Map<string, any>();

// Cache size limit to prevent memory leaks
const CACHE_SIZE_LIMIT = 1000;

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
 * Cached AI calculation hook with automatic cleanup
 */
export const useCachedAICalculation = <T>(
  key: string,
  calculation: () => T,
  dependencies: any[]
): T => {
  return useMemo(() => {
    const cacheKey = `${key}-${JSON.stringify(dependencies)}`;
    
    if (aiCalculationCache.has(cacheKey)) {
      return aiCalculationCache.get(cacheKey);
    }
    
    const result = calculation();
    
    // Implement LRU cache cleanup
    if (aiCalculationCache.size >= CACHE_SIZE_LIMIT) {
      const firstKey = aiCalculationCache.keys().next().value;
      if (firstKey) {
        aiCalculationCache.delete(firstKey);
      }
    }
    
    aiCalculationCache.set(cacheKey, result);
    return result;
  }, dependencies);
};

/**
 * Debounced AI feedback submission
 */
export const useDebouncedAIFeedback = (
  onFeedback: (feedback: any) => void,
  delay: number = 300
) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  return useCallback((feedback: any) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      onFeedback(feedback);
    }, delay);
  }, [onFeedback, delay]);
};

/**
 * Performance monitoring for AI components
 */
export const useAIComponentPerformance = (componentName: string) => {
  const renderStartTime = useRef<number | undefined>(undefined);
  const renderCount = useRef<number>(0);
  
  useEffect(() => {
    renderStartTime.current = performance.now();
    renderCount.current += 1;
    
    return () => {
      if (renderStartTime.current) {
        const renderTime = performance.now() - renderStartTime.current;
        
        // Log performance metrics in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`AI Component Performance - ${componentName}:`, {
            renderTime: `${renderTime.toFixed(2)}ms`,
            renderCount: renderCount.current,
          });
        }
        
        // Send to analytics in production (if available)
        if (process.env.NODE_ENV === 'production' && window.gtag) {
          window.gtag('event', 'ai_component_render', {
            component_name: componentName,
            render_time: Math.round(renderTime),
            render_count: renderCount.current,
          });
        }
      }
    };
  });
};

/**
 * Optimized AI explanation generator with caching
 */
export const useAIExplanation = (
  confidence: number,
  customExplanation?: string
) => {
  return useCachedAICalculation(
    'ai-explanation',
    () => {
      if (customExplanation) return customExplanation;
      
      const level = confidence >= 80 ? 'high' : confidence >= 60 ? 'medium' : 'low';
      const baseExplanation = `This AI prediction has a ${level} confidence level (${Math.round(confidence)}%).`;
      
      if (level === 'high') {
        return `${baseExplanation} The model is very confident in this prediction based on strong data patterns and high-quality input data. This prediction is highly reliable.`;
      } else if (level === 'medium') {
        return `${baseExplanation} The model has moderate confidence in this prediction. While generally reliable, consider reviewing additional factors or seeking expert validation for critical decisions.`;
      } else {
        return `${baseExplanation} The model has low confidence in this prediction due to limited data or conflicting patterns. Manual review and expert validation are strongly recommended before making decisions.`;
      }
    },
    [confidence, customExplanation]
  );
};

/**
 * Batch AI operations for better performance
 */
export const useBatchedAIOperations = <T>(
  operations: (() => T)[],
  batchSize: number = 5
) => {
  return useMemo(() => {
    const batches: (() => T)[][] = [];
    
    for (let i = 0; i < operations.length; i += batchSize) {
      batches.push(operations.slice(i, i + batchSize));
    }
    
    return batches.map(batch => 
      batch.map(operation => operation())
    );
  }, [operations, batchSize]);
};

/**
 * AI component visibility optimization
 */
export const useAIComponentVisibility = (threshold: number = 0.1) => {
  const elementRef = useRef<HTMLElement>(null);
  const isVisible = useRef<boolean>(false);
  
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible.current = entry.isIntersecting;
      },
      { threshold }
    );
    
    observer.observe(element);
    
    return () => observer.disconnect();
  }, [threshold]);
  
  return { elementRef, isVisible: isVisible.current };
};

/**
 * Clear AI calculation cache (useful for memory management)
 */
export const clearAICache = () => {
  aiCalculationCache.clear();
};

/**
 * Get AI cache statistics
 */
export const getAICacheStats = () => ({
  size: aiCalculationCache.size,
  limit: CACHE_SIZE_LIMIT,
  usage: (aiCalculationCache.size / CACHE_SIZE_LIMIT) * 100,
});

// Type definitions for performance monitoring
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}