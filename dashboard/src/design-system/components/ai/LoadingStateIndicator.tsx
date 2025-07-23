import React, { useEffect, useRef } from 'react';
import { 
  Box, 
  CircularProgress, 
  LinearProgress, 
  Typography, 
  Skeleton,
  Paper
} from '@mui/material';
import { LoadingStateIndicatorProps } from '../../../types/ai';
import { useLiveRegion, useReducedMotion } from '../../../utils/accessibility';

const LoadingStateIndicator: React.FC<LoadingStateIndicatorProps> = ({
  message = 'Processing...',
  estimatedTime,
  variant = 'spinner',
  progress,
  size = 'medium',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { announce } = useLiveRegion();
  const prefersReducedMotion = useReducedMotion();

  // Announce loading state changes
  useEffect(() => {
    announce(message, 'polite');
  }, [message, announce]);

  useEffect(() => {
    if (progress !== undefined) {
      announce(`Progress: ${Math.round(progress)}% complete`, 'polite');
    }
  }, [progress, announce]);
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
        role="progressbar"
        aria-label={message}
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        sx={{
          animation: prefersReducedMotion ? 'none' : undefined,
        }}
        {...(progress !== undefined && { 
          variant: 'determinate', 
          value: progress 
        })}
      />
      <Box sx={{ textAlign: 'center' }}>
        <Typography 
          variant={typography} 
          color="text.secondary"
          id="loading-message"
        >
          {message}
        </Typography>
        {estimatedTime && (
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ mt: 0.5, display: 'block' }}
            aria-label={`Estimated time remaining: ${formatEstimatedTime(estimatedTime)}`}
          >
            Estimated time: {formatEstimatedTime(estimatedTime)}
          </Typography>
        )}
        {progress !== undefined && (
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ mt: 0.5, display: 'block' }}
            aria-label={`${Math.round(progress)} percent complete`}
          >
            {Math.round(progress)}% complete
          </Typography>
        )}
      </Box>
    </Box>
  );

  const renderProgress = () => (
    <Box sx={{ width: '100%', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography 
          variant={typography} 
          color="text.secondary"
          id="progress-message"
        >
          {message}
        </Typography>
        {progress !== undefined && (
          <Typography 
            variant="caption" 
            color="text.secondary"
            aria-label={`${Math.round(progress)} percent complete`}
          >
            {Math.round(progress)}%
          </Typography>
        )}
      </Box>
      <LinearProgress 
        role="progressbar"
        aria-labelledby="progress-message"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        sx={{ 
          height: size === 'large' ? 8 : size === 'small' ? 4 : 6,
          '& .MuiLinearProgress-bar': {
            transition: prefersReducedMotion ? 'none' : undefined,
          }
        }}
        {...(progress !== undefined && { 
          variant: 'determinate', 
          value: progress 
        })}
      />
      {estimatedTime && (
        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ mt: 1, display: 'block' }}
          aria-label={`Estimated time remaining: ${formatEstimatedTime(estimatedTime)}`}
        >
          Estimated time remaining: {formatEstimatedTime(estimatedTime)}
        </Typography>
      )}
    </Box>
  );

  const renderSkeleton = () => {
    const skeletonHeight = size === 'large' ? 60 : size === 'small' ? 30 : 40;
    
    return (
      <Box sx={{ p: 2 }}>
        <Typography 
          variant={typography} 
          color="text.secondary" 
          sx={{ mb: 2 }}
          id="skeleton-message"
        >
          {message}
        </Typography>
        <Box 
          sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
          role="group"
          aria-labelledby="skeleton-message"
          aria-label="Loading content placeholder"
        >
          <Skeleton 
            variant="rectangular" 
            height={skeletonHeight}
            aria-label="Loading content line 1"
            sx={{
              animation: prefersReducedMotion ? 'none' : undefined,
            }}
          />
          <Skeleton 
            variant="rectangular" 
            height={skeletonHeight} 
            width="80%"
            aria-label="Loading content line 2"
            sx={{
              animation: prefersReducedMotion ? 'none' : undefined,
            }}
          />
          <Skeleton 
            variant="rectangular" 
            height={skeletonHeight} 
            width="60%"
            aria-label="Loading content line 3"
            sx={{
              animation: prefersReducedMotion ? 'none' : undefined,
            }}
          />
        </Box>
        {estimatedTime && (
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ mt: 2, display: 'block' }}
            aria-label={`Loading content, estimated time: ${formatEstimatedTime(estimatedTime)}`}
          >
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
      ref={containerRef}
      elevation={1} 
      sx={{ 
        borderRadius: 2,
        backgroundColor: 'background.default',
        border: '1px solid',
        borderColor: 'divider',
      }}
      role="status"
      aria-live="polite"
      aria-label={`Loading: ${message}`}
      aria-busy="true"
    >
      {renderContent()}
    </Paper>
  );
};

export default LoadingStateIndicator;