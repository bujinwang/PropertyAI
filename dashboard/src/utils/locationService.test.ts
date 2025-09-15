/**
 * Location Service Unit Tests
 * Epic 21.5.2 - Mobile Experience Enhancement
 */

import locationService, { LocationService } from './locationService';

describe('LocationService', () => {
  let locationServiceInstance: LocationService;

  beforeEach(() => {
    locationServiceInstance = new LocationService();
    // Clear any existing mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Secure Context Validation', () => {
    it('should detect secure context correctly', () => {
      // Test secure context
      Object.defineProperty(window, 'location', {
        value: { protocol: 'https:', hostname: 'example.com' },
        writable: true
      });

      // Access private method through type assertion
      const isSecure = (locationServiceInstance as any).isSecureContext();
      expect(isSecure).toBe(true);
    });

    it('should detect insecure context correctly', () => {
      // Test insecure context
      Object.defineProperty(window, 'location', {
        value: { protocol: 'http:', hostname: 'example.com' },
        writable: true
      });

      const isSecure = (locationServiceInstance as any).isSecureContext();
      expect(isSecure).toBe(false);
    });

    it('should allow localhost as secure context', () => {
      Object.defineProperty(window, 'location', {
        value: { protocol: 'http:', hostname: 'localhost' },
        writable: true
      });

      const isSecure = (locationServiceInstance as any).isSecureContext();
      expect(isSecure).toBe(true);
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

    it('should handle geolocation not supported', async () => {
      // Mock navigator.geolocation as undefined
      const originalGeolocation = navigator.geolocation;
      Object.defineProperty(navigator, 'geolocation', {
        value: undefined,
        writable: true
      });

      const result = await locationServiceInstance.requestPermissions();

      expect(result.permissions.granted).toBe(false);
      expect(result.permissions.denied).toBe(true);
      expect(result.permissions.prompt).toBe(false);
      expect(result.secureContext).toBe(true);
      expect(result.error).toBe('Geolocation not supported by this browser');

      // Restore original geolocation
      Object.defineProperty(navigator, 'geolocation', {
        value: originalGeolocation,
        writable: true
      });
    });

    it('should handle granted permissions', async () => {
      // Mock permissions API
      const mockPermissions = {
        query: jest.fn().mockResolvedValue({ state: 'granted' })
      };
      Object.defineProperty(navigator, 'permissions', {
        value: mockPermissions,
        writable: true
      });

      const result = await locationServiceInstance.requestPermissions();

      expect(result.permissions.granted).toBe(true);
      expect(result.permissions.denied).toBe(false);
      expect(result.permissions.prompt).toBe(false);
      expect(result.secureContext).toBe(true);
    });

    it('should handle denied permissions', async () => {
      const mockPermissions = {
        query: jest.fn().mockResolvedValue({ state: 'denied' })
      };
      Object.defineProperty(navigator, 'permissions', {
        value: mockPermissions,
        writable: true
      });

      const result = await locationServiceInstance.requestPermissions();

      expect(result.permissions.granted).toBe(false);
      expect(result.permissions.denied).toBe(true);
      expect(result.permissions.prompt).toBe(false);
      expect(result.secureContext).toBe(true);
      expect(result.error).toBe('Location permission denied by user');
    });

    it('should handle prompt permissions', async () => {
      const mockPermissions = {
        query: jest.fn().mockResolvedValue({ state: 'prompt' })
      };
      Object.defineProperty(navigator, 'permissions', {
        value: mockPermissions,
        writable: true
      });

      // Mock successful geolocation test
      const mockGeolocation = {
        getCurrentPosition: jest.fn().mockImplementation((success) => {
          success({
            coords: {
              latitude: 40.7128,
              longitude: -74.0060,
              accuracy: 10,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null
            },
            timestamp: Date.now()
          });
        })
      };
      Object.defineProperty(navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true
      });

      const result = await locationServiceInstance.requestPermissions();

      expect(result.permissions.granted).toBe(true);
      expect(result.permissions.denied).toBe(false);
      expect(result.permissions.prompt).toBe(false);
      expect(result.secureContext).toBe(true);
    });

    it('should handle geolocation errors during permission test', async () => {
      const mockPermissions = {
        query: jest.fn().mockResolvedValue({ state: 'prompt' })
      };
      Object.defineProperty(navigator, 'permissions', {
        value: mockPermissions,
        writable: true
      });

      // Mock geolocation error
      const mockGeolocation = {
        getCurrentPosition: jest.fn().mockImplementation((success, error) => {
          error({ code: 1, message: 'User denied geolocation' });
        })
      };
      Object.defineProperty(navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true
      });

      const result = await locationServiceInstance.requestPermissions();

      expect(result.permissions.granted).toBe(false);
      expect(result.permissions.denied).toBe(true);
      expect(result.permissions.prompt).toBe(false);
      expect(result.secureContext).toBe(true);
      expect(result.error).toBe('Location permission denied by user');
    });
  });

  describe('Position Retrieval', () => {
    beforeEach(() => {
      // Mock successful geolocation
      const mockGeolocation = {
        getCurrentPosition: jest.fn().mockImplementation((success) => {
          success({
            coords: {
              latitude: 40.7128,
              longitude: -74.0060,
              accuracy: 10,
              altitude: 100,
              altitudeAccuracy: 5,
              heading: 90,
              speed: 5
            },
            timestamp: Date.now()
          });
        })
      };
      Object.defineProperty(navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true
      });
    });

    it('should get current position successfully', async () => {
      const position = await locationServiceInstance.getCurrentPosition();

      expect(position.latitude).toBe(40.7128);
      expect(position.longitude).toBe(-74.0060);
      expect(position.accuracy).toBe(10);
      expect(position.altitude).toBe(100);
      expect(position.altitudeAccuracy).toBe(5);
      expect(position.heading).toBe(90);
      expect(position.speed).toBe(5);
      expect(typeof position.timestamp).toBe('number');
    });

    it('should handle custom position options', async () => {
      const options = {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 60000
      };

      const position = await locationServiceInstance.getCurrentPosition(options);

      expect(position.latitude).toBe(40.7128);
      expect(position.longitude).toBe(-74.0060);
    });

    it('should handle geolocation errors', async () => {
      const mockGeolocation = {
        getCurrentPosition: jest.fn().mockImplementation((success, error) => {
          error({ code: 2, message: 'Position unavailable' });
        })
      };
      Object.defineProperty(navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true
      });

      await expect(locationServiceInstance.getCurrentPosition()).rejects.toThrow();
    });
  });

  describe('Position Watching', () => {
    it('should start watching position', () => {
      const mockGeolocation = {
        watchPosition: jest.fn().mockReturnValue(123)
      };
      Object.defineProperty(navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true
      });

      locationServiceInstance.startWatchingPosition();

      expect(mockGeolocation.watchPosition).toHaveBeenCalled();
      expect(locationServiceInstance.isWatching()).toBe(true);
    });

    it('should stop watching position', () => {
      const mockGeolocation = {
        watchPosition: jest.fn().mockReturnValue(123),
        clearWatch: jest.fn()
      };
      Object.defineProperty(navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true
      });

      locationServiceInstance.startWatchingPosition();
      locationServiceInstance.stopWatchingPosition();

      expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(123);
      expect(locationServiceInstance.isWatching()).toBe(false);
    });

    it('should handle watch position errors', () => {
      const mockGeolocation = {
        watchPosition: jest.fn().mockImplementation((success, error) => {
          error({ code: 3, message: 'Timeout' });
        })
      };
      Object.defineProperty(navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true
      });

      // Should not throw, just log error
      expect(() => locationServiceInstance.startWatchingPosition()).not.toThrow();
    });
  });

  describe('Distance Calculations', () => {
    it('should calculate distance correctly', () => {
      // Test with known coordinates (New York to London)
      const nycLat = 40.7128;
      const nycLon = -74.0060;
      const londonLat = 51.5074;
      const londonLon = -0.1278;

      const distance = locationServiceInstance.calculateDistance(
        nycLat, nycLon, londonLat, londonLon
      );

      // Approximate distance should be around 5570 km
      expect(distance).toBeGreaterThan(5500000); // 5500 km in meters
      expect(distance).toBeLessThan(5700000); // 5700 km in meters
    });

    it('should handle same coordinates', () => {
      const distance = locationServiceInstance.calculateDistance(
        40.7128, -74.0060, 40.7128, -74.0060
      );

      expect(distance).toBe(0);
    });
  });

  describe('Property Check-in', () => {
    const mockProperty = {
      id: 'prop-1',
      name: 'Test Property',
      address: '123 Test St',
      coordinates: { latitude: 40.7128, longitude: -74.0060 },
      radius: 100
    };

    beforeEach(() => {
      // Set current position
      (locationServiceInstance as any).currentPosition = {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        timestamp: Date.now()
      };
    });

    it('should check in within range', () => {
      const result = locationServiceInstance.checkInToProperty(mockProperty);

      expect(result.propertyId).toBe('prop-1');
      expect(result.propertyName).toBe('Test Property');
      expect(result.withinRange).toBe(true);
      expect(result.distance).toBe(0);
    });

    it('should handle check-in outside range', () => {
      // Set position far from property
      (locationServiceInstance as any).currentPosition = {
        latitude: 40.8,
        longitude: -74.1,
        accuracy: 10,
        timestamp: Date.now()
      };

      const result = locationServiceInstance.checkInToProperty(mockProperty);

      expect(result.withinRange).toBe(false);
      expect(result.distance).toBeGreaterThan(100);
    });

    it('should throw error when no location available', () => {
      (locationServiceInstance as any).currentPosition = null;

      expect(() => locationServiceInstance.checkInToProperty(mockProperty))
        .toThrow('No location available for check-in');
    });
  });

  describe('Nearby Properties', () => {
    const properties = [
      {
        id: 'prop-1',
        name: 'Nearby Property',
        address: '123 Near St',
        coordinates: { latitude: 40.7128, longitude: -74.0060 },
        radius: 100
      },
      {
        id: 'prop-2',
        name: 'Far Property',
        address: '456 Far St',
        coordinates: { latitude: 40.8, longitude: -74.1 },
        radius: 100
      }
    ];

    beforeEach(() => {
      (locationServiceInstance as any).currentPosition = {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        timestamp: Date.now()
      };
    });

    it('should find nearby properties within range', () => {
      const nearby = locationServiceInstance.findNearbyProperties(properties, 1000);

      expect(nearby).toHaveLength(1);
      expect(nearby[0].id).toBe('prop-1');
    });

    it('should return empty array when no properties nearby', () => {
      const nearby = locationServiceInstance.findNearbyProperties(properties, 10);

      expect(nearby).toHaveLength(0);
    });

    it('should sort properties by distance', () => {
      const nearby = locationServiceInstance.findNearbyProperties(properties, 20000);

      expect(nearby).toHaveLength(2);
      expect(nearby[0].id).toBe('prop-1'); // Closer property first
      expect(nearby[1].id).toBe('prop-2');
    });

    it('should return empty array when no current position', () => {
      (locationServiceInstance as any).currentPosition = null;

      const nearby = locationServiceInstance.findNearbyProperties(properties, 1000);

      expect(nearby).toHaveLength(0);
    });
  });

  describe('Route Calculation', () => {
    const mockProperty = {
      id: 'prop-1',
      name: 'Test Property',
      address: '123 Test St',
      coordinates: { latitude: 40.7128, longitude: -74.0060 },
      radius: 100
    };

    beforeEach(() => {
      (locationServiceInstance as any).currentPosition = {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        timestamp: Date.now()
      };
    });

    it('should calculate route successfully', async () => {
      const route = await locationServiceInstance.getRouteToProperty(mockProperty);

      expect(route).not.toBeNull();
      expect(route?.distance).toBeGreaterThan(0);
      expect(route?.duration).toBeGreaterThan(0);
      expect(route?.steps).toHaveLength(1);
    });

    it('should return null when no current position', async () => {
      (locationServiceInstance as any).currentPosition = null;

      const route = await locationServiceInstance.getRouteToProperty(mockProperty);

      expect(route).toBeNull();
    });
  });

  describe('Utility Functions', () => {
    it('should format distance correctly', () => {
      expect(locationServiceInstance.formatDistance(50)).toBe('50m');
      expect(locationServiceInstance.formatDistance(1500)).toBe('1.5km');
      expect(locationServiceInstance.formatDistance(0)).toBe('0m');
    });

    it('should format duration correctly', () => {
      expect(locationServiceInstance.formatDuration(65)).toBe('2min');
      expect(locationServiceInstance.formatDuration(3665)).toBe('1h 1min');
      expect(locationServiceInstance.formatDuration(30)).toBe('1min');
    });

    it('should return cached position', () => {
      const mockPosition = {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        timestamp: Date.now()
      };

      (locationServiceInstance as any).currentPosition = mockPosition;

      expect(locationServiceInstance.getCurrentPositionCached()).toBe(mockPosition);
    });

    it('should check availability correctly', () => {
      expect(locationServiceInstance.isAvailable()).toBe(true);

      // Mock no geolocation
      const originalGeolocation = navigator.geolocation;
      Object.defineProperty(navigator, 'geolocation', {
        value: undefined,
        writable: true
      });

      expect(locationServiceInstance.isAvailable()).toBe(false);

      // Restore
      Object.defineProperty(navigator, 'geolocation', {
        value: originalGeolocation,
        writable: true
      });
    });
  });

  describe('Service Lifecycle', () => {
    it('should clean up resources on destroy', () => {
      const mockGeolocation = {
        watchPosition: jest.fn().mockReturnValue(123),
        clearWatch: jest.fn()
      };
      Object.defineProperty(navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true
      });

      locationServiceInstance.startWatchingPosition();

      // Mock some subscriptions
      (locationServiceInstance as any).positionCallbacks = [jest.fn()];
      (locationServiceInstance as any).errorCallbacks = [jest.fn()];

      locationServiceInstance.destroy();

      expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(123);
      expect((locationServiceInstance as any).positionCallbacks).toHaveLength(0);
      expect((locationServiceInstance as any).errorCallbacks).toHaveLength(0);
      expect((locationServiceInstance as any).currentPosition).toBeNull();
    });

    it('should handle position callbacks', () => {
      const callback = jest.fn();
      const unsubscribe = locationServiceInstance.onPositionUpdate(callback);

      // Simulate position update
      (locationServiceInstance as any).positionCallbacks.forEach((cb: Function) => {
        cb({ latitude: 40.7128, longitude: -74.0060, accuracy: 10, timestamp: Date.now() });
      });

      expect(callback).toHaveBeenCalled();

      // Test unsubscribe
      unsubscribe();
      expect((locationServiceInstance as any).positionCallbacks).toHaveLength(0);
    });

    it('should handle error callbacks', () => {
      const callback = jest.fn();
      const unsubscribe = locationServiceInstance.onPositionError(callback);

      // Simulate error
      (locationServiceInstance as any).errorCallbacks.forEach((cb: Function) => {
        cb({ code: 1, message: 'Permission denied' });
      });

      expect(callback).toHaveBeenCalled();

      // Test unsubscribe
      unsubscribe();
      expect((locationServiceInstance as any).errorCallbacks).toHaveLength(0);
    });
  });
});