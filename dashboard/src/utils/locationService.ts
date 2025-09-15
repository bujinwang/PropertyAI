/**
 * Location Service for Mobile Property Management
 * Handles GPS location, property check-ins, and routing
 * Epic 21.5.2 - Mobile Experience Enhancement
 */

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface PropertyLocation {
  id: string;
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  radius: number; // Check-in radius in meters
}

export interface CheckInResult {
  propertyId: string;
  propertyName: string;
  distance: number;
  withinRange: boolean;
  timestamp: number;
  coordinates: LocationCoordinates;
}

export interface RouteInfo {
  distance: number; // in meters
  duration: number; // in seconds
  steps: RouteStep[];
  polyline?: string; // encoded polyline for map display
}

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface LocationPermissions {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
}

class LocationService {
  private watchId: number | null = null;
  private currentPosition: LocationCoordinates | null = null;
  private positionCallbacks: ((position: LocationCoordinates) => void)[] = [];
  private errorCallbacks: ((error: GeolocationPositionError) => void)[] = [];

  constructor() {
    this.initializeGeolocation();
  }

  // Initialize geolocation capabilities
  private initializeGeolocation(): void {
    if (!navigator.geolocation) {
      console.warn('[Location] Geolocation not supported');
    }
  }

  // Enhanced permission validation with secure context and error categorization
  async requestPermissions(): Promise<{ permissions: LocationPermissions; secureContext: boolean; error?: string }> {
    // Check for secure context (recommended for geolocation)
    const isSecureContext = this.isSecureContext();
    if (!isSecureContext) {
      console.warn('[Location] Geolocation works better in secure contexts (HTTPS)');
    }

    if (!navigator.geolocation) {
      const error = 'Geolocation not supported by this browser';
      console.error('[Location]', error);
      return {
        permissions: { granted: false, denied: true, prompt: false },
        secureContext: isSecureContext,
        error
      };
    }

    // Check current permission state if permissions API is available
    if (navigator.permissions) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        const permissions: LocationPermissions = {
          granted: permission.state === 'granted',
          denied: permission.state === 'denied',
          prompt: permission.state === 'prompt'
        };

        // Listen for permission changes
        permission.addEventListener('change', () => {
          console.log('[Location] Permission state changed to:', permission.state);
        });

        return { permissions, secureContext: isSecureContext };
      } catch (error) {
        console.warn('[Location] Error checking permissions:', error);
      }
    }

    // Fallback: test actual geolocation access
    try {
      const position = await this.testGeolocationAccess();
      return {
        permissions: { granted: true, denied: false, prompt: false },
        secureContext: isSecureContext
      };
    } catch (error: any) {
      let errorMessage = 'Location access failed';
      let permissions: LocationPermissions = { granted: false, denied: false, prompt: true };

      if (error.code === 1) { // PERMISSION_DENIED
        errorMessage = 'Location permission denied by user';
        permissions = { granted: false, denied: true, prompt: false };
      } else if (error.code === 2) { // POSITION_UNAVAILABLE
        errorMessage = 'Location information unavailable';
        permissions = { granted: false, denied: false, prompt: false };
      } else if (error.code === 3) { // TIMEOUT
        errorMessage = 'Location request timed out';
        permissions = { granted: false, denied: false, prompt: true };
      }

      console.error('[Location]', errorMessage, error);
      return { permissions, secureContext: isSecureContext, error: errorMessage };
    }
  }

  // Test actual geolocation access
  private async testGeolocationAccess(): Promise<GeolocationCoordinates> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position.coords),
        (error) => reject(error),
        { timeout: 5000, enableHighAccuracy: false }
      );
    });
  }

  // Check if running in secure context
  private isSecureContext(): boolean {
    return window.location.protocol === 'https:' ||
           window.location.hostname === 'localhost' ||
           window.location.hostname === '127.0.0.1';
  }

  // Get current position
  async getCurrentPosition(options: PositionOptions = {}): Promise<LocationCoordinates> {
    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    };

    const finalOptions = { ...defaultOptions, ...options };

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coordinates: LocationCoordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude || undefined,
            altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined,
            timestamp: position.timestamp
          };

          this.currentPosition = coordinates;
          resolve(coordinates);
        },
        (error) => {
          console.error('[Location] Error getting position:', error);
          reject(error);
        },
        finalOptions
      );
    });
  }

  // Watch position changes
  startWatchingPosition(options: PositionOptions = {}): void {
    if (this.watchId !== null) {
      this.stopWatchingPosition();
    }

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000 // 30 seconds
    };

    const finalOptions = { ...defaultOptions, ...options };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const coordinates: LocationCoordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude || undefined,
          altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
          heading: position.coords.heading || undefined,
          speed: position.coords.speed || undefined,
          timestamp: position.timestamp
        };

        this.currentPosition = coordinates;
        this.positionCallbacks.forEach(callback => callback(coordinates));
      },
      (error) => {
        console.error('[Location] Watch position error:', error);
        this.errorCallbacks.forEach(callback => callback(error));
      },
      finalOptions
    );

    console.log('[Location] Started watching position');
  }

  // Stop watching position
  stopWatchingPosition(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      console.log('[Location] Stopped watching position');
    }
  }

  // Subscribe to position updates
  onPositionUpdate(callback: (position: LocationCoordinates) => void): () => void {
    this.positionCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.positionCallbacks.indexOf(callback);
      if (index > -1) {
        this.positionCallbacks.splice(index, 1);
      }
    };
  }

  // Subscribe to position errors
  onPositionError(callback: (error: GeolocationPositionError) => void): () => void {
    this.errorCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.errorCallbacks.indexOf(callback);
      if (index > -1) {
        this.errorCallbacks.splice(index, 1);
      }
    };
  }

  // Calculate distance between two points (Haversine formula)
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  // Check if user is within range of a property
  checkInToProperty(
    property: PropertyLocation,
    userLocation?: LocationCoordinates
  ): CheckInResult {
    const location = userLocation || this.currentPosition;

    if (!location) {
      throw new Error('No location available for check-in');
    }

    const distance = this.calculateDistance(
      location.latitude,
      location.longitude,
      property.coordinates.latitude,
      property.coordinates.longitude
    );

    const withinRange = distance <= property.radius;

    const result: CheckInResult = {
      propertyId: property.id,
      propertyName: property.name,
      distance,
      withinRange,
      timestamp: Date.now(),
      coordinates: location
    };

    console.log(`[Location] Check-in to ${property.name}: ${withinRange ? 'SUCCESS' : 'OUT_OF_RANGE'} (${Math.round(distance)}m)`);
    return result;
  }

  // Find nearby properties
  findNearbyProperties(
    properties: PropertyLocation[],
    maxDistance: number = 1000,
    userLocation?: LocationCoordinates
  ): PropertyLocation[] {
    const location = userLocation || this.currentPosition;

    if (!location) {
      return [];
    }

    return properties
      .map(property => ({
        ...property,
        distance: this.calculateDistance(
          location.latitude,
          location.longitude,
          property.coordinates.latitude,
          property.coordinates.longitude
        )
      }))
      .filter(property => property.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance);
  }

  // Get route to property (simplified - would integrate with mapping service)
  async getRouteToProperty(
    property: PropertyLocation,
    userLocation?: LocationCoordinates
  ): Promise<RouteInfo | null> {
    const location = userLocation || this.currentPosition;

    if (!location) {
      return null;
    }

    // This is a simplified implementation
    // In a real app, you would integrate with Google Maps, Mapbox, or similar service
    const distance = this.calculateDistance(
      location.latitude,
      location.longitude,
      property.coordinates.latitude,
      property.coordinates.longitude
    );

    // Estimate duration (assuming average walking speed of 1.4 m/s)
    const duration = Math.round(distance / 1.4);

    const routeInfo: RouteInfo = {
      distance,
      duration,
      steps: [
        {
          instruction: `Head toward ${property.name}`,
          distance,
          duration,
          coordinates: property.coordinates
        }
      ]
    };

    console.log(`[Location] Route to ${property.name}: ${Math.round(distance)}m, ${Math.round(duration / 60)}min`);
    return routeInfo;
  }

  // Format distance for display
  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  }

  // Format duration for display
  formatDuration(seconds: number): string {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes}min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}min`;
    }
  }

  // Get current position (cached)
  getCurrentPositionCached(): LocationCoordinates | null {
    return this.currentPosition;
  }

  // Check if location services are available
  isAvailable(): boolean {
    return !!navigator.geolocation;
  }

  // Check if currently watching position
  isWatching(): boolean {
    return this.watchId !== null;
  }

  // Clean up resources
  destroy(): void {
    this.stopWatchingPosition();
    this.positionCallbacks = [];
    this.errorCallbacks = [];
    this.currentPosition = null;
    console.log('[Location] Location service destroyed');
  }
}

// Global instance
const locationService = new LocationService();

export default locationService;
export { LocationService };