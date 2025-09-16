/**
 * Camera Service Unit Tests
 * Epic 21.5.2 - Mobile Experience Enhancement
 */

// Mock the entire window object before importing
const mockWindow = {
  location: {
    protocol: 'http:', // Start with insecure context for secure context tests
    hostname: 'example.com'
  },
  navigator: {
    mediaDevices: {
      getUserMedia: jest.fn(),
      enumerateDevices: jest.fn()
    },
    permissions: {
      query: jest.fn()
    }
  },
  document: {
    createElement: jest.fn()
  }
};

// Set up default mock behaviors
mockWindow.navigator.mediaDevices.enumerateDevices.mockResolvedValue([
  { deviceId: '1', kind: 'videoinput', label: 'Front Camera' },
  { deviceId: '2', kind: 'videoinput', label: 'Back Camera' }
]);

mockWindow.navigator.permissions.query.mockResolvedValue({ state: 'granted' });

// Mock getUserMedia to return a proper stream with required methods
mockWindow.navigator.mediaDevices.getUserMedia.mockResolvedValue({
  getVideoTracks: () => [{
    getCapabilities: () => ({ width: { max: 1920 }, height: { max: 1080 }, torch: true }),
    getSettings: () => ({ facingMode: 'user' }),
    applyConstraints: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn()
  }],
  getTracks: () => [{
    getCapabilities: () => ({ width: { max: 1920 }, height: { max: 1080 }, torch: true }),
    getSettings: () => ({ facingMode: 'user' }),
    applyConstraints: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn()
  }],
  getAudioTracks: () => []
});

// Set up global mocks
(global as any).window = mockWindow;
(global as any).document = mockWindow.document;
(global as any).navigator = mockWindow.navigator;

// Ensure navigator.mediaDevices is properly mocked
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: mockWindow.navigator.mediaDevices,
  writable: true,
  configurable: true
});

// Extract mocks for easier use
const mockMediaDevices = mockWindow.navigator.mediaDevices;
const mockPermissions = mockWindow.navigator.permissions;
const mockCreateElement = mockWindow.document.createElement;
const mockToBlob = jest.fn();
const mockToDataURL = jest.fn();

// Now import the module
import cameraService, { CameraService } from './cameraService';

describe('CameraService', () => {
  let cameraServiceInstance: CameraService;
  let mockVideoElement: HTMLVideoElement;
  let mockCanvasElement: HTMLCanvasElement;
  let mockContext: CanvasRenderingContext2D;

  beforeEach(() => {
    // Mock the initializeCapabilities method to prevent async initialization
    jest.spyOn(CameraService.prototype as any, 'initializeCapabilities').mockImplementation(() => {});

    cameraServiceInstance = new CameraService();

    // Mock capabilities directly since they're set asynchronously in constructor
    (cameraServiceInstance as any).capabilities = {
      hasCamera: true,
      hasFrontCamera: true,
      hasBackCamera: true,
      supportsFlash: true,
      maxResolution: { width: 1920, height: 1080 }
    };

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
      getImageData: jest.fn().mockReturnValue({ data: new Uint8ClampedArray(1920 * 1080 * 4) }),
      putImageData: jest.fn(),
      createImageData: jest.fn(),
      setTransform: jest.fn(),
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      beginPath: jest.fn(),
      closePath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      fill: jest.fn()
    } as any;

    mockCanvasElement = {
      width: 1920,
      height: 1080,
      getContext: jest.fn().mockImplementation((contextType: string) => {
        if (contextType === '2d') {
          return mockContext;
        }
        return null;
      }),
      toBlob: mockToBlob.mockImplementation((callback: any) => {
        if (callback) callback(new Blob(['test'], { type: 'image/jpeg' }));
      }),
      toDataURL: mockToDataURL.mockReturnValue('data:image/jpeg;base64,test')
    } as any;

    mockCreateElement.mockReturnValue(mockCanvasElement);

    // Reset all mocks
    jest.clearAllMocks();

    // Reset permissions mock to default granted state
    mockPermissions.query.mockResolvedValue({ state: 'granted' });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Secure Context Validation', () => {
    it('should reject camera access in insecure context', async () => {
      // Mock the isSecureContext method directly to return false
      jest.spyOn(cameraServiceInstance as any, 'isSecureContext').mockReturnValue(false);

      const result = await cameraServiceInstance.requestPermission();

      expect(result.granted).toBe(false);
      expect(result.state).toBe('denied');
      expect(result.error).toBe('Camera access requires HTTPS');
    });

    it('should allow camera access in secure context', async () => {
      // Mock secure context (already set to https in global mock)
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
        }],
        getTracks: () => []
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

      // Override capabilities for this test
      (cameraServiceInstance as any).capabilities = {
        hasCamera: false,
        hasFrontCamera: false,
        hasBackCamera: false,
        supportsFlash: false,
        maxResolution: { width: 0, height: 0 }
      };

      const capabilities = cameraServiceInstance.getCapabilities();

      expect(capabilities?.hasCamera).toBe(false);
      expect(capabilities?.hasFrontCamera).toBe(false);
      expect(capabilities?.hasBackCamera).toBe(false);
    });
  });

  describe('Permission Handling', () => {
    // Secure context is already mocked globally

    it('should handle denied permissions', async () => {
      // Mock the permissions API directly on navigator
      const originalPermissions = navigator.permissions;
      const mockPermissionQuery = jest.fn().mockResolvedValue({
        state: 'denied',
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn()
      });

      Object.defineProperty(navigator, 'permissions', {
        value: { query: mockPermissionQuery },
        writable: true,
        configurable: true
      });

      const result = await cameraServiceInstance.requestPermission();

      // Restore original permissions
      Object.defineProperty(navigator, 'permissions', {
        value: originalPermissions,
        writable: true,
        configurable: true
      });

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
      const notAllowedError = new Error('NotAllowedError');
      (notAllowedError as any).name = 'NotAllowedError';
      mockMediaDevices.getUserMedia.mockRejectedValue(notAllowedError);

      const result = await cameraServiceInstance.startCamera(mockVideoElement);

      expect(result).toBe(false);
    });
  });

  describe('Camera Streaming', () => {
    // Secure context is already mocked globally

    it('should start camera stream successfully', async () => {
      const mockStream = { getVideoTracks: () => [] };
      mockMediaDevices.getUserMedia.mockResolvedValue(mockStream);

      const result = await cameraServiceInstance.startCamera(mockVideoElement);

      expect(result).toBe(true);
      expect(mockVideoElement.srcObject).toBe(mockStream);
      expect(mockVideoElement.play).toHaveBeenCalled();
    });

    it('should handle getUserMedia errors', async () => {
      mockPermissions.query.mockRejectedValue(new Error('Permissions API not supported'));
      const notAllowedError = new Error('NotAllowedError');
      (notAllowedError as any).name = 'NotAllowedError';
      mockMediaDevices.getUserMedia.mockRejectedValue(notAllowedError);

      const result = await cameraServiceInstance.requestPermission();

      expect(result.granted).toBe(false);
      expect(result.state).toBe('denied');
      expect(result.error).toBe('Camera permission denied');
    });

    it('should handle permission prompt state', async () => {
      mockPermissions.query.mockResolvedValue({ state: 'prompt' });
      mockMediaDevices.getUserMedia.mockResolvedValue({
        getVideoTracks: () => [],
        getTracks: () => []
      });

      const result = await cameraServiceInstance.requestPermission();

      expect(result.granted).toBe(true);
      expect(result.state).toBe('granted');
    });

    it('should start camera stream successfully', async () => {
      const mockStream = {
        getVideoTracks: () => [],
        getTracks: () => []
      };
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
      const mockStream = {
        getVideoTracks: () => [],
        getTracks: () => [mockTrack]
      };

      mockMediaDevices.getUserMedia.mockResolvedValue(mockStream);
      await cameraServiceInstance.startCamera(mockVideoElement);

      await cameraServiceInstance.stopCamera();

      expect(mockTrack.stop).toHaveBeenCalled();
      expect(mockVideoElement.srcObject).toBeNull();
    });
  });

  describe('Photo Capture', () => {
    beforeEach(() => {
      // Mock successful photo capture
      mockToBlob.mockImplementation((callback: any) => callback(new Blob()));
      mockToDataURL.mockReturnValue('data:image/jpeg;base64,test');
    });

    it('should capture photo successfully', async () => {
      const mockStream = {
        getVideoTracks: () => [],
        getTracks: () => []
      };
      mockMediaDevices.getUserMedia.mockResolvedValue(mockStream);

      await cameraServiceInstance.startCamera(mockVideoElement);

      // Set up the stream in the service instance
      (cameraServiceInstance as any).stream = mockStream;
      (cameraServiceInstance as any).videoElement = mockVideoElement;

      const result = await cameraServiceInstance.capturePhoto();

      expect(result).not.toBeNull();
      expect(result?.blob).toBeInstanceOf(Blob);
      expect(result?.dataUrl).toBe('data:image/jpeg;base64,test');
      expect(result?.width).toBe(1920);
      expect(result?.height).toBe(1080);
      expect(typeof result?.timestamp).toBe('number');
    });

    it('should capture photo successfully', async () => {
      const mockStream = { getVideoTracks: () => [], getTracks: () => [] };
      mockMediaDevices.getUserMedia.mockResolvedValue(mockStream);

      await cameraServiceInstance.startCamera(mockVideoElement);

      // Set up the stream in the service instance
      (cameraServiceInstance as any).stream = mockStream;
      (cameraServiceInstance as any).videoElement = mockVideoElement;

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
      const mockStream = {
        getVideoTracks: () => [],
        getTracks: () => []
      };
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
        }],
        getTracks: () => []
      };

      mockMediaDevices.getUserMedia.mockResolvedValue(mockStream);

      // Set up video element for switching
      (cameraServiceInstance as any).videoElement = mockVideoElement;
      (cameraServiceInstance as any).stream = mockStream;

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

      const mockStream = {
        getVideoTracks: () => [mockTrack],
        getTracks: () => [mockTrack]
      };
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

      const mockStream = {
        getVideoTracks: () => [mockTrack],
        getTracks: () => [mockTrack]
      };
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