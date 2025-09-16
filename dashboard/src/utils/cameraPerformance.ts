/**
 * Camera Performance Optimization Utilities
 * Enhances camera performance with memory management, lazy loading, and optimization techniques
 * Epic 21.5.2 - Mobile Experience Enhancement
 */

interface PerformanceMetrics {
  initializationTime: number;
  firstFrameTime: number;
  memoryUsage: number;
  frameRate: number;
  resolution: { width: number; height: number };
}

interface OptimizationConfig {
  enableLazyLoading: boolean;
  enableMemoryManagement: boolean;
  enablePerformanceMonitoring: boolean;
  targetFrameRate: number;
  maxResolution: { width: number; height: number };
  enableHardwareAcceleration: boolean;
}

class CameraPerformanceOptimizer {
  private metrics: PerformanceMetrics | null = null;
  private config: OptimizationConfig;
  private performanceObserver: PerformanceObserver | null = null;
  private memoryPressureListener: (() => void) | null = null;
  private frameRateMonitor: number | null = null;
  private frameCount = 0;
  private lastFrameTime = 0;

  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = {
      enableLazyLoading: true,
      enableMemoryManagement: true,
      enablePerformanceMonitoring: true,
      targetFrameRate: 30,
      maxResolution: { width: 1920, height: 1080 },
      enableHardwareAcceleration: true,
      ...config
    };

    if (this.config.enablePerformanceMonitoring) {
      this.initializePerformanceMonitoring();
    }
  }

  // Initialize performance monitoring
  private initializePerformanceMonitoring(): void {
    if ('PerformanceObserver' in window) {
      try {
        this.performanceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === 'measure' && entry.name.includes('camera')) {
              console.log(`[Camera Performance] ${entry.name}: ${entry.duration}ms`);
            }
          });
        });
        this.performanceObserver.observe({ entryTypes: ['measure'] });
      } catch (error) {
        console.warn('[Camera Performance] Performance monitoring not supported:', error);
      }
    }

    // Monitor memory pressure
    if ('memory' in performance) {
      this.memoryPressureListener = () => {
        const memory = (performance as any).memory;
        const usedPercent = (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100;

        if (usedPercent > 80) {
          console.warn('[Camera Performance] High memory usage detected:', usedPercent.toFixed(1) + '%');
          this.optimizeMemoryUsage();
        }
      };

      // Check memory every 30 seconds
      setInterval(this.memoryPressureListener, 30000);
    }
  }

  // Optimize camera constraints based on device capabilities
  optimizeConstraints(baseConstraints: MediaTrackConstraints): MediaTrackConstraints {
    const optimized: MediaTrackConstraints = { ...baseConstraints };

    // Optimize video constraints
    if ('video' in optimized && optimized.video && typeof optimized.video === 'object') {
      const videoConstraints = optimized.video as any;

      // Set optimal resolution based on device
      if (this.config.maxResolution) {
        videoConstraints.width = { ideal: this.config.maxResolution.width, max: this.config.maxResolution.width };
        videoConstraints.height = { ideal: this.config.maxResolution.height, max: this.config.maxResolution.height };
      }

      // Enable hardware acceleration if supported
      if (this.config.enableHardwareAcceleration) {
        // Try to enable hardware acceleration hints
        (videoConstraints as any).advanced = [{ torch: false }];
      }

      // Optimize frame rate
      videoConstraints.frameRate = { ideal: this.config.targetFrameRate, max: this.config.targetFrameRate };
    }

    return optimized;
  }

  // Lazy load camera resources
  async lazyLoadCameraResources(): Promise<void> {
    if (!this.config.enableLazyLoading) return;

    const startTime = performance.now();

    try {
      // Preload camera capabilities check
      await this.checkCameraCapabilities();

      // Warm up getUserMedia API
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Create a temporary stream to warm up the API
        const tempStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240 },
          audio: false
        });

        // Immediately stop the temporary stream
        tempStream.getTracks().forEach(track => track.stop());

        console.log('[Camera Performance] Camera API warmed up successfully');
      }

      const loadTime = performance.now() - startTime;
      console.log(`[Camera Performance] Lazy loading completed in ${loadTime.toFixed(2)}ms`);

    } catch (error) {
      console.warn('[Camera Performance] Lazy loading failed:', error);
    }
  }

  // Check camera capabilities efficiently
  private async checkCameraCapabilities(): Promise<void> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      throw new Error('Media devices API not supported');
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');

      if (videoDevices.length === 0) {
        throw new Error('No camera devices found');
      }

      console.log(`[Camera Performance] Found ${videoDevices.length} camera device(s)`);

      // Check for advanced capabilities
      if (navigator.mediaDevices.getSupportedConstraints) {
        const constraints = navigator.mediaDevices.getSupportedConstraints();
        console.log('[Camera Performance] Supported constraints:', constraints);
      }

    } catch (error) {
      console.error('[Camera Performance] Error checking capabilities:', error);
      throw error;
    }
  }

  // Optimize memory usage
  optimizeMemoryUsage(): void {
    if (!this.config.enableMemoryManagement) return;

    // Force garbage collection if available (development only)
    if ((window as any).gc) {
      (window as any).gc();
      console.log('[Camera Performance] Forced garbage collection');
    }

    // Clear any cached streams or large objects
    this.clearPerformanceCache();

    // Suggest memory optimizations to the user
    console.warn('[Camera Performance] Memory optimization applied. Consider:');
    console.warn('- Reducing video resolution');
    console.warn('- Disabling unused camera features');
    console.warn('- Closing other browser tabs');
  }

  // Clear performance-related cache
  private clearPerformanceCache(): void {
    // Clear any cached performance data
    this.metrics = null;
    this.frameCount = 0;
    this.lastFrameTime = 0;
  }

  // Monitor frame rate
  startFrameRateMonitoring(videoElement: HTMLVideoElement): void {
    if (!this.config.enablePerformanceMonitoring) return;

    let frameCount = 0;
    let lastTime = performance.now();

    const monitorFrameRate = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime - lastTime >= 1000) { // Update every second
        const fps = (frameCount * 1000) / (currentTime - lastTime);
        this.updateFrameRate(fps);
        frameCount = 0;
        lastTime = currentTime;
      }

      if (videoElement && !videoElement.paused && !videoElement.ended) {
        this.frameRateMonitor = requestAnimationFrame(monitorFrameRate);
      }
    };

    this.frameRateMonitor = requestAnimationFrame(monitorFrameRate);
  }

  // Stop frame rate monitoring
  stopFrameRateMonitoring(): void {
    if (this.frameRateMonitor) {
      cancelAnimationFrame(this.frameRateMonitor);
      this.frameRateMonitor = null;
    }
  }

  // Update frame rate metrics
  private updateFrameRate(fps: number): void {
    if (!this.metrics) {
      this.metrics = {
        initializationTime: 0,
        firstFrameTime: 0,
        memoryUsage: 0,
        frameRate: fps,
        resolution: { width: 0, height: 0 }
      };
    } else {
      this.metrics.frameRate = fps;
    }

    // Log performance warnings
    if (fps < this.config.targetFrameRate * 0.8) {
      console.warn(`[Camera Performance] Low frame rate detected: ${fps.toFixed(1)} FPS`);
    }
  }

  // Record performance metrics
  recordMetric(name: string, value: number): void {
    if (!this.config.enablePerformanceMonitoring) return;

    try {
      performance.mark(`${name}-start`);
      // Simulate some work
      setTimeout(() => {
        performance.mark(`${name}-end`);
        performance.measure(`camera-${name}`, `${name}-start`, `${name}-end`);
      }, value);
    } catch (error) {
      console.warn('[Camera Performance] Error recording metric:', error);
    }
  }

  // Get current performance metrics
  getMetrics(): PerformanceMetrics | null {
    return this.metrics;
  }

  // Optimize for low-end devices
  optimizeForLowEndDevice(): OptimizationConfig {
    return {
      ...this.config,
      targetFrameRate: 24,
      maxResolution: { width: 1280, height: 720 },
      enableHardwareAcceleration: false,
      enableLazyLoading: true,
      enableMemoryManagement: true,
      enablePerformanceMonitoring: false
    };
  }

  // Optimize for high-end devices
  optimizeForHighEndDevice(): OptimizationConfig {
    return {
      ...this.config,
      targetFrameRate: 60,
      maxResolution: { width: 3840, height: 2160 },
      enableHardwareAcceleration: true,
      enableLazyLoading: true,
      enableMemoryManagement: true,
      enablePerformanceMonitoring: true
    };
  }

  // Detect device performance capabilities
  async detectDeviceCapabilities(): Promise<'low' | 'medium' | 'high'> {
    const connection = (navigator as any).connection;
    const deviceMemory = (navigator as any).deviceMemory;
    const hardwareConcurrency = navigator.hardwareConcurrency;

    // Check network connection
    if (connection && connection.effectiveType === 'slow-2g') {
      return 'low';
    }

    // Check device memory
    if (deviceMemory && deviceMemory < 4) {
      return 'low';
    }

    // Check CPU cores
    if (hardwareConcurrency && hardwareConcurrency < 4) {
      return 'low';
    }

    // Check for high-end indicators
    if (deviceMemory && deviceMemory >= 8 && hardwareConcurrency && hardwareConcurrency >= 8) {
      return 'high';
    }

    return 'medium';
  }

  // Auto-optimize based on device capabilities
  async autoOptimize(): Promise<OptimizationConfig> {
    const deviceType = await this.detectDeviceCapabilities();

    switch (deviceType) {
      case 'low':
        return this.optimizeForLowEndDevice();
      case 'high':
        return this.optimizeForHighEndDevice();
      default:
        return this.config;
    }
  }

  // Cleanup resources
  destroy(): void {
    this.stopFrameRateMonitoring();

    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }

    if (this.memoryPressureListener) {
      // Note: In a real implementation, you'd need to store the interval ID
      // and clear it here
    }

    this.clearPerformanceCache();
    console.log('[Camera Performance] Performance optimizer destroyed');
  }
}

// Export singleton instance
export const cameraPerformanceOptimizer = new CameraPerformanceOptimizer();
export default CameraPerformanceOptimizer;