import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper, Alert } from '@mui/material';
import { Refresh, BugReport } from '@mui/icons-material';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class TenantRatingErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Tenant Rating Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Paper elevation={2} sx={{ p: 4, m: 2 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <BugReport sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom color="error">
              Something went wrong
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              The tenant ratings component encountered an unexpected error.
            </Typography>
          </Box>

          <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1 }}>
              {this.state.error?.message}
            </Typography>
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details style={{ marginTop: 8 }}>
                <summary style={{ cursor: 'pointer', fontSize: '0.875rem' }}>
                  Stack trace (development only)
                </summary>
                <pre style={{ 
                  fontSize: '0.75rem', 
                  overflow: 'auto', 
                  marginTop: 8,
                  padding: 8,
                  backgroundColor: '#f5f5f5',
                  borderRadius: 4
                }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </Alert>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={this.handleRetry}
            >
              Try Again
            </Button>
            <Button
              variant="outlined"
              onClick={this.handleReload}
            >
              Reload Page
            </Button>
          </Box>
        </Paper>
      );
    }

    return this.props.children;
  }
}

export default TenantRatingErrorBoundary;