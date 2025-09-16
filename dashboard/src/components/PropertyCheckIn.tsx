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

// Enhanced types for better UX
interface LoadingState {
  initializing: boolean;
  requestingPermissions: boolean;
  checkingIn: boolean;
  refreshingLocation: boolean;
}

interface RetryState {
  attempts: number;
  lastError: string | null;
  canRetry: boolean;
  operation: 'permissions' | 'checkin' | 'location' | null;
}

interface ProgressState {
  stage: 'idle' | 'initializing' | 'permissions' | 'location' | 'ready' | 'checking_in' | 'complete';
  progress: number;
  message: string;
}

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

  // Enhanced UX states
  const [loading, setLoading] = useState<LoadingState>({
    initializing: false,
    requestingPermissions: false,
    checkingIn: false,
    refreshingLocation: false
  });

  const [retry, setRetry] = useState<RetryState>({
    attempts: 0,
    lastError: null,
    canRetry: false,
    operation: null
  });

  const [progress, setProgress] = useState<ProgressState>({
    stage: 'idle',
    progress: 0,
    message: ''
  });

  const [showRetry, setShowRetry] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);

  // Enhanced permission request with progress tracking
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        setProgress({ stage: 'permissions', progress: 10, message: 'Requesting location permissions...' });
        setLoading(prev => ({ ...prev, requestingPermissions: true }));
        setError('');

        const result = await locationService.requestPermissions();
        setPermissions(result.permissions);
        setProgress({ stage: 'permissions', progress: 50, message: 'Permissions granted!' });

        if (result.permissions.granted) {
          setProgress({ stage: 'location', progress: 70, message: 'Starting location tracking...' });
          startLocationTracking();
        } else {
          setProgress({ stage: 'idle', progress: 0, message: '' });
          setRetry({
            attempts: 1,
            lastError: 'Location permission denied',
            canRetry: true,
            operation: 'permissions'
          });
          setShowRetry(true);
        }
      } catch (error) {
        console.error('Permission request error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to request permissions';
        setError(errorMessage);
        setRetry(prev => ({
          attempts: prev.attempts + 1,
          lastError: errorMessage,
          canRetry: prev.attempts < 2,
          operation: 'permissions'
        }));
        setShowRetry(true);
        setProgress({ stage: 'idle', progress: 0, message: '' });
      } finally {
        setLoading(prev => ({ ...prev, requestingPermissions: false }));
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

  // Enhanced check-in with progress tracking and retry
  const handleCheckIn = useCallback(async (property: PropertyLocation) => {
    if (!permissions.granted) {
      setError('Location permission required for check-in');
      setRetry({
        attempts: 1,
        lastError: 'Location permission required',
        canRetry: true,
        operation: 'permissions'
      });
      setShowRetry(true);
      return;
    }

    setLoading(prev => ({ ...prev, checkingIn: true }));
    setProgress({ stage: 'checking_in', progress: 10, message: 'Verifying location...' });
    setError('');
    setShowRetry(false);

    try {
      setProgress({ stage: 'checking_in', progress: 30, message: 'Checking distance...' });

      const result = locationService.checkInToProperty(property);
      setProgress({ stage: 'checking_in', progress: 70, message: 'Processing check-in...' });

      if (result.withinRange) {
        setProgress({ stage: 'complete', progress: 100, message: 'Check-in successful!' });
        setCheckInResult(result);
        setSelectedProperty(property);

        if (onCheckIn) {
          onCheckIn(result);
        }

        // Enhanced haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100]); // Success pattern
        }

        // Reset progress after success
        setTimeout(() => {
          setProgress({ stage: 'ready', progress: 100, message: '' });
        }, 2000);

        // Reset retry state on success
        setRetry({ attempts: 0, lastError: null, canRetry: false, operation: null });
      } else {
        const distance = Math.round(result.distance);
        const errorMessage = `You're ${distance}m away from ${property.name}. Please get closer to check in.`;
        setError(errorMessage);
        setRetry(prev => ({
          attempts: prev.attempts + 1,
          lastError: errorMessage,
          canRetry: prev.attempts < 2,
          operation: 'checkin'
        }));
        setShowRetry(true);
        setProgress({ stage: 'ready', progress: 100, message: '' });
      }
    } catch (error) {
      console.error('Check-in error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to check in. Please try again.';
      setError(errorMessage);
      setRetry(prev => ({
        attempts: prev.attempts + 1,
        lastError: errorMessage,
        canRetry: prev.attempts < 2,
        operation: 'checkin'
      }));
      setShowRetry(true);
      setProgress({ stage: 'ready', progress: 100, message: '' });
    } finally {
      setLoading(prev => ({ ...prev, checkingIn: false }));
    }
  }, [permissions.granted, onCheckIn]);

  // Enhanced permission request with retry
  const handleRequestPermissions = useCallback(async () => {
    setLoading(prev => ({ ...prev, requestingPermissions: true }));
    setProgress({ stage: 'permissions', progress: 10, message: 'Requesting permissions...' });
    setError('');
    setShowRetry(false);

    try {
      const result = await locationService.requestPermissions();
      setPermissions(result.permissions);
      setProgress({ stage: 'permissions', progress: 50, message: 'Permissions granted!' });

      if (result.permissions.granted) {
        setProgress({ stage: 'location', progress: 70, message: 'Starting location tracking...' });
        startLocationTracking();
        setRetry({ attempts: 0, lastError: null, canRetry: false, operation: null });
      } else {
        setProgress({ stage: 'idle', progress: 0, message: '' });
        setRetry(prev => ({
          attempts: prev.attempts + 1,
          lastError: 'Location permission denied',
          canRetry: prev.attempts < 2,
          operation: 'permissions'
        }));
        setShowRetry(true);
      }
    } catch (error) {
      console.error('Permission request error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to request permissions';
      setError(errorMessage);
      setRetry(prev => ({
        attempts: prev.attempts + 1,
        lastError: errorMessage,
        canRetry: prev.attempts < 2,
        operation: 'permissions'
      }));
      setShowRetry(true);
      setProgress({ stage: 'idle', progress: 0, message: '' });
    } finally {
      setLoading(prev => ({ ...prev, requestingPermissions: false }));
    }
  }, [startLocationTracking]);

  // Handle retry
  const handleRetry = useCallback(() => {
    setShowRetry(false);
    setError('');
    setRetry(prev => ({ ...prev, attempts: 0, lastError: null, canRetry: false, operation: null }));

    if (retry.operation === 'permissions') {
      handleRequestPermissions();
    } else if (retry.operation === 'checkin' && selectedProperty) {
      handleCheckIn(selectedProperty);
    }
  }, [retry.operation, selectedProperty, handleRequestPermissions, handleCheckIn]);

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
      {/* Enhanced Loading Overlay */}
      {(loading.requestingPermissions || loading.checkingIn) && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <div className="progress-container">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress.progress}%` }}
              ></div>
            </div>
            <p className="progress-message">{progress.message}</p>
          </div>
        </div>
      )}

      {/* Enhanced Error Overlay */}
      {error && showRetry && (
        <div className="error-overlay">
          <div className="error-content">
            <div className="error-icon">⚠️</div>
            <h3>Check-In Error</h3>
            <p>{error}</p>
            {retry.canRetry && (
              <div className="retry-options">
                <button className="retry-button" onClick={handleRetry}>
                  🔄 Retry ({retry.attempts}/3)
                </button>
                <button className="retry-init-button" onClick={handleRequestPermissions}>
                  🔧 Reinitialize Location
                </button>
              </div>
            )}
            <button className="close-error-button" onClick={() => setError('')}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="checkin-header">
        <h3>Property Check-In</h3>
        <button
          className="close-button"
          onClick={onClose}
          aria-label="Close check-in"
          disabled={loading.checkingIn || loading.requestingPermissions}
        >
          ✕
        </button>
      </div>

      {/* Current Location with Accuracy */}
      {currentLocation && (
        <div className="current-location" aria-label={`Current location: ${currentLocation}`}>
          <span className="location-icon" aria-hidden="true">📍</span>
          <span className="location-text">{currentLocation}</span>
          {locationAccuracy && (
            <span className="location-accuracy" aria-label={`Location accuracy: ${locationAccuracy} meters`}>
              ±{Math.round(locationAccuracy)}m
            </span>
          )}
        </div>
      )}

      {/* Progress Indicator */}
      {(progress.stage === 'checking_in' || progress.stage === 'complete') && (
        <div className="checkin-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress.progress}%` }}
            ></div>
          </div>
          <p className="progress-message">{progress.message}</p>
        </div>
      )}

      {/* Check-in Result */}
      {checkInResult && selectedProperty && (
        <div className="checkin-success" role="alert" aria-live="polite">
          <div className="success-icon" aria-hidden="true">✅</div>
          <div className="success-content">
            <h4>Checked In!</h4>
            <p>{selectedProperty.name}</p>
            <small>{new Date(checkInResult.timestamp).toLocaleTimeString()}</small>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && !showRetry && (
        <div className="checkin-error" role="alert" aria-live="assertive">
          <span className="error-icon" aria-hidden="true">⚠️</span>
          <span className="error-text">{error}</span>
        </div>
      )}

      {/* Properties List */}
      <div className="properties-list" role="list" aria-label="Nearby properties">
        {nearbyProperties.length === 0 ? (
          <div className="no-properties" role="status" aria-live="polite">
            <p>No properties nearby</p>
            <small>Get closer to a property to check in</small>
          </div>
        ) : (
          nearbyProperties.map((property) => {
            const status = getCheckInStatus(property);
            const distance = getDistanceText(property);

            return (
              <div
                key={property.id}
                className={`property-item ${status}`}
                role="listitem"
                aria-label={`${property.name} - ${distance} away - ${status === 'available' ? 'Available for check-in' : status === 'too_far' ? 'Too far away' : 'Already checked in'}`}
              >
                <div className="property-info">
                  <h4>{property.name}</h4>
                  <p>{property.address}</p>
                  <small aria-label={`Distance: ${distance}`}>{distance} away</small>
                </div>

                <div className="property-actions">
                  {status === 'checked_in' ? (
                    <div className="checked-in-badge" aria-label="Successfully checked in">
                      <span aria-hidden="true">✅</span>
                      <span>Checked In</span>
                    </div>
                  ) : (
                    <button
                      className={`checkin-button ${loading.checkingIn ? 'loading' : ''}`}
                      onClick={() => handleCheckIn(property)}
                      disabled={loading.checkingIn || loading.requestingPermissions || status === 'too_far'}
                      aria-label={status === 'too_far' ? `Check in to ${property.name} - Too far away (${distance})` : `Check in to ${property.name}`}
                    >
                      {loading.checkingIn ? (
                        <>
                          <span className="button-spinner" aria-hidden="true"></span>
                          Checking...
                        </>
                      ) : status === 'too_far' ? (
                        'Too Far'
                      ) : (
                        'Check In'
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Legacy Loading State (kept for backward compatibility) */}
      {isLoading && !loading.checkingIn && !loading.requestingPermissions && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Checking location...</p>
        </div>
      )}
    </div>
  );
};

export default PropertyCheckIn;