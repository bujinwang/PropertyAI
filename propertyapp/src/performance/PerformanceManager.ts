import { useState, useEffect, useCallback, useRef } from 'react';
import { InteractionManager, AppState, AppStateStatus } from 'react-native';

// Performance monitoring utilities
export class PerformanceMonitor {
  private static metrics = new Map<string, number>();
  private static startTime = Date.now();

  static startMeasure(name: string) {
    this.metrics.set(name, Date.now());
  }

  static endMeasure(name: string): number {
    const start = this.metrics.get(name);
    if (!start) return 0;
    
    const duration = Date.now() - start;
    this.metrics.delete(name);
    
    // Log performance metrics in development
    if (__DEV__) {
      console.log(`[Performance] ${name}: ${duration}ms`);
    }
    
    return duration;
  }

  static getAppStartupTime() {
    return Date.now() - this.startTime;
  }
}

// Image optimization configuration
export const ImageConfig = {
  // Compression settings
  compression: {
    quality: 0.8,
    maxWidth: 1920,
    maxHeight: 1080,
    maxFileSize: 5 * 1024 * 1024, // 5MB
  },
  
  // Cache settings
  cache: {
    maxCacheSize: 100 * 1024 * 1024, // 100MB
    maxCacheAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    cacheDirectory: 'property_images',
  },
  
  // Progressive loading
  progressive: {
    thumbnailWidth: 100,
    thumbnailQuality: 0.3,
    blurRadius: 2,
  },
};

// Memory management for lists
export const VirtualizationConfig = {
  // FlatList optimization
  flatList: {
    windowSize: 10, // Render 10 screens worth of content
    initialNumToRender: 10,
    maxToRenderPerBatch: 10,
    updateCellsBatchingPeriod: 50,
    removeClippedSubviews: true,
    getItemLayout: (data: any, index: number) => ({
      length: 120, // Height of each item
      offset: 120 * index,
      index,
    }),
  },
  
  // Image virtualization
  image: {
    priority: 'normal' as const,
    cachePolicy: 'immutable',
    resizeMode: 'cover' as const,
  },
};

// Network optimization
export const NetworkConfig = {
  // Request batching
  batching: {
    maxBatchSize: 20,
    batchTimeout: 100, // ms
    maxRetries: 3,
    retryDelay: 1000, // ms
  },
  
  // Cache strategies
  cacheStrategies: {
    offline: {
      maxAge: 5 * 60 * 1000, // 5 minutes
      maxEntries: 100,
    },
    online: {
      maxAge: 30 * 1000, // 30 seconds
      maxEntries: 50,
    },
  },
  
  // Background sync
  backgroundSync: {
    minInterval: 30 * 1000, // 30 seconds
    maxInterval: 5 * 60 * 1000, // 5 minutes
    networkPriority: 'wifi',
  },
};

// Performance hooks
export const usePerformanceOptimization = () => {
  const [appState, setAppState] = useState(AppState.currentState);
  const interactionHandle = useRef<number | null>(null);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      setAppState(nextAppState);
      
      // Clear caches when app goes to background
      if (nextAppState === 'background') {
        // Clear image cache
        // Clear network cache
        // Trigger garbage collection
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const runAfterInteractions = useCallback((callback: () => void) => {
    if (interactionHandle.current) {
      InteractionManager.clearInteractionHandle(interactionHandle.current);
    }
    
    interactionHandle.current = InteractionManager.createInteractionHandle();
    
    InteractionManager.runAfterInteractions(() => {
      if (interactionHandle.current) {
        InteractionManager.clearInteractionHandle(interactionHandle.current);
        interactionHandle.current = null;
      }
      callback();
    });
  }, []);

  const isAppActive = appState === 'active';

  return {
    isAppActive,
    runAfterInteractions,
    appState,
  };
};

// Image preloading utility
export class ImagePreloader {
  private static preloadedImages = new Set<string>();
  
  static async preloadImages(urls: string[]) {
    const newUrls = urls.filter(url => !this.preloadedImages.has(url));
    
    const promises = newUrls.map(url => 
      this.preloadImage(url).catch(err => {
        console.warn('Failed to preload image:', url, err);
      })
    );
    
    await Promise.allSettled(promises);
  }
  
  private static async preloadImage(url: string) {
    // Use React Native's Image.prefetch for optimal preloading
    const { Image } = require('react-native');
    await Image.prefetch(url);
    this.preloadedImages.add(url);
  }
  
  static clearCache() {
    this.preloadedImages.clear();
  }
}

// Memory leak prevention
export const useMemoryOptimization = () => {
  const cleanupRef = useRef<(() => void)[]>([]);

  const registerCleanup = useCallback((cleanup: () => void) => {
    cleanupRef.current.push(cleanup);
  }, []);

  const runCleanup = useCallback(() => {
    cleanupRef.current.forEach(cleanup => cleanup());
    cleanupRef.current = [];
  }, []);

  useEffect(() => {
    return runCleanup;
  }, [runCleanup]);

  return { registerCleanup, runCleanup };
};

// Debounced search
export const useDebouncedSearch = (delay: number = 300) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateSearchTerm = useCallback((term: string) => {
    setSearchTerm(term);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setDebouncedTerm(term);
    }, delay);
  }, [delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { searchTerm, debouncedTerm, updateSearchTerm };
};