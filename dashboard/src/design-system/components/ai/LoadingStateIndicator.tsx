import React from 'react';
import { 
  Box, 
  CircularProgress, 
  LinearProgress, 
  Typography, 
  Skeleton,
  Paper
} from '@mui/material';
import { LoadingStateIndicatorProps } from '../../../types/ai';

const LoadingStateIndicator: React.FC<LoadingStateIndicatorProps> = ({
  message = 'Processing...',
  estimatedTime,
  variant = 'spinner',
  progress,
  size = 'medium',
}) => {
  const getSizeProps = () => {
    switch (size) {
      case 'small':
        return { circularSize: 24, typography: 'body2' as const };
      case 'large':
        return { circularSize: 48, typography: 'h6' as const };
      default:
        return { circularSize: 32, typography: 'body1' as const };
    }
  };

  const { circularSize, typography } = getSizeProps();

  const formatEstimatedTime = (seconds: number) => {
    if (seconds < 60) {
      return `~${seconds}s`;
    } else if (seconds < 3600) {
      return `~${Math.ceil(seconds / 60)}m`;
    } else {
      return `~${Math.ceil(seconds / 3600)}h`;
    }
  };

  const renderSpinner = () => (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: 2,
        p: 3
      }}
    >
      <CircularProgress 
        size={circularSize} 
        {...(progress !== undefined && { 
          variant: 'determinate', 
          value: progress 
        })}
      />
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant={typography} color="text.secondary">
          {message}
        </Typography>
        {estimatedTime && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            Estimated time: {formatEstimatedTime(estimatedTime)}
          </Typography>
        )}
        {progress !== undefined && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {Math.round(progress)}% complete
          </Typography>
        )}
      </Box>
    </Box>
  );

  const renderProgress = () => (
    <Box sx={{ width: '100%', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant={typography} color="text.secondary">
          {message}
        </Typography>
        {progress !== undefined && (
          <Typography variant="caption" color="text.secondary">
            {Math.round(progress)}%
          </Typography>
        )}
      </Box>
      <LinearProgress 
        {...(progress !== undefined && { 
          variant: 'determinate', 
          value: progress 
        })}
        sx={{ height: size === 'large' ? 8 : size === 'small' ? 4 : 6 }}
      />
      {estimatedTime && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Estimated time remaining: {formatEstimatedTime(estimatedTime)}
        </Typography>
      )}
    </Box>
  );

  const renderSkeleton = () => {
    const skeletonHeight = size === 'large' ? 60 : size === 'small' ? 30 : 40;
    
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant={typography} color="text.secondary" sx={{ mb: 2 }}>
          {message}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Skeleton variant="rectangular" height={skeletonHeight} />
          <Skeleton variant="rectangular" height={skeletonHeight} width="80%" />
          <Skeleton variant="rectangular" height={skeletonHeight} width="60%" />
        </Box>
        {estimatedTime && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            Loading content... {formatEstimatedTime(estimatedTime)}
          </Typography>
        )}
      </Box>
    );
  };

  const renderContent = () => {
    switch (variant) {
      case 'progress':
        return renderProgress();
      case 'skeleton':
        return renderSkeleton();
      default:
        return renderSpinner();
    }
  };

  return (
    <Paper 
      elevation={1} 
      sx={{ 
        borderRadius: 2,
        backgroundColor: 'background.default',
        border: '1px solid',
        borderColor: 'divider',
      }}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      {renderContent()}
    </Paper>
  );
};

export default LoadingStateIndicator;