/**
 * Camera Service Unit Tests
 * Epic 21.5.2 - Mobile Experience Enhancement
 */

import cameraService, { CameraService } from './cameraService';

// Mock navigator.mediaDevices
const mockMediaDevices = {
  getUserMedia: jest.fn(),
  enumerateDevices: jest.fn()
};

// Mock navigator.permissions
const mockPermissions = {
  query: jest.fn()
};

// Mock document methods
const mockCreateElement = jest.fn();
const mockToBlob = jest.fn();
const mockToDataURL = jest.fn();

Object.defineProperty(navigator, 'mediaDevices', {
  value: mockMediaDevices,
  writable: true
});

Object.defineProperty(navigator, 'permissions', {
  value: mockPermissions,
  writable: true
});

Object.defineProperty(document, 'createElement', {
  value: mockCreateElement,
  writable: true
});

describe('CameraService', () => {
  let cameraServiceInstance: CameraService;
  let mockVideoElement: HTMLVideoElement;
  let mockCanvasElement: HTMLCanvasElement;
  let mockContext: CanvasRenderingContext2D;

  beforeEach(() => {
    cameraServiceInstance = new CameraService();

    // Mock video element
    mockVideoElement = {
      srcObject: null,
      play: jest.fn(),
      videoWidth: 1920,
      videoHeight: 1080
    } as any;

    // Mock canvas element and context
    mockContext = {
      drawImage: jest.fn(),
      getContext: jest.fn().mockReturnValue(mockContext)
    } as any;

    mockCanvasElement = {
      width: 1920,
      height: 1080,
      getContext: jest.fn().mockReturnValue(mockContext),
      toBlob: mockToBlob,
      toDataURL: mockToDataURL
    } as any;

    mockCreateElement.mockReturnValue(mockCanvasElement);

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Secure Context Validation', () => {
    it('should reject camera access in insecure context', async () => {
      // Mock insecure context
      Object.defineProperty(window, 'location', {
        value: { protocol: 'http:', hostname: 'example.com' },
        writable: true
      });

      const result = await cameraServiceInstance.requestPermission();

      expect(result.granted).toBe(false);
      expect(result.state).toBe('denied');
      expect(result.error).toBe('Camera access requires HTTPS');
    });

    it('should allow camera access in secure context', async () => {
      // Mock secure context
      Object.defineProperty(window, 'location', {
        value: { protocol: 'https:', hostname: 'example.com' },
        writable: true
      });

      // Mock successful permission check
      mockPermissions.query.mockResolvedValue({ state: 'granted' });

      const result = await cameraServiceInstance.requestPermission();

      expect(result.granted).toBe(true);
      expect(result.state).toBe('granted');
    });
  });

  describe('Capability Detection', () => {
    it('should detect camera capabilities successfully', async () => {
      const mockDevices = [
        { deviceId: '1', kind: 'videoinput', label: 'Front Camera' },
        { deviceId: '2', kind: 'videoinput', label: 'Back Camera' }
      ];

      mockMediaDevices.enumerateDevices.mockResolvedValue(mockDevices);
      mockMediaDevices.getUserMedia.mockResolvedValue({
        getVideoTracks: () => [{
          getCapabilities: () => ({ width: { max: 1920 }, height: { max: 1080 }, torch: true })
        }]
      });

      // Trigger capability detection
      const capabilities = cameraServiceInstance.getCapabilities();

      expect(capabilities?.hasCamera).toBe(true);
      expect(capabilities?.hasFrontCamera).toBe(true);
      expect(capabilities?.hasBackCamera).toBe(true);
      expect(capabilities?.supportsFlash).toBe(true);
    });

    it('should handle no camera available', async () => {
      mockMediaDevices.enumerateDevices.mockResolvedValue([]);

      const capabilities = cameraServiceInstance.getCapabilities();

      expect(capabilities?.hasCamera).toBe(false);
      expect(capabilities?.hasFrontCamera).toBe(false);
      expect(capabilities?.hasBackCamera).toBe(false);
    });
  });

  describe('Permission Handling', () => {
    beforeEach(() => {
      // Mock secure context
      Object.defineProperty(window, 'location', {
        value: { protocol: 'https:', hostname: 'example.com' },
        writable: true
      });
    });

    it('should handle denied permissions', async () => {
      mockPermissions.query.mockResolvedValue({ state: 'denied' });

      const result = await cameraServiceInstance.requestPermission();

      expect(result.granted).toBe(false);
      expect(result.state).toBe('denied');
      expect(result.error).toBe('Camera permission denied by user');
    });

    it('should handle granted permissions', async () => {
      mockPermissions.query.mockResolvedValue({ state: 'granted' });

      const result = await cameraServiceInstance.requestPermission();

      expect(result.granted).toBe(true);
      expect(result.state).toBe('granted');
    });

    it('should handle permission prompt state', async () => {
      mockPermissions.query.mockResolvedValue({ state: 'prompt' });
      mockMediaDevices.getUserMedia.mockResolvedValue({
        getTracks: () => []
      });

      const result = await cameraServiceInstance.requestPermission();

      expect(result.granted).toBe(true);
      expect(result.state).toBe('granted');
    });

    it('should handle getUserMedia errors', async () => {
      mockPermissions.query.mockRejectedValue(new Error('Permissions API not supported'));
      mockMediaDevices.getUserMedia.mockRejectedValue(new Error('NotAllowedError'));

      const result = await cameraServiceInstance.requestPermission();

      expect(result.granted).toBe(false);
      expect(result.state).toBe('denied');
      expect(result.error).toBe('Camera permission denied');
    });
  });

  describe('Camera Streaming', () => {
    beforeEach(() => {
      // Mock secure context and permissions
      Object.defineProperty(window, 'location', {
        value: { protocol: 'https:', hostname: 'example.com' },
        writable: true
      });
    });

    it('should start camera stream successfully', async () => {
      const mockStream = { getVideoTracks: () => [] };
      mockMediaDevices.getUserMedia.mockResolvedValue(mockStream);

      const result = await cameraServiceInstance.startCamera(mockVideoElement);

      expect(result).toBe(true);
      expect(mockVideoElement.srcObject).toBe(mockStream);
      expect(mockVideoElement.play).toHaveBeenCalled();
    });

    it('should handle camera start failure', async () => {
      mockMediaDevices.getUserMedia.mockRejectedValue(new Error('Camera unavailable'));

      const result = await cameraServiceInstance.startCamera(mockVideoElement);

      expect(result).toBe(false);
      expect(mockVideoElement.srcObject).toBeNull();
    });

    it('should stop camera stream', async () => {
      const mockTrack = { stop: jest.fn() };
      const mockStream = { getTracks: () => [mockTrack] };

      mockMediaDevices.getUserMedia.mockResolvedValue(mockStream);
      await cameraServiceInstance.startCamera(mockVideoElement);

      await cameraServiceInstance.stopCamera();

      expect(mockTrack.stop).toHaveBeenCalled();
      expect(mockVideoElement.srcObject).toBeNull();
    });
  });

  describe('Photo Capture', () => {
    beforeEach(() => {
      // Mock secure context
      Object.defineProperty(window, 'location', {
        value: { protocol: 'https:', hostname: 'example.com' },
        writable: true
      });

      // Mock successful photo capture
      mockToBlob.mockImplementation((callback: any) => callback(new Blob()));
      mockToDataURL.mockReturnValue('data:image/jpeg;base64,test');
    });

    it('should capture photo successfully', async () => {
      const mockStream = { getVideoTracks: () => [] };
      mockMediaDevices.getUserMedia.mockResolvedValue(mockStream);

      await cameraServiceInstance.startCamera(mockVideoElement);

      const result = await cameraServiceInstance.capturePhoto();

      expect(result).not.toBeNull();
      expect(result?.blob).toBeInstanceOf(Blob);
      expect(result?.dataUrl).toBe('data:image/jpeg;base64,test');
      expect(result?.width).toBe(1920);
      expect(result?.height).toBe(1080);
      expect(typeof result?.timestamp).toBe('number');
    });

    it('should handle capture without active stream', async () => {
      const result = await cameraServiceInstance.capturePhoto();

      expect(result).toBeNull();
    });

    it('should capture photo with custom options', async () => {
      const mockStream = { getVideoTracks: () => [] };
      mockMediaDevices.getUserMedia.mockResolvedValue(mockStream);

      await cameraServiceInstance.startCamera(mockVideoElement);

      const result = await cameraServiceInstance.capturePhoto({
        width: 1280,
        height: 720,
        quality: 0.9
      });

      expect(result?.width).toBe(1280);
      expect(result?.height).toBe(720);
    });
  });

  describe('Camera Switching', () => {
    it('should switch between front and back camera', async () => {
      const mockStream = {
        getVideoTracks: () => [{
          getSettings: () => ({ facingMode: 'user' })
        }]
      };

      mockMediaDevices.getUserMedia.mockResolvedValue(mockStream);

      const result = await cameraServiceInstance.switchCamera();

      expect(result).toBe(true);
      expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      });
    });
  });

  describe('Flash Control', () => {
    it('should toggle flash when supported', async () => {
      const mockTrack = {
        applyConstraints: jest.fn().mockResolvedValue(undefined),
        getCapabilities: () => ({ torch: true })
      };

      const mockStream = { getVideoTracks: () => [mockTrack] };
      mockMediaDevices.getUserMedia.mockResolvedValue(mockStream);

      await cameraServiceInstance.startCamera(mockVideoElement);

      const result = await cameraServiceInstance.toggleFlash(true);

      expect(result).toBe(true);
      expect(mockTrack.applyConstraints).toHaveBeenCalledWith({
        advanced: [{ torch: true }]
      });
    });

    it('should handle unsupported flash', async () => {
      const mockTrack = {
        getCapabilities: () => ({})
      };

      const mockStream = { getVideoTracks: () => [mockTrack] };
      mockMediaDevices.getUserMedia.mockResolvedValue(mockStream);

      await cameraServiceInstance.startCamera(mockVideoElement);

      const result = await cameraServiceInstance.toggleFlash(true);

      expect(result).toBe(false);
    });
  });

  describe('Supported Resolutions', () => {
    it('should return supported resolutions within capabilities', () => {
      // Mock capabilities
      (cameraServiceInstance as any).capabilities = {
        hasCamera: true,
        maxResolution: { width: 1920, height: 1080 }
      };

      const resolutions = cameraServiceInstance.getSupportedResolutions();

      expect(resolutions).toEqual([
        { width: 640, height: 480, label: '480p' },
        { width: 1280, height: 720, label: '720p' },
        { width: 1920, height: 1080, label: '1080p' }
      ]);
    });

    it('should return empty array when no camera available', () => {
      (cameraServiceInstance as any).capabilities = { hasCamera: false };

      const resolutions = cameraServiceInstance.getSupportedResolutions();

      expect(resolutions).toEqual([]);
    });
  });

  describe('Service Lifecycle', () => {
    it('should clean up resources on destroy', () => {
      const mockTrack = { stop: jest.fn() };
      const mockStream = { getTracks: () => [mockTrack] };

      (cameraServiceInstance as any).stream = mockStream;
      (cameraServiceInstance as any).videoElement = mockVideoElement;
      (cameraServiceInstance as any).canvasElement = mockCanvasElement;

      cameraServiceInstance.destroy();

      expect(mockTrack.stop).toHaveBeenCalled();
      expect((cameraServiceInstance as any).capabilities).toBeNull();
    });

    it('should report active status correctly', () => {
      expect(cameraServiceInstance.isActive()).toBe(false);

      (cameraServiceInstance as any).stream = {};
      (cameraServiceInstance as any).videoElement = mockVideoElement;

      expect(cameraServiceInstance.isActive()).toBe(true);
    });
  });
});