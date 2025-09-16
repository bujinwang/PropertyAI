/**
 * Mobile Camera Component for Property Inspections
 * Provides camera interface for capturing property photos
 * Epic 21.5.2 - Mobile Experience Enhancement
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import cameraService, { type PhotoCaptureResult, type CameraCapabilities } from '../utils/cameraService';
import locationService from '../utils/locationService';
import CameraPermissionOnboarding from './CameraPermissionOnboarding';
import { cameraPerformanceOptimizer } from '../utils/cameraPerformance';
import { a11y } from '../utils/accessibilityUtils';
import { aiPhotoAnalysisService, type PhotoAnalysisResult } from '../services/aiPhotoAnalysisService';
import { propertyTaggingService, type PropertyTags } from '../services/propertyTaggingService';
import { predictiveMaintenanceService } from '../services/predictiveMaintenanceService';
import './MobileCamera.css';

// Enhanced types for better UX
interface LoadingState {
  initializing: boolean;
  requestingPermission: boolean;
  startingCamera: boolean;
  capturing: boolean;
  processing: boolean;
}

interface RetryState {
  attempts: number;
  lastError: string | null;
  canRetry: boolean;
}

interface ProgressState {
  stage: 'idle' | 'initializing' | 'permissions' | 'camera' | 'ready' | 'capturing' | 'processing' | 'complete';
  progress: number;
  message: string;
}

interface MobileCameraProps {
  onPhotoCapture?: (result: PhotoCaptureResult) => void;
  onClose?: () => void;
  className?: string;
  showLocation?: boolean;
  allowSwitchCamera?: boolean;
  captureMode?: 'single' | 'multiple';
  enableAIAnalysis?: boolean;
  propertyId?: string;
  onAIAnalysisComplete?: (analysis: PhotoAnalysisResult, tags: PropertyTags) => void;
}

const MobileCamera: React.FC<MobileCameraProps> = ({
  onPhotoCapture,
  onClose,
  className = '',
  showLocation = true,
  allowSwitchCamera = true,
  captureMode = 'single',
  enableAIAnalysis = true,
  propertyId,
  onAIAnalysisComplete
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

  // AI Analysis states
  const [aiAnalysis, setAiAnalysis] = useState<PhotoAnalysisResult | null>(null);
  const [propertyTags, setPropertyTags] = useState<PropertyTags | null>(null);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [aiAnalysisProgress, setAiAnalysisProgress] = useState<{
    analyzing: boolean;
    tagging: boolean;
    maintenance: boolean;
    message: string;
  }>({
    analyzing: false,
    tagging: false,
    maintenance: false,
    message: ''
  });

  // Enhanced UX states
  const [loading, setLoading] = useState<LoadingState>({
    initializing: false,
    requestingPermission: false,
    startingCamera: false,
    capturing: false,
    processing: false
  });

  const [retry, setRetry] = useState<RetryState>({
    attempts: 0,
    lastError: null,
    canRetry: false
  });

  const [progress, setProgress] = useState<ProgressState>({
    stage: 'idle',
    progress: 0,
    message: ''
  });

  const [error, setError] = useState<string | null>(null);
  const [showRetry, setShowRetry] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [permissionRequested, setPermissionRequested] = useState(false);

  // Enhanced camera initialization with progress tracking
  useEffect(() => {
    const initCamera = async () => {
      try {
        // Lazy load camera resources for better performance
        await cameraPerformanceOptimizer.lazyLoadCameraResources();

        setProgress({ stage: 'initializing', progress: 10, message: 'Initializing camera...' });
        setLoading(prev => ({ ...prev, initializing: true }));
        setError(null);

        const caps = cameraService.getCapabilities();
        setCapabilities(caps);
        setProgress({ stage: 'initializing', progress: 30, message: 'Checking camera capabilities...' });

        if (!caps?.hasCamera) {
          throw new Error('No camera available on this device');
        }

        setProgress({ stage: 'permissions', progress: 50, message: 'Requesting camera permissions...' });
        setLoading(prev => ({ ...prev, initializing: false, requestingPermission: true }));

        const permissionGranted = await cameraService.requestPermission();
        setLoading(prev => ({ ...prev, requestingPermission: false }));

        if (!permissionGranted) {
          // Show onboarding flow for better UX
          setShowOnboarding(true);
          setProgress({ stage: 'idle', progress: 0, message: '' });
          return;
        }

        if (videoRef.current) {
          setProgress({ stage: 'camera', progress: 70, message: 'Starting camera...' });
          setLoading(prev => ({ ...prev, startingCamera: true }));

          const started = await cameraService.startCamera(videoRef.current, {
            facingMode,
            width: 1920,
            height: 1080
          });

          setLoading(prev => ({ ...prev, startingCamera: false }));

          if (started) {
            setIsActive(true);
            setProgress({ stage: 'ready', progress: 100, message: 'Camera ready!' });
            setTimeout(() => setProgress({ stage: 'ready', progress: 100, message: '' }), 1000);
          } else {
            throw new Error('Failed to start camera');
          }
        }
      } catch (error) {
        console.error('Camera initialization error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to initialize camera';
        setError(errorMessage);
        setRetry(prev => ({
          attempts: prev.attempts + 1,
          lastError: errorMessage,
          canRetry: prev.attempts < 3
        }));
        setShowRetry(true);
        setProgress({ stage: 'idle', progress: 0, message: '' });
      } finally {
        setLoading(prev => ({
          initializing: false,
          requestingPermission: false,
          startingCamera: false,
          capturing: false,
          processing: false
        }));
      }
    };

    initCamera();

    return () => {
      cameraService.stopCamera();
    };
  }, [facingMode, retry.attempts]);

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

  // AI Analysis function
  const performAIAnalysis = useCallback(async (photoResult: PhotoCaptureResult) => {
    if (!enableAIAnalysis) return;

    try {
      setAiAnalysisProgress({
        analyzing: true,
        tagging: false,
        maintenance: false,
        message: '🤖 Analyzing photo with AI...'
      });

      // Perform AI photo analysis
      const analysis = await aiPhotoAnalysisService.analyzePhoto(photoResult.blob, {});

      setAiAnalysis(analysis);
      setAiAnalysisProgress(prev => ({
        ...prev,
        analyzing: false,
        tagging: true,
        message: '🏷️ Generating property tags...'
      }));

      // Generate property tags based on analysis
      let tags: PropertyTags | null = null;
      if (propertyId) {
        tags = await propertyTaggingService.generateTags(propertyId, analysis);
        setPropertyTags(tags);
      }

      setAiAnalysisProgress(prev => ({
        ...prev,
        tagging: false,
        maintenance: true,
        message: '🔧 Checking maintenance needs...'
      }));

      // Check for maintenance predictions if propertyId is available
      if (propertyId) {
        const predictions = await predictiveMaintenanceService.generatePredictions(
          propertyId,
          { analysis },
          []
        );

        // Generate alerts for critical predictions
        const criticalPredictions = predictions.filter(p => p.riskLevel === 'critical');
        if (criticalPredictions.length > 0) {
          await predictiveMaintenanceService.generateAlerts(propertyId, criticalPredictions);
        }
      }

      setAiAnalysisProgress({
        analyzing: false,
        tagging: false,
        maintenance: false,
        message: '✅ AI Analysis Complete!'
      });

      // Show AI analysis results
      setShowAIAnalysis(true);

      // Call completion callback
      if (onAIAnalysisComplete && analysis && tags) {
        onAIAnalysisComplete(analysis, tags);
      }

      // Auto-hide after 5 seconds
      setTimeout(() => {
        setShowAIAnalysis(false);
      }, 5000);

    } catch (error) {
      console.error('[MobileCamera] AI Analysis failed:', error);
      setAiAnalysisProgress({
        analyzing: false,
        tagging: false,
        maintenance: false,
        message: '⚠️ AI Analysis failed, but photo was captured successfully'
      });

      // Still show the analysis overlay briefly to inform user
      setTimeout(() => {
        setAiAnalysisProgress(prev => ({ ...prev, message: '' }));
      }, 3000);
    }
  }, [enableAIAnalysis, propertyId, currentLocation, onAIAnalysisComplete]);

  // Enhanced photo capture with progress tracking, retry, and AI analysis
  const handleCapture = useCallback(async () => {
    if (!isActive || loading.capturing) return;

    setLoading(prev => ({ ...prev, capturing: true }));
    setProgress({ stage: 'capturing', progress: 10, message: 'Preparing to capture...' });
    setError(null);
    setShowRetry(false);

    try {
      setProgress({ stage: 'capturing', progress: 30, message: 'Capturing photo...' });

      const result = await cameraService.capturePhoto({
        width: 1920,
        height: 1080,
        quality: 0.8
      });

      if (result) {
        setProgress({ stage: 'processing', progress: 70, message: 'Processing photo...' });
        setLoading(prev => ({ ...prev, capturing: false, processing: true }));

        // Perform AI analysis if enabled
        if (enableAIAnalysis) {
          await performAIAnalysis(result);
        } else {
          // Simulate processing time for better UX
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        setProgress({ stage: 'complete', progress: 100, message: 'Photo captured successfully!' });

        if (captureMode === 'multiple') {
          setCapturedPhotos(prev => [...prev, result]);
        }

        if (onPhotoCapture) {
          onPhotoCapture(result);
        }

        // Enhanced haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate([50, 50, 50]); // Triple vibration for success
        }

        // Enhanced visual feedback
        if (videoRef.current) {
          videoRef.current.style.transform = 'scale(0.95)';
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.style.transform = 'scale(1)';
            }
          }, 150);
        }

        // Reset progress after success
        setTimeout(() => {
          setProgress({ stage: 'ready', progress: 100, message: '' });
        }, 1500);

        // Reset retry state on success
        setRetry({ attempts: 0, lastError: null, canRetry: false });
      } else {
        throw new Error('Failed to capture photo');
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to capture photo';
      setError(errorMessage);
      setRetry(prev => ({
        attempts: prev.attempts + 1,
        lastError: errorMessage,
        canRetry: prev.attempts < 2
      }));
      setShowRetry(true);
      setProgress({ stage: 'ready', progress: 100, message: '' });
    } finally {
      setLoading(prev => ({
        ...prev,
        capturing: false,
        processing: false
      }));
    }
  }, [isActive, loading.capturing, captureMode, onPhotoCapture, enableAIAnalysis, performAIAnalysis]);

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

  // Handle retry
  const handleRetry = useCallback(() => {
    setShowRetry(false);
    setError(null);
    setRetry(prev => ({ ...prev, attempts: 0, lastError: null, canRetry: false }));
    // Re-initialize camera
    setProgress({ stage: 'idle', progress: 0, message: '' });
  }, []);

  // Handle retry initialization
  const handleRetryInit = useCallback(() => {
    setShowRetry(false);
    setError(null);
    setRetry(prev => ({ attempts: 0, lastError: null, canRetry: false }));
  }, []);

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

  // Handle permission granted from onboarding
  const handlePermissionGranted = useCallback(() => {
    setShowOnboarding(false);
    setPermissionRequested(true);
    // Re-initialize camera with granted permissions
    setProgress({ stage: 'permissions', progress: 50, message: 'Permissions granted!' });
    setTimeout(() => {
      setProgress({ stage: 'camera', progress: 70, message: 'Starting camera...' });
    }, 500);
  }, []);

  // Handle permission denied from onboarding
  const handlePermissionDenied = useCallback(() => {
    setShowOnboarding(false);
    setError('Camera permission is required to take photos. You can enable it later in your browser settings.');
    setShowRetry(true);
  }, []);

  // Handle onboarding close
  const handleOnboardingClose = useCallback(() => {
    setShowOnboarding(false);
    setError('Camera permission is required to take photos. You can enable it later in your browser settings.');
    setShowRetry(true);
  }, []);

  return (
    <div
      className={`mobile-camera ${className}`}
      role="application"
      aria-label="Mobile Camera for Property Inspections"
      aria-describedby="camera-instructions"
    >
      {/* Permission Onboarding Overlay */}
      {showOnboarding && (
        <div className="onboarding-overlay" role="dialog" aria-modal="true">
          <CameraPermissionOnboarding
            onPermissionGranted={handlePermissionGranted}
            onPermissionDenied={handlePermissionDenied}
            onClose={handleOnboardingClose}
            autoStart={true}
          />
        </div>
      )}

      {/* Loading Overlay */}
      {(loading.initializing || loading.requestingPermission || loading.startingCamera) && (
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

      {/* Error Overlay */}
      {error && (
        <div className="error-overlay">
          <div className="error-content">
            <div className="error-icon">⚠️</div>
            <h3>Camera Error</h3>
            <p>{error}</p>
            {showRetry && retry.canRetry && (
              <div className="retry-options">
                <button className="retry-button" onClick={handleRetry}>
                  🔄 Retry ({retry.attempts}/3)
                </button>
                <button className="retry-init-button" onClick={handleRetryInit}>
                  🔧 Reinitialize Camera
                </button>
              </div>
            )}
            <button className="close-error-button" onClick={() => setError(null)}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Camera View */}
      <div className="camera-container">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="camera-video"
          aria-label="Camera preview"
        />

        {/* Camera Overlay */}
        <div className="camera-overlay">
          {/* Top Bar */}
          <div className="camera-top-bar">
            {showLocation && currentLocation && (
              <div className="location-indicator" aria-label={`Current location: ${currentLocation}`}>
                📍 {currentLocation}
              </div>
            )}
            <button
              className="close-button"
              onClick={handleClose}
              aria-label="Close camera"
              disabled={loading.capturing || loading.processing}
            >
              ✕
            </button>
          </div>

          {/* Progress Indicator */}
          {(loading.capturing || loading.processing) && (
            <div className="capture-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progress.progress}%` }}
                ></div>
              </div>
              <p className="progress-message">{progress.message}</p>
            </div>
          )}

          {/* Capture Button */}
          <div className="camera-controls">
            <button
              className={`capture-button ${loading.capturing ? 'capturing' : ''} ${loading.processing ? 'processing' : ''}`}
              onClick={handleCapture}
              disabled={!isActive || loading.capturing || loading.processing}
              aria-label={loading.capturing ? 'Capturing photo...' : loading.processing ? 'Processing photo...' : 'Take photo'}
            >
              <div className="capture-ring"></div>
              {loading.capturing && <div className="capture-spinner"></div>}
            </button>
          </div>

          {/* Bottom Controls */}
          <div className="camera-bottom-controls" role="toolbar" aria-label="Camera controls">
            {allowSwitchCamera && capabilities?.hasFrontCamera && capabilities?.hasBackCamera && (
              <button
                className="control-button switch-camera"
                onClick={handleSwitchCamera}
                title="Switch Camera"
                disabled={loading.capturing || loading.processing}
                aria-label={`Switch to ${facingMode === 'user' ? 'back' : 'front'} camera`}
                aria-describedby="switch-camera-status"
              >
                🔄
              </button>
            )}

            {capabilities?.supportsFlash && (
              <button
                className={`control-button flash ${flashEnabled ? 'active' : ''}`}
                onClick={handleToggleFlash}
                title="Toggle Flash"
                disabled={loading.capturing || loading.processing}
                aria-label={`Flash ${flashEnabled ? 'on' : 'off'}`}
                aria-pressed={flashEnabled}
                aria-describedby="flash-status"
              >
                ⚡
              </button>
            )}

            {captureMode === 'multiple' && (
              <div className="photo-counter" aria-label={`${capturedPhotos.length} photos captured`}>
                📸 {capturedPhotos.length}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden canvas for photo processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* AI Analysis Results Overlay */}
      {showAIAnalysis && aiAnalysis && (
        <div className="ai-analysis-overlay" role="dialog" aria-modal="true" aria-labelledby="ai-analysis-title">
          <div className="ai-analysis-content">
            <div className="ai-analysis-header">
              <h3 id="ai-analysis-title">🤖 AI Analysis Results</h3>
              <button
                className="ai-analysis-close"
                onClick={() => setShowAIAnalysis(false)}
                aria-label="Close AI analysis"
              >
                ✕
              </button>
            </div>

            <div className="ai-analysis-body">
              {/* Property Type & Condition */}
              <div className="ai-summary">
                <div className="ai-summary-item">
                  <span className="ai-label">Property Type:</span>
                  <span className="ai-value">{aiAnalysis.analysis.propertyType}</span>
                </div>
                <div className="ai-summary-item">
                  <span className="ai-label">Condition:</span>
                  <span className={`ai-value condition-${aiAnalysis.analysis.condition}`}>
                    {aiAnalysis.analysis.condition}
                  </span>
                </div>
                <div className="ai-summary-item">
                  <span className="ai-label">Confidence:</span>
                  <span className="ai-value">{Math.round(aiAnalysis.confidence * 100)}%</span>
                </div>
              </div>

              {/* Features Detected */}
              {aiAnalysis.analysis.features && aiAnalysis.analysis.features.length > 0 && (
                <div className="ai-features">
                  <h4>🏠 Features Detected</h4>
                  <div className="features-grid">
                    {aiAnalysis.analysis.features.slice(0, 4).map((feature, index) => (
                      <div key={index} className="feature-item">
                        <span className="feature-type">{feature.type}</span>
                        <span className={`feature-condition condition-${feature.condition}`}>
                          {feature.condition}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Issues Found */}
              {aiAnalysis.analysis.issues && aiAnalysis.analysis.issues.length > 0 && (
                <div className="ai-issues">
                  <h4>⚠️ Issues Identified</h4>
                  <div className="issues-list">
                    {aiAnalysis.analysis.issues.slice(0, 3).map((issue, index) => (
                      <div key={index} className={`issue-item severity-${issue.severity}`}>
                        <div className="issue-header">
                          <span className="issue-title">{issue.title}</span>
                          <span className="issue-severity">{issue.severity}</span>
                        </div>
                        <div className="issue-details">
                          {issue.estimatedCost && (
                            <span className="issue-cost">${issue.estimatedCost}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Property Tags */}
              {propertyTags && propertyTags.tags.length > 0 && (
                <div className="ai-tags">
                  <h4>🏷️ Property Tags</h4>
                  <div className="tags-list">
                    {propertyTags.tags.slice(0, 6).map((tag, index) => (
                      <span key={index} className="tag-item" style={{ backgroundColor: tag.category.color }}>
                        {tag.category.icon} {tag.value}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {aiAnalysis.analysis.recommendations && aiAnalysis.analysis.recommendations.length > 0 && (
                <div className="ai-recommendations">
                  <h4>💡 Recommendations</h4>
                  <div className="recommendations-list">
                    {aiAnalysis.analysis.recommendations.slice(0, 2).map((rec, index) => (
                      <div key={index} className="recommendation-item">
                        <span className="rec-title">{rec.title}</span>
                        <span className="rec-priority priority-{rec.priority}">{rec.priority}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="ai-analysis-footer">
              <button
                className="ai-analysis-button primary"
                onClick={() => setShowAIAnalysis(false)}
              >
                Continue
              </button>
              <button
                className="ai-analysis-button secondary"
                onClick={() => {
                  // Could navigate to detailed analysis view
                  console.log('View detailed analysis');
                }}
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Instructions */}
      <div className="camera-instructions">
        <p>Tap to capture • Space/Enter to take photo • Esc to close</p>
        {allowSwitchCamera && <p>Press C to switch camera</p>}
        {loading.capturing && <p className="status-message">📸 Capturing...</p>}
        {loading.processing && <p className="status-message">⚙️ Processing...</p>}
        {progress.stage === 'complete' && <p className="success-message">✅ Photo captured!</p>}
        {aiAnalysisProgress.analyzing && <p className="ai-status-message">{aiAnalysisProgress.message}</p>}
        {aiAnalysisProgress.tagging && <p className="ai-status-message">{aiAnalysisProgress.message}</p>}
        {aiAnalysisProgress.maintenance && <p className="ai-status-message">{aiAnalysisProgress.message}</p>}
      </div>
    </div>
  );
};

export default MobileCamera;