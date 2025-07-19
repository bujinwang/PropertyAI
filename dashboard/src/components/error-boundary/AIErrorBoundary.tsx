import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Alert, Collapse } from '@mui/material';
import { ErrorOutline, Refresh, BugReport } from '@mui/icons-material';
import { config, debugLog } from '../../config/environment';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

/**
 * Error Boundary specifically designed for AI components
 * Provides graceful degradation when AI features fail
 */
export class AIErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    debugLog('AI Component Error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Report error to monitoring service
    this.reportError(error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    if (config.features.errorReporting && config.monitoring.enabled) {
      // Report to Sentry or other monitoring service
      try {
        // This would be replaced with actual error reporting service
        const errorReport = {
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          userId: this.getUserId(),
          environment: config.environment,
          version: config.version,
        };

        debugLog('Error Report:', errorReport);
        
        // In production, this would send to actual monitoring service
        if (config.environment === 'production') {
          // Example: Sentry.captureException(error, { extra: errorReport });
        }
      } catch (reportingError) {
        debugLog('Failed to report error:', reportingError);
      }
    }
  };

  private getUserId = (): string | null => {
    // Get user ID from authentication context or localStorage
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user).id : null;
    } catch {
      return null;
    }
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  private toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails,
    }));
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default AI error UI
      return (
        <Box
          sx={{
            p: 3,
            border: '1px solid',
            borderColor: 'error.main',
            borderRadius: 2,
            bgcolor: 'error.light',
            color: 'error.contrastText',
            textAlign: 'center',
          }}
        >
          <ErrorOutline sx={{ fontSize: 48, mb: 2, color: 'error.main' }} />
          
          <Typography variant="h6" gutterBottom>
            AI Feature Temporarily Unavailable
          </Typography>
          
          <Typography variant="body2" sx={{ mb: 3, opacity: 0.8 }}>
            We're experiencing issues with this AI-powered feature. 
            The system is working to restore functionality.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={this.handleRetry}
              size="small"
            >
              Try Again
            </Button>
            
            {config.features.debugMode && (
              <Button
                variant="outlined"
                startIcon={<BugReport />}
                onClick={this.toggleDetails}
                size="small"
              >
                {this.state.showDetails ? 'Hide' : 'Show'} Details
              </Button>
            )}
          </Box>

          <Collapse in={this.state.showDetails}>
            <Alert severity="error" sx={{ textAlign: 'left', mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Error Details:
              </Typography>
              <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem' }}>
                {this.state.error?.message}
              </Typography>
              {this.state.error?.stack && (
                <Typography variant="body2" component="pre" sx={{ fontSize: '0.7rem', mt: 1 }}>
                  {this.state.error.stack}
                </Typography>
              )}
            </Alert>
          </Collapse>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default AIErrorBoundary;