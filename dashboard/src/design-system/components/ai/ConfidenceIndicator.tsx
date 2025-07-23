import React, { useMemo, memo, useRef } from 'react';
import { 
  Box, 
  LinearProgress, 
  CircularProgress,
  Typography, 
  Chip
} from '@mui/material';
import { ConfidenceIndicatorProps } from '../../../types/ai';
import ExplanationTooltip from './ExplanationTooltip';
import { 
  useConfidenceLevel, 
  useConfidenceColor, 
  useAIExplanation,
  useAIPerformanceMonitor,
  useCachedAICalculation
} from '../../../utils/ai-performance';
import { 
  getConfidenceDescription,
  useReducedMotion
} from '../../../utils/accessibility';

const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = memo(({ 
  confidence,
  showTooltip = false,
  explanation,
  variant = 'linear',
  size = 'medium',
  colorCoded = true,
  showNumericalScore = true,
  ...props 
}) => {
  // Accessibility refs and hooks
  const progressRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Performance monitoring
  const { startRender, endRender, startCalculation, endCalculation } = useAIPerformanceMonitor('ConfidenceIndicator');

  // Use optimized hooks for calculations
  const confidenceLevel = useConfidenceLevel(confidence);
  const confidenceColor = useConfidenceColor(confidence, colorCoded);
  const confidenceDescription = getConfidenceDescription(confidence);

  const sizeProps = useMemo(() => {
    switch (size) {
      case 'small':
        return { 
          height: 4, 
          circularSize: 20, 
          typography: 'caption' as const,
          chipSize: 'small' as const
        };
      case 'large':
        return { 
          height: 8, 
          circularSize: 40, 
          typography: 'body1' as const,
          chipSize: 'medium' as const
        };
      default:
        return { 
          height: 6, 
          circularSize: 30, 
          typography: 'body2' as const,
          chipSize: 'small' as const
        };
    }
  }, [size]);

  const { height, circularSize, typography, chipSize } = sizeProps;

  // Cache expensive color calculations
  const progressBarColor = useCachedAICalculation(
    'progressBarColor',
    () => confidence >= 80 ? '#4caf50' : confidence >= 60 ? '#ff9800' : '#f44336',
    [confidence]
  );

  // Use optimized explanation hook
  const defaultExplanation = useAIExplanation(confidence, explanation);

  const renderLinearIndicator = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
      <Box sx={{ width: '100%', mr: showNumericalScore ? 1 : 0 }}>
        <LinearProgress 
          ref={progressRef}
          variant="determinate" 
          value={confidence} 
          color={confidenceColor}
          role="progressbar"
          aria-valuenow={confidence}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`AI confidence: ${confidenceDescription}`}
          aria-describedby="confidence-text"
          sx={{ 
            height,
            borderRadius: height / 2,
            backgroundColor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              borderRadius: height / 2,
              backgroundColor: progressBarColor,
              transition: prefersReducedMotion ? 'none' : undefined,
            }
          }}
          {...props} 
        />
      </Box>
      {showNumericalScore && (
        <Box sx={{ minWidth: 45 }}>
          <Typography 
            id="confidence-text"
            variant={typography} 
            color={confidence >= 80 ? 'success.main' : confidence >= 60 ? 'warning.main' : 'error.main'}
            sx={{ fontWeight: 600 }}
            aria-label={`${Math.round(confidence)} percent confidence`}
          >
            {Math.round(confidence)}%
          </Typography>
        </Box>
      )}
    </Box>
  );

  const renderCircularIndicator = () => (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress
        variant="determinate"
        value={confidence}
        size={circularSize}
        color={confidenceColor}
        thickness={size === 'large' ? 6 : 4}
        role="progressbar"
        aria-valuenow={confidence}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`AI confidence: ${confidenceDescription}`}
        sx={{
          color: progressBarColor,
          transition: prefersReducedMotion ? 'none' : undefined,
        }}
        {...props}
      />
      {showNumericalScore && (
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography 
            variant={typography} 
            component="div" 
            color={confidence >= 80 ? 'success.main' : confidence >= 60 ? 'warning.main' : 'error.main'}
            sx={{ 
              fontSize: size === 'small' ? '0.6rem' : undefined,
              fontWeight: 600
            }}
            aria-label={`${Math.round(confidence)} percent confidence`}
          >
            {Math.round(confidence)}%
          </Typography>
        </Box>
      )}
    </Box>
  );

  const renderIndicator = useMemo(() => {
    startCalculation();
    const indicator = variant === 'circular' ? renderCircularIndicator() : renderLinearIndicator();
    endCalculation();
    
    if (showTooltip) {
      const tooltipContent = explanation || defaultExplanation;
      return (
        <ExplanationTooltip
          title="Confidence Score Explanation"
          content={tooltipContent}
          placement="top"
        >
          <Box sx={{ cursor: 'help' }}>
            {indicator}
          </Box>
        </ExplanationTooltip>
      );
    }
    
    return indicator;
  }, [variant, showTooltip, explanation, defaultExplanation, renderCircularIndicator, renderLinearIndicator, startCalculation, endCalculation]);



  // Track render performance
  React.useEffect(() => {
    startRender();
    return () => {
      endRender();
    };
  });

  return (
    <Box 
      sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
      role="group"
      aria-label="AI confidence indicator"
    >
      {renderIndicator}
      {colorCoded && (
        <Chip
          label={confidenceLevel}
          size={chipSize}
          color={confidenceColor}
          variant="outlined"
          aria-label={`Confidence level: ${confidenceLevel}`}
          sx={{ 
            textTransform: 'capitalize',
            fontWeight: 500,
            ...(size === 'small' && { fontSize: '0.65rem', height: 20 })
          }}
        />
      )}
      
      {/* Hidden description for screen readers */}
      <span 
        className="sr-only"
        style={{ 
          position: 'absolute', 
          left: '-10000px', 
          width: '1px', 
          height: '1px', 
          overflow: 'hidden' 
        }}
      >
        AI confidence score: {Math.round(confidence)}% - {confidenceDescription}
      </span>
    </Box>
  );
});

ConfidenceIndicator.displayName = 'ConfidenceIndicator';

export default ConfidenceIndicator;
