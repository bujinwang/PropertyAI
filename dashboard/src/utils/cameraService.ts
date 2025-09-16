/**
 * Camera Service for Mobile Property Inspections
 * Handles camera access, photo capture, and image processing
 * Epic 21.5.2 - Mobile Experience Enhancement
 */

import { cameraPerformanceOptimizer } from './cameraPerformance';

export interface CameraOptions {
  facingMode?: 'user' | 'environment';
  width?: number;
  height?: number;
  quality?: number;
}

export interface PhotoCaptureResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  timestamp: number;
  location?: GeolocationCoordinates;
}

export interface CameraCapabilities {
  hasCamera: boolean;
  hasFrontCamera: boolean;
  hasBackCamera: boolean;
  supportsFlash: boolean;
  maxResolution: { width: number; height: number };
}

class CameraService {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private capabilities: CameraCapabilities | null = null;

  constructor() {
    this.initializeCapabilities();
  }

  // Check camera capabilities
  private async initializeCapabilities(): Promise<void> {
    try {
      this.capabilities = await this.detectCapabilities();
    } catch (error) {
      console.error('[Camera] Error detecting capabilities:', error);
      this.capabilities = {
        hasCamera: false,
        hasFrontCamera: false,
        hasBackCamera: false,
        supportsFlash: false,
        maxResolution: { width: 0, height: 0 }
      };
    }
  }

  private async detectCapabilities(): Promise<CameraCapabilities> {
    const capabilities: CameraCapabilities = {
      hasCamera: false,
      hasFrontCamera: false,
      hasBackCamera: false,
      supportsFlash: false,
      maxResolution: { width: 640, height: 480 }
    };

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return capabilities;
    }

    try {
      // Check for camera availability
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices ? devices.filter(device => device.kind === 'videoinput') : [];

      capabilities.hasCamera = videoDevices.length > 0;
      capabilities.hasFrontCamera = videoDevices.some(device =>
        device.label.toLowerCase().includes('front') ||
        device.label.toLowerCase().includes('facetime')
      );
      capabilities.hasBackCamera = videoDevices.some(device =>
        device.label.toLowerCase().includes('back') ||
        device.label.toLowerCase().includes('rear')
      );

      // Test camera access to get capabilities
      if (capabilities.hasCamera) {
        const testStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1920 }, height: { ideal: 1080 } }
        });

        const videoTrack = testStream.getVideoTracks()[0];
        const trackCapabilities = videoTrack.getCapabilities();

        if (trackCapabilities.width && trackCapabilities.height) {
          capabilities.maxResolution = {
            width: trackCapabilities.width.max || 1920,
            height: trackCapabilities.height.max || 1080
          };
        }

        capabilities.supportsFlash = 'torch' in trackCapabilities;

        // Clean up test stream
        testStream.getTracks().forEach(track => track.stop());
      }

    } catch (error) {
      console.warn('[Camera] Error during capability detection:', error);
    }

    return capabilities;
  }

  // Enhanced permission validation with secure context checking
  async requestPermission(): Promise<{ granted: boolean; state: PermissionState; error?: string }> {
    // Check for secure context (HTTPS requirement for camera access)
    if (!this.isSecureContext()) {
      const error = 'Camera access requires HTTPS';
      console.error('[Camera]', error);
      return { granted: false, state: 'denied', error };
    }

    if (!this.capabilities?.hasCamera) {
      const error = 'No camera available on this device';
      console.warn('[Camera]', error);
      return { granted: false, state: 'denied', error };
    }

    // Check current permission state if permissions API is available
    if (navigator.permissions) {
      try {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        if (permission.state === 'denied') {
          const error = 'Camera permission denied by user';
          console.warn('[Camera]', error);
          return { granted: false, state: 'denied', error };
        }
        if (permission.state === 'granted') {
          return { granted: true, state: 'granted' };
        }
      } catch (error) {
        console.warn('[Camera] Error checking permission state:', error);
      }
    }

    // Test actual camera access
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 640, height: 480 },
        audio: false
      });

      // Clean up test stream
      stream.getTracks().forEach(track => track.stop());
      return { granted: true, state: 'granted' };
    } catch (error: any) {
      let errorMessage = 'Camera access failed';
      let permissionState: PermissionState = 'denied';

      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied';
        permissionState = 'denied';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera device found';
        permissionState = 'denied';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is already in use';
        permissionState = 'denied';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Camera constraints cannot be satisfied';
        permissionState = 'denied';
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Camera access blocked due to security restrictions';
        permissionState = 'denied';
      }

      console.error('[Camera]', errorMessage, error);
      return { granted: false, state: permissionState, error: errorMessage };
    }
  }

  // Check if running in secure context
  private isSecureContext(): boolean {
    return window.location.protocol === 'https:' ||
           window.location.hostname === 'localhost' ||
           window.location.hostname === '127.0.0.1';
  }

  // Start camera stream with performance optimizations
  async startCamera(
    videoElement: HTMLVideoElement,
    options: CameraOptions = {}
  ): Promise<boolean> {
    if (!this.capabilities?.hasCamera) {
      console.warn('[Camera] No camera available');
      return false;
    }

    const startTime = performance.now();

    try {
      // Stop any existing stream
      await this.stopCamera();

      // Create base constraints
      const baseConstraints: any = {
        video: {
          facingMode: options.facingMode || 'environment',
          width: { ideal: options.width || 1920 },
          height: { ideal: options.height || 1080 }
        },
        audio: false
      };

      // Optimize constraints using performance optimizer
      const optimizedConstraints = cameraPerformanceOptimizer.optimizeConstraints(baseConstraints) as MediaStreamConstraints;

      // Record performance metric
      cameraPerformanceOptimizer.recordMetric('camera-constraints-optimization', 10);

      this.stream = await navigator.mediaDevices.getUserMedia(optimizedConstraints);
      this.videoElement = videoElement;

      videoElement.srcObject = this.stream;

      // Start performance monitoring
      cameraPerformanceOptimizer.startFrameRateMonitoring(videoElement);

      await videoElement.play();

      const initializationTime = performance.now() - startTime;
      console.log(`[Camera] Camera started successfully in ${initializationTime.toFixed(2)}ms`);

      // Record initialization performance
      cameraPerformanceOptimizer.recordMetric('camera-initialization', initializationTime);

      return true;
    } catch (error) {
      console.error('[Camera] Error starting camera:', error);
      cameraPerformanceOptimizer.recordMetric('camera-start-failure', performance.now() - startTime);
      return false;
    }
  }

  // Stop camera stream with performance cleanup
  async stopCamera(): Promise<void> {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }

    // Stop performance monitoring
    cameraPerformanceOptimizer.stopFrameRateMonitoring();

    console.log('[Camera] Camera stopped');
  }

  // Capture photo
  async capturePhoto(options: CameraOptions = {}): Promise<PhotoCaptureResult | null> {
    if (!this.stream || !this.videoElement) {
      console.warn('[Camera] No active camera stream');
      return null;
    }

    try {
      // Create canvas if not exists
      if (!this.canvasElement) {
        this.canvasElement = document.createElement('canvas');
      }

      const canvas = this.canvasElement;
      const video = this.videoElement;
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Could not get canvas context');
      }

      // Set canvas size to video dimensions or specified size
      const width = options.width || video.videoWidth || 1920;
      const height = options.height || video.videoHeight || 1080;

      canvas.width = width;
      canvas.height = height;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, width, height);

      // Get location if available
      let location: GeolocationCoordinates | undefined;
      try {
        location = await this.getCurrentLocation();
      } catch (error) {
        console.warn('[Camera] Could not get location:', error);
      }

      // Convert to blob
      const quality = options.quality || 0.8;
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob!);
        }, 'image/jpeg', quality);
      });

      const dataUrl = canvas.toDataURL('image/jpeg', quality);

      const result: PhotoCaptureResult = {
        blob,
        dataUrl,
        width,
        height,
        timestamp: Date.now(),
        location
      };

      console.log('[Camera] Photo captured successfully');
      return result;
    } catch (error) {
      console.error('[Camera] Error capturing photo:', error);
      return null;
    }
  }

  // Switch camera (front/back)
  async switchCamera(): Promise<boolean> {
    if (!this.videoElement) {
      console.warn('[Camera] No video element available');
      return false;
    }

    const currentFacingMode = this.stream?.getVideoTracks()[0]?.getSettings().facingMode;
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';

    try {
      await this.startCamera(this.videoElement, { facingMode: newFacingMode });
      return true;
    } catch (error) {
      console.error('[Camera] Error switching camera:', error);
      return false;
    }
  }

  // Toggle flash/torch
  async toggleFlash(enabled: boolean): Promise<boolean> {
    if (!this.stream || !this.capabilities?.supportsFlash) {
      return false;
    }

    try {
      const videoTrack = this.stream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities();

      if ('torch' in capabilities) {
        await videoTrack.applyConstraints({
          advanced: [{ torch: enabled } as any]
        });
        return true;
      }
    } catch (error) {
      console.error('[Camera] Error toggling flash:', error);
    }

    return false;
  }

  // Get current location
  private async getCurrentLocation(): Promise<GeolocationCoordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position.coords),
        (error) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  // Get camera capabilities
  getCapabilities(): CameraCapabilities | null {
    return this.capabilities;
  }

  // Check if camera is currently active
  isActive(): boolean {
    return !!this.stream && !!this.videoElement;
  }

  // Get supported resolutions
  getSupportedResolutions(): Array<{ width: number; height: number; label: string }> {
    if (!this.capabilities?.hasCamera) {
      return [];
    }

    return [
      { width: 640, height: 480, label: '480p' },
      { width: 1280, height: 720, label: '720p' },
      { width: 1920, height: 1080, label: '1080p' },
      { width: 3840, height: 2160, label: '4K' }
    ].filter(res =>
      res.width <= this.capabilities!.maxResolution.width &&
      res.height <= this.capabilities!.maxResolution.height
    );
  }

  // Clean up resources with performance cleanup
  destroy(): void {
    this.stopCamera();
    this.capabilities = null;
    this.canvasElement = null;

    // Clean up performance optimizer
    cameraPerformanceOptimizer.destroy();

    console.log('[Camera] Camera service destroyed');
  }
}

// Global instance
const cameraService = new CameraService();

export default cameraService;
export { CameraService };