/**
 * Mobile Camera Component for Property Inspections
 * Provides camera interface for capturing property photos
 * Epic 21.5.2 - Mobile Experience Enhancement
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import cameraService, { type PhotoCaptureResult, type CameraCapabilities } from '../utils/cameraService';
import locationService from '../utils/locationService';
import './MobileCamera.css';

interface MobileCameraProps {
  onPhotoCapture?: (result: PhotoCaptureResult) => void;
  onClose?: () => void;
  className?: string;
  showLocation?: boolean;
  allowSwitchCamera?: boolean;
  captureMode?: 'single' | 'multiple';
}

const MobileCamera: React.FC<MobileCameraProps> = ({
  onPhotoCapture,
  onClose,
  className = '',
  showLocation = true,
  allowSwitchCamera = true,
  captureMode = 'single'
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capabilities, setCapabilities] = useState<CameraCapabilities | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<PhotoCaptureResult[]>([]);
  const [currentLocation, setCurrentLocation] = useState<string>('');

  // Initialize camera
  useEffect(() => {
    const initCamera = async () => {
      const caps = cameraService.getCapabilities();
      setCapabilities(caps);

      if (caps?.hasCamera) {
        const permissionGranted = await cameraService.requestPermission();
        if (permissionGranted && videoRef.current) {
          const started = await cameraService.startCamera(videoRef.current, {
            facingMode,
            width: 1920,
            height: 1080
          });
          setIsActive(started);
        }
      }
    };

    initCamera();

    return () => {
      cameraService.stopCamera();
    };
  }, [facingMode]);

  // Get location for display
  useEffect(() => {
    if (showLocation) {
      const updateLocation = async () => {
        try {
          const position = await locationService.getCurrentPosition();
          // Reverse geocode to get address (simplified)
          setCurrentLocation(`${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}`);
        } catch (error) {
          console.warn('Could not get location:', error);
        }
      };

      updateLocation();
    }
  }, [showLocation]);

  // Handle photo capture
  const handleCapture = useCallback(async () => {
    if (!isActive || isCapturing) return;

    setIsCapturing(true);

    try {
      const result = await cameraService.capturePhoto({
        width: 1920,
        height: 1080,
        quality: 0.8
      });

      if (result) {
        if (captureMode === 'multiple') {
          setCapturedPhotos(prev => [...prev, result]);
        }

        if (onPhotoCapture) {
          onPhotoCapture(result);
        }

        // Provide haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }

        // Visual feedback
        if (videoRef.current) {
          videoRef.current.style.transform = 'scale(0.95)';
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.style.transform = 'scale(1)';
            }
          }, 100);
        }
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
    } finally {
      setIsCapturing(false);
    }
  }, [isActive, isCapturing, captureMode, onPhotoCapture]);

  // Switch camera
  const handleSwitchCamera = useCallback(async () => {
    if (!allowSwitchCamera || !capabilities?.hasFrontCamera || !capabilities?.hasBackCamera) return;

    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);

    if (videoRef.current) {
      const switched = await cameraService.switchCamera();
      if (switched) {
        setFacingMode(newFacingMode);
      }
    }
  }, [facingMode, allowSwitchCamera, capabilities]);

  // Toggle flash
  const handleToggleFlash = useCallback(async () => {
    if (!capabilities?.supportsFlash) return;

    const newFlashState = !flashEnabled;
    const success = await cameraService.toggleFlash(newFlashState);
    if (success) {
      setFlashEnabled(newFlashState);
    }
  }, [flashEnabled, capabilities]);

  // Handle close
  const handleClose = useCallback(() => {
    cameraService.stopCamera();
    setIsActive(false);
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault();
        handleCapture();
      } else if (event.code === 'Escape') {
        event.preventDefault();
        handleClose();
      } else if (event.code === 'KeyC' && allowSwitchCamera) {
        event.preventDefault();
        handleSwitchCamera();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleCapture, handleClose, handleSwitchCamera, allowSwitchCamera]);

  if (!capabilities?.hasCamera) {
    return (
      <div className={`mobile-camera no-camera ${className}`}>
        <div className="camera-error">
          <div className="error-icon">📷</div>
          <h3>Camera Not Available</h3>
          <p>Your device doesn't have a camera or camera access is not supported.</p>
          <button className="close-button" onClick={handleClose}>
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`mobile-camera ${className}`}>
      {/* Camera View */}
      <div className="camera-container">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="camera-video"
        />

        {/* Camera Overlay */}
        <div className="camera-overlay">
          {/* Top Bar */}
          <div className="camera-top-bar">
            {showLocation && currentLocation && (
              <div className="location-indicator">
                📍 {currentLocation}
              </div>
            )}
            <button className="close-button" onClick={handleClose}>
              ✕
            </button>
          </div>

          {/* Capture Button */}
          <div className="camera-controls">
            <button
              className={`capture-button ${isCapturing ? 'capturing' : ''}`}
              onClick={handleCapture}
              disabled={!isActive || isCapturing}
            >
              <div className="capture-ring"></div>
            </button>
          </div>

          {/* Bottom Controls */}
          <div className="camera-bottom-controls">
            {allowSwitchCamera && capabilities?.hasFrontCamera && capabilities?.hasBackCamera && (
              <button
                className="control-button switch-camera"
                onClick={handleSwitchCamera}
                title="Switch Camera"
              >
                🔄
              </button>
            )}

            {capabilities?.supportsFlash && (
              <button
                className={`control-button flash ${flashEnabled ? 'active' : ''}`}
                onClick={handleToggleFlash}
                title="Toggle Flash"
              >
                ⚡
              </button>
            )}

            {captureMode === 'multiple' && (
              <div className="photo-counter">
                📸 {capturedPhotos.length}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden canvas for photo processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Instructions */}
      <div className="camera-instructions">
        <p>Tap to capture • Space/Enter to take photo • Esc to close</p>
        {allowSwitchCamera && <p>Press C to switch camera</p>}
      </div>
    </div>
  );
};

export default MobileCamera;