/**
 * Property Check-In Component
 * Mobile-optimized property check-in with GPS verification
 * Epic 21.5.2 - Mobile Experience Enhancement
 */

import React, { useState, useEffect, useCallback } from 'react';
import locationService, {
  type PropertyLocation,
  type CheckInResult,
  type LocationPermissions
} from '../utils/locationService';
import './PropertyCheckIn.css';

interface PropertyCheckInProps {
  properties: PropertyLocation[];
  onCheckIn?: (result: CheckInResult) => void;
  onClose?: () => void;
  className?: string;
  autoCheckIn?: boolean;
  checkInRadius?: number; // in meters
}

const PropertyCheckIn: React.FC<PropertyCheckInProps> = ({
  properties,
  onCheckIn,
  onClose,
  className = '',
  autoCheckIn = false,
  checkInRadius = 100
}) => {
  const [permissions, setPermissions] = useState<LocationPermissions>({
    granted: false,
    denied: false,
    prompt: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [nearbyProperties, setNearbyProperties] = useState<PropertyLocation[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<PropertyLocation | null>(null);
  const [checkInResult, setCheckInResult] = useState<CheckInResult | null>(null);
  const [error, setError] = useState<string>('');

  // Request location permissions on mount
  useEffect(() => {
    const requestPermissions = async () => {
      const result = await locationService.requestPermissions();
      setPermissions(result.permissions);

      if (result.permissions.granted) {
        startLocationTracking();
      }
    };

    requestPermissions();
  }, []);

  // Start location tracking
  const startLocationTracking = useCallback(() => {
    locationService.startWatchingPosition();

    // Subscribe to position updates
    const unsubscribe = locationService.onPositionUpdate((position) => {
      const locationString = `${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}`;
      setCurrentLocation(locationString);

      // Find nearby properties
      const nearby = locationService.findNearbyProperties(properties, 1000, position);
      setNearbyProperties(nearby);

      // Auto check-in if enabled and only one property nearby
      if (autoCheckIn && nearby.length === 1 && !checkInResult) {
        handleCheckIn(nearby[0]);
      }
    });

    // Subscribe to errors
    const unsubscribeError = locationService.onPositionError((error) => {
      console.error('Location error:', error);
      setError(`Location error: ${error.message}`);
    });

    return () => {
      unsubscribe();
      unsubscribeError();
      locationService.stopWatchingPosition();
    };
  }, [properties, autoCheckIn, checkInResult]);

  // Handle manual check-in
  const handleCheckIn = useCallback(async (property: PropertyLocation) => {
    if (!permissions.granted) {
      setError('Location permission required for check-in');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = locationService.checkInToProperty(property);

      if (result.withinRange) {
        setCheckInResult(result);
        setSelectedProperty(property);

        if (onCheckIn) {
          onCheckIn(result);
        }

        // Provide haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate([50, 50, 50]);
        }
      } else {
        setError(`You're ${Math.round(result.distance)}m away from ${property.name}. Please get closer to check in.`);
      }
    } catch (error) {
      console.error('Check-in error:', error);
      setError('Failed to check in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [permissions.granted, onCheckIn]);

  // Request permissions
  const handleRequestPermissions = useCallback(async () => {
    const result = await locationService.requestPermissions();
    setPermissions(result.permissions);

    if (result.permissions.granted) {
      startLocationTracking();
    }
  }, [startLocationTracking]);

  // Get distance text
  const getDistanceText = (property: PropertyLocation): string => {
    const location = locationService.getCurrentPositionCached();
    if (!location) return 'Distance unknown';

    const distance = locationService.calculateDistance(
      location.latitude,
      location.longitude,
      property.coordinates.latitude,
      property.coordinates.longitude
    );

    return locationService.formatDistance(distance);
  };

  // Get check-in status
  const getCheckInStatus = (property: PropertyLocation): 'available' | 'too_far' | 'checked_in' => {
    if (checkInResult?.propertyId === property.id) return 'checked_in';

    const location = locationService.getCurrentPositionCached();
    if (!location) return 'available';

    const distance = locationService.calculateDistance(
      location.latitude,
      location.longitude,
      property.coordinates.latitude,
      property.coordinates.longitude
    );

    return distance <= checkInRadius ? 'available' : 'too_far';
  };

  if (!permissions.granted && !permissions.prompt) {
    return (
      <div className={`property-checkin permission-denied ${className}`}>
        <div className="checkin-header">
          <h3>Location Permission Required</h3>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="permission-content">
          <div className="permission-icon">📍</div>
          <p>To check in to properties, we need access to your location.</p>
          <button
            className="permission-button"
            onClick={handleRequestPermissions}
          >
            Grant Location Access
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`property-checkin ${className}`}>
      {/* Header */}
      <div className="checkin-header">
        <h3>Property Check-In</h3>
        <button className="close-button" onClick={onClose}>
          ✕
        </button>
      </div>

      {/* Current Location */}
      {currentLocation && (
        <div className="current-location">
          <span className="location-icon">📍</span>
          <span className="location-text">{currentLocation}</span>
        </div>
      )}

      {/* Check-in Result */}
      {checkInResult && selectedProperty && (
        <div className="checkin-success">
          <div className="success-icon">✅</div>
          <div className="success-content">
            <h4>Checked In!</h4>
            <p>{selectedProperty.name}</p>
            <small>{new Date(checkInResult.timestamp).toLocaleTimeString()}</small>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="checkin-error">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
        </div>
      )}

      {/* Properties List */}
      <div className="properties-list">
        {nearbyProperties.length === 0 ? (
          <div className="no-properties">
            <p>No properties nearby</p>
            <small>Get closer to a property to check in</small>
          </div>
        ) : (
          nearbyProperties.map((property) => {
            const status = getCheckInStatus(property);
            const distance = getDistanceText(property);

            return (
              <div key={property.id} className={`property-item ${status}`}>
                <div className="property-info">
                  <h4>{property.name}</h4>
                  <p>{property.address}</p>
                  <small>{distance} away</small>
                </div>

                <div className="property-actions">
                  {status === 'checked_in' ? (
                    <div className="checked-in-badge">
                      <span>✅</span>
                      <span>Checked In</span>
                    </div>
                  ) : (
                    <button
                      className="checkin-button"
                      onClick={() => handleCheckIn(property)}
                      disabled={isLoading || status === 'too_far'}
                    >
                      {isLoading ? 'Checking...' : 'Check In'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Checking location...</p>
        </div>
      )}
    </div>
  );
};

export default PropertyCheckIn;