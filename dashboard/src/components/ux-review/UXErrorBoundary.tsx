import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  AlertTitle,
  Container,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  BugReport as BugReportIcon,
} from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class UXErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('UX Review Error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <Container maxWidth="sm" sx={{ py: 4 }}>
            <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
              <Box mb={3}>
                <BugReportIcon color="error" sx={{ fontSize: 48, mb: 2 }} />
                <Typography variant="h4" gutterBottom>
                  Oops! Something went wrong
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  We encountered an issue while loading the UX reviews. Don't worry, we're on it!
                </Typography>
              </Box>

              <Alert severity="error" sx={{ mb: 3 }}>
                <AlertTitle>Error Details</AlertTitle>
                <Typography variant="body2">
                  {this.state.error?.message || 'An unexpected error occurred'}
                </Typography>
                {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                  <Box sx={{ mt: 2, textAlign: 'left', fontSize: '12px' }}>
                    <Typography variant="caption" component="pre">
                      {this.state.errorInfo.componentStack}
                    </Typography>
                  </Box>
                )}
              </Alert>

              <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
                <Button
                  variant="contained"
                  color="primary"
                  onClick={this.handleReset}
                  startIcon={<RefreshIcon />}
                  aria-label="Try loading UX reviews again"
                >
                  Try Again
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => window.location.reload()}
                  aria-label="Reload the entire application"
                >
                  Reload Page
                </Button>
              </Box>

              <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
                If this problem persists, please contact support with the error details above.
              </Typography>
            </Paper>
          </Container>
        )
      );
    }

    return this.props.children;
  }
}