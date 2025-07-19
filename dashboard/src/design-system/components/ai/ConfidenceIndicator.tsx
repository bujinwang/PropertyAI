import React, { useMemo, memo } from 'react';
import { 
  Box, 
  LinearProgress, 
  CircularProgress,
  Typography, 
  Chip
} from '@mui/material';
import { ConfidenceIndicatorProps } from '../../../types/ai';
import ExplanationTooltip from './ExplanationTooltip';

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
  // Memoize expensive calculations
  const confidenceLevel = useMemo(() => {
    if (confidence >= 80) return 'high';
    if (confidence >= 60) return 'medium';
    return 'low';
  }, [confidence]);

  const confidenceColor = useMemo(() => {
    if (!colorCoded) return 'primary';
    if (confidence >= 80) return 'success';
    if (confidence >= 60) return 'warning';
    return 'error';
  }, [confidence, colorCoded]);

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

  const progressBarColor = useMemo(() => {
    return confidence >= 80 ? '#4caf50' : confidence >= 60 ? '#ff9800' : '#f44336';
  }, [confidence]);

  const defaultExplanation = useMemo(() => {
    const level = confidenceLevel;
    const baseExplanation = `This AI prediction has a ${level} confidence level (${Math.round(confidence)}%).`;
    
    if (level === 'high') {
      return `${baseExplanation} The model is very confident in this prediction based on strong data patterns and high-quality input data. This prediction is highly reliable.`;
    } else if (level === 'medium') {
      return `${baseExplanation} The model has moderate confidence in this prediction. While generally reliable, consider reviewing additional factors or seeking expert validation for critical decisions.`;
    } else {
      return `${baseExplanation} The model has low confidence in this prediction due to limited data or conflicting patterns. Manual review and expert validation are strongly recommended before making decisions.`;
    }
  }, [confidence, confidenceLevel]);

  const renderLinearIndicator = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
      <Box sx={{ width: '100%', mr: showNumericalScore ? 1 : 0 }}>
        <LinearProgress 
          variant="determinate" 
          value={confidence} 
          color={confidenceColor}
          sx={{ 
            height,
            borderRadius: height / 2,
            backgroundColor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              borderRadius: height / 2,
              backgroundColor: progressBarColor,
            }
          }}
          {...props} 
        />
      </Box>
      {showNumericalScore && (
        <Box sx={{ minWidth: 45 }}>
          <Typography 
            variant={typography} 
            color={confidence >= 80 ? 'success.main' : confidence >= 60 ? 'warning.main' : 'error.main'}
            sx={{ fontWeight: 600 }}
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
        sx={{
          color: progressBarColor,
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
          >
            {Math.round(confidence)}%
          </Typography>
        </Box>
      )}
    </Box>
  );

  const renderIndicator = () => {
    const indicator = variant === 'circular' ? renderCircularIndicator() : renderLinearIndicator();
    
    if (showTooltip) {
      const tooltipContent = explanation || defaultExplanation;
      return (
        <ExplanationTooltip
          title="Confidence Score Explanation"
          content={tooltipContent}
          placement="top"
          interactive={true}
        >
          <Box sx={{ cursor: 'help' }}>
            {indicator}
          </Box>
        </ExplanationTooltip>
      );
    }
    
    return indicator;
  };



  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {renderIndicator()}
      {colorCoded && (
        <Chip
          label={confidenceLevel}
          size={chipSize}
          color={confidenceColor}
          variant="outlined"
          sx={{ 
            textTransform: 'capitalize',
            fontWeight: 500,
            ...(size === 'small' && { fontSize: '0.65rem', height: 20 })
          }}
        />
      )}
    </Box>
  );
});

ConfidenceIndicator.displayName = 'ConfidenceIndicator';

export default ConfidenceIndicator;
