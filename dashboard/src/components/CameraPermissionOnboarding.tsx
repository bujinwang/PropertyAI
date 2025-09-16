/**
 * Camera Permission Onboarding Component
 * Guides users through camera permission process with clear explanations
 * Epic 21.5.2 - Mobile Experience Enhancement
 */

import React, { useState, useEffect } from 'react';
import cameraService from '../utils/cameraService';
import './CameraPermissionOnboarding.css';

interface CameraPermissionOnboardingProps {
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
  onClose?: () => void;
  className?: string;
  autoStart?: boolean;
}

const CameraPermissionOnboarding: React.FC<CameraPermissionOnboardingProps> = ({
  onPermissionGranted,
  onPermissionDenied,
  onClose,
  className = '',
  autoStart = true
}) => {
  const [step, setStep] = useState<'welcome' | 'explain' | 'request' | 'success' | 'error'>('welcome');
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string>('');

  // Auto-start the flow
  useEffect(() => {
    if (autoStart) {
      const timer = setTimeout(() => setStep('explain'), 1000);
      return () => clearTimeout(timer);
    }
  }, [autoStart]);

  // Handle permission request
  const handleRequestPermission = async () => {
    setIsRequesting(true);
    setError('');

    try {
      const granted = await cameraService.requestPermission();

      if (granted) {
        setStep('success');
        if (onPermissionGranted) {
          setTimeout(onPermissionGranted, 1500); // Brief success display
        }
      } else {
        setStep('error');
        if (onPermissionDenied) {
          onPermissionDenied();
        }
      }
    } catch (error) {
      console.error('Permission request error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to request camera permission';
      setError(errorMessage);
      setStep('error');
    } finally {
      setIsRequesting(false);
    }
  };

  // Handle step navigation
  const handleNext = () => {
    if (step === 'welcome') setStep('explain');
    else if (step === 'explain') setStep('request');
  };

  const handleBack = () => {
    if (step === 'explain') setStep('welcome');
    else if (step === 'request') setStep('explain');
  };

  const handleRetry = () => {
    setStep('request');
    setError('');
  };

  // Welcome Step
  if (step === 'welcome') {
    return (
      <div className={`camera-onboarding ${className}`}>
        <div className="onboarding-header">
          <div className="camera-icon">📷</div>
          <h2>Welcome to Camera Features</h2>
          <button className="close-button" onClick={onClose} aria-label="Close onboarding">
            ✕
          </button>
        </div>

        <div className="onboarding-content">
          <div className="feature-preview">
            <div className="preview-item">
              <span className="preview-icon">🏠</span>
              <span>Property Photos</span>
            </div>
            <div className="preview-item">
              <span className="preview-icon">📍</span>
              <span>Location Tagging</span>
            </div>
            <div className="preview-item">
              <span className="preview-icon">⚡</span>
              <span>Instant Capture</span>
            </div>
          </div>

          <p className="welcome-text">
            Take professional property photos with GPS location and instant processing.
          </p>

          <div className="onboarding-actions">
            <button className="skip-button" onClick={onClose}>
              Skip for Now
            </button>
            <button className="next-button" onClick={handleNext}>
              Get Started →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Explain Step
  if (step === 'explain') {
    return (
      <div className={`camera-onboarding ${className}`}>
        <div className="onboarding-header">
          <div className="camera-icon">🔒</div>
          <h2>Camera Permission Needed</h2>
          <button className="close-button" onClick={onClose} aria-label="Close onboarding">
            ✕
          </button>
        </div>

        <div className="onboarding-content">
          <div className="permission-explanation">
            <div className="explanation-item">
              <div className="explanation-icon">📸</div>
              <div className="explanation-text">
                <h3>Take Property Photos</h3>
                <p>Capture high-quality images for property inspections and documentation.</p>
              </div>
            </div>

            <div className="explanation-item">
              <div className="explanation-icon">📍</div>
              <div className="explanation-text">
                <h3>Add Location Data</h3>
                <p>Automatically tag photos with GPS coordinates for accurate property mapping.</p>
              </div>
            </div>

            <div className="explanation-item">
              <div className="explanation-icon">🔄</div>
              <div className="explanation-text">
                <h3>Switch Cameras</h3>
                <p>Use front or back camera for different shooting scenarios.</p>
              </div>
            </div>
          </div>

          <div className="privacy-notice">
            <div className="privacy-icon">🛡️</div>
            <p>
              <strong>Privacy First:</strong> Camera access is only used for property documentation.
              Photos are stored securely and never shared without your permission.
            </p>
          </div>

          <div className="onboarding-actions">
            <button className="back-button" onClick={handleBack}>
              ← Back
            </button>
            <button className="next-button" onClick={handleNext}>
              Continue →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Request Step
  if (step === 'request') {
    return (
      <div className={`camera-onboarding ${className}`}>
        <div className="onboarding-header">
          <div className="camera-icon">📷</div>
          <h2>Enable Camera Access</h2>
          <button className="close-button" onClick={onClose} aria-label="Close onboarding">
            ✕
          </button>
        </div>

        <div className="onboarding-content">
          <div className="permission-request">
            <div className="request-icon">🔐</div>
            <h3>Allow Camera Access</h3>
            <p>
              Your browser will now ask for camera permission.
              Select "Allow" to enable property photo features.
            </p>

            <div className="browser-permission-notice">
              <div className="browser-icon">🌐</div>
              <p>
                Look for the camera permission prompt in your browser's address bar or a popup dialog.
              </p>
            </div>
          </div>

          <div className="onboarding-actions">
            <button className="back-button" onClick={handleBack}>
              ← Back
            </button>
            <button
              className={`request-button ${isRequesting ? 'requesting' : ''}`}
              onClick={handleRequestPermission}
              disabled={isRequesting}
            >
              {isRequesting ? (
                <>
                  <div className="button-spinner"></div>
                  Requesting Permission...
                </>
              ) : (
                'Request Camera Access'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success Step
  if (step === 'success') {
    return (
      <div className={`camera-onboarding success ${className}`}>
        <div className="onboarding-header">
          <div className="success-icon">✅</div>
          <h2>Camera Access Granted!</h2>
        </div>

        <div className="onboarding-content">
          <div className="success-message">
            <p>Perfect! You can now take property photos with location tagging and camera switching.</p>

            <div className="success-features">
              <div className="feature-item">📸 High-quality photo capture</div>
              <div className="feature-item">📍 Automatic GPS tagging</div>
              <div className="feature-item">🔄 Front/back camera switching</div>
              <div className="feature-item">⚡ Instant photo processing</div>
            </div>
          </div>

          <div className="onboarding-actions">
            <button className="done-button" onClick={onPermissionGranted || onClose}>
              Start Taking Photos →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Error Step
  if (step === 'error') {
    return (
      <div className={`camera-onboarding error ${className}`}>
        <div className="onboarding-header">
          <div className="error-icon">⚠️</div>
          <h2>Camera Access Denied</h2>
          <button className="close-button" onClick={onClose} aria-label="Close onboarding">
            ✕
          </button>
        </div>

        <div className="onboarding-content">
          <div className="error-message">
            <p>{error || 'Camera permission was denied. You can still use other features of the app.'}</p>

            <div className="error-help">
              <h4>To enable camera access later:</h4>
              <ol>
                <li>Click the camera icon (📷) in your browser's address bar</li>
                <li>Select "Always allow" or "Allow" for this site</li>
                <li>Refresh the page to apply changes</li>
              </ol>
            </div>
          </div>

          <div className="onboarding-actions">
            <button className="retry-button" onClick={handleRetry}>
              🔄 Try Again
            </button>
            <button className="skip-button" onClick={onPermissionDenied || onClose}>
              Continue Without Camera
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default CameraPermissionOnboarding;