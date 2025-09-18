import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PerformanceMetrics {
  appStartTime: number;
  jsBundleLoadTime: number;
  firstPaintTime: number;
  timeToInteractive: number;
  memoryUsage: number;
  networkRequests: number;
  slowFrames: number;
  frozenFrames: number;
}

class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private startTime: number = Date.now();
  private frameCount: number = 0;
  private slowFrameCount: number = 0;
  private frozenFrameCount: number = 0;
  private lastFrameTime: number = 0;

  constructor() {
    this.initializeMonitoring();
  }

  private initializeMonitoring() {
    // Monitor app start time
    this.metrics.appStartTime = Date.now() - this.startTime;

    // Monitor memory usage
    this.startMemoryMonitoring();

    // Monitor frame drops (60fps target)
    this.startFrameMonitoring();

    // Monitor network requests
    this.startNetworkMonitoring();
  }

  private startMemoryMonitoring() {
    if (Platform.OS === 'ios') {
      // iOS memory monitoring
      setInterval(() => {
        // Note: In production, you'd use a native module for accurate memory monitoring
        this.metrics.memoryUsage = this.getEstimatedMemoryUsage();
      }, 5000);
    }
  }

  private startFrameMonitoring() {
    const monitorFrames = (timestamp: number) => {
      if (this.lastFrameTime > 0) {
        const frameTime = timestamp - this.lastFrameTime;
        const targetFrameTime = 1000 / 60; // 60fps

        if (frameTime > targetFrameTime * 1.5) {
          this.slowFrameCount++;
        }

        if (frameTime > targetFrameTime * 3) {
          this.frozenFrameCount++;
        }
      }

      this.lastFrameTime = timestamp;
      this.frameCount++;

      requestAnimationFrame(monitorFrames);
    };

    requestAnimationFrame(monitorFrames);
  }

  private startNetworkMonitoring() {
    let requestCount = 0;

    // Override XMLHttpRequest to monitor network requests
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method: string, url: string | URL) {
      requestCount++;
      return originalOpen.apply(this, [method, url]);
    };

    // Update metrics every 5 seconds
    setInterval(() => {
      this.metrics.networkRequests = requestCount;
      requestCount = 0;
    }, 5000);
  }

  private getEstimatedMemoryUsage(): number {
    // This is a simplified estimation
    // In production, use native modules for accurate measurements
    return Math.random() * 100 + 50; // Mock value in MB
  }

  public recordMetric(key: keyof PerformanceMetrics, value: number) {
    this.metrics[key] = value;
  }

  public getMetrics(): Partial<PerformanceMetrics> & {
    slowFrames: number;
    frozenFrames: number;
    frameCount: number;
  } {
    return {
      ...this.metrics,
      slowFrames: this.slowFrameCount,
      frozenFrames: this.frozenFrameCount,
      frameCount: this.frameCount,
    };
  }

  public async saveMetricsToStorage() {
    try {
      const metrics = this.getMetrics();
      await AsyncStorage.setItem('performance_metrics', JSON.stringify({
        ...metrics,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.warn('Failed to save performance metrics:', error);
    }
  }

  public async getStoredMetrics() {
    try {
      const stored = await AsyncStorage.getItem('performance_metrics');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Failed to load performance metrics:', error);
      return null;
    }
  }

  public logPerformanceReport() {
    const metrics = this.getMetrics();

    console.log('🚀 Performance Report:');
    console.log(`📱 App Start Time: ${metrics.appStartTime}ms`);
    console.log(`⚡ JS Bundle Load: ${metrics.jsBundleLoadTime || 'N/A'}ms`);
    console.log(`🎨 First Paint: ${metrics.firstPaintTime || 'N/A'}ms`);
    console.log(`👆 Time to Interactive: ${metrics.timeToInteractive || 'N/A'}ms`);
    console.log(`🧠 Memory Usage: ${metrics.memoryUsage || 'N/A'}MB`);
    console.log(`🌐 Network Requests: ${metrics.networkRequests || 0}`);
    console.log(`🎬 Total Frames: ${metrics.frameCount}`);
    console.log(`🐌 Slow Frames: ${metrics.slowFrames}`);
    console.log(`❄️ Frozen Frames: ${metrics.frozenFrames}`);

    // Performance recommendations
    this.provideRecommendations(metrics);
  }

  private provideRecommendations(metrics: any) {
    console.log('\n💡 Performance Recommendations:');

    if (metrics.appStartTime && metrics.appStartTime > 3000) {
      console.log('⚠️ App start time is slow. Consider code splitting and lazy loading.');
    }

    if (metrics.slowFrames && metrics.slowFrames > 10) {
      console.log('⚠️ High number of slow frames. Optimize animations and reduce re-renders.');
    }

    if (metrics.frozenFrames && metrics.frozenFrames > 5) {
      console.log('⚠️ Frozen frames detected. Check for blocking operations on main thread.');
    }

    if (metrics.memoryUsage && metrics.memoryUsage > 150) {
      console.log('⚠️ High memory usage. Implement proper cleanup and memory management.');
    }
  }

  public startInteractionMonitoring() {
    // Monitor user interactions for responsiveness
    const originalAddEventListener = document.addEventListener;
    document.addEventListener = function(type: string, listener: any) {
      if (type.startsWith('touch') || type.startsWith('click')) {
        const startTime = Date.now();
        const originalListener = listener;

        listener = function(event: any) {
          const interactionTime = Date.now() - startTime;
          if (interactionTime > 100) {
            console.warn(`Slow interaction (${type}): ${interactionTime}ms`);
          }
          return originalListener.call(this, event);
        };
      }

      return originalAddEventListener.call(this, type, listener);
    };
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Global performance utilities
export const measurePerformance = <T>(
  name: string,
  operation: () => T | Promise<T>
): T | Promise<T> => {
  const startTime = performance.now();

  try {
    const result = operation();

    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = performance.now() - startTime;
        console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);

        if (duration > 100) {
          console.warn(`⚠️ Slow operation: ${name} took ${duration.toFixed(2)}ms`);
        }
      });
    } else {
      const duration = performance.now() - startTime;
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);

      if (duration > 100) {
        console.warn(`⚠️ Slow operation: ${name} took ${duration.toFixed(2)}ms`);
      }

      return result;
    }
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error(`❌ ${name} failed after ${duration.toFixed(2)}ms:`, error);
    throw error;
  }
};

export default performanceMonitor;
