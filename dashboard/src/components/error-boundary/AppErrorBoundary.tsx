import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  AlertTitle,
  Container,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  BugReport as BugReportIcon,
  Home as HomeIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  showHomeButton?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

/**
 * General Error Boundary for the entire application
 * Handles routing errors and other unexpected failures
 */
export class AppErrorBoundary extends Component<Props, State> {
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
    console.error('Application Error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Report error to monitoring service in production
    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // In production, you would send this to your error monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { extra: errorInfo });
    }
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
    
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleGoHome = () => {
    window.location.href = '/';
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

      // Default error UI
      return (
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
            <Box mb={3}>
              <BugReportIcon color="error" sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h3" gutterBottom color="error">
                Oops! Something went wrong
              </Typography>
              <Typography variant="h6" color="text.secondary" paragraph>
                We encountered an unexpected error while loading the application.
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Don't worry - this has been reported to our team and we're working on a fix.
              </Typography>
            </Box>

            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
              <AlertTitle>Error Information</AlertTitle>
              <Typography variant="body2">
                {this.state.error?.message || 'An unexpected error occurred'}
              </Typography>
              
              {process.env.NODE_ENV === 'development' && (
                <Box sx={{ mt: 2 }}>
                  <Button
                    size="small"
                    onClick={this.toggleDetails}
                    endIcon={this.state.showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  >
                    {this.state.showDetails ? 'Hide' : 'Show'} Technical Details
                  </Button>
                  
                  <Collapse in={this.state.showDetails}>
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                      <Typography variant="caption" component="pre" sx={{ fontSize: '11px', whiteSpace: 'pre-wrap' }}>
                        {this.state.error?.stack}
                      </Typography>
                      {this.state.errorInfo && (
                        <Typography variant="caption" component="pre" sx={{ fontSize: '11px', whiteSpace: 'pre-wrap', mt: 1 }}>
                          Component Stack:
                          {this.state.errorInfo.componentStack}
                        </Typography>
                      )}
                    </Box>
                  </Collapse>
                </Box>
              )}
            </Alert>

            <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
              <Button
                variant="contained"
                color="primary"
                onClick={this.handleReset}
                startIcon={<RefreshIcon />}
                size="large"
              >
                Try Again
              </Button>
              
              {this.props.showHomeButton !== false && (
                <Button
                  variant="outlined"
                  onClick={this.handleGoHome}
                  startIcon={<HomeIcon />}
                  size="large"
                >
                  Go to Dashboard
                </Button>
              )}
              
              <Button
                variant="outlined"
                onClick={() => window.location.reload()}
                size="large"
              >
                Reload Page
              </Button>
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 3, display: 'block' }}>
              If this problem persists, please contact support with the error details above.
            </Typography>
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;