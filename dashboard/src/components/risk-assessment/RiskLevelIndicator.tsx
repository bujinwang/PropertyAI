import React from 'react';
import {
  Box,
  Chip,
  Typography,
  Badge,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { RiskLevel, RiskLevelIndicatorProps } from '../../types/risk-assessment';

/**
 * Risk Level Indicator Component
 * Displays risk level with appropriate colors and icons
 */
export const RiskLevelIndicator: React.FC<RiskLevelIndicatorProps> = ({
  level,
  score,
  size = 'medium',
  showLabel = true,
  variant = 'chip',
}) => {
  const getRiskLevelColor = (riskLevel: RiskLevel): 'success' | 'warning' | 'error' => {
    switch (riskLevel) {
      case 'low':
        return 'success';
      case 'medium':
        return 'warning';
      case 'high':
        return 'error';
      default:
        return 'success';
    }
  };

  const getRiskLevelIcon = (riskLevel: RiskLevel) => {
    const iconSize = size === 'small' ? 'small' : size === 'large' ? 'large' : 'medium';
    
    switch (riskLevel) {
      case 'low':
        return <CheckCircleIcon color="success" fontSize={iconSize} />;
      case 'medium':
        return <WarningIcon color="warning" fontSize={iconSize} />;
      case 'high':
        return <ErrorIcon color="error" fontSize={iconSize} />;
      default:
        return <CheckCircleIcon color="success" fontSize={iconSize} />;
    }
  };

  const getRiskLevelLabel = (riskLevel: RiskLevel): string => {
    switch (riskLevel) {
      case 'low':
        return 'Low Risk';
      case 'medium':
        return 'Medium Risk';
      case 'high':
        return 'High Risk';
      default:
        return 'Unknown';
    }
  };

  if (variant === 'chip') {
    return (
      <Chip
        icon={getRiskLevelIcon(level)}
        label={showLabel ? getRiskLevelLabel(level) : undefined}
        color={getRiskLevelColor(level)}
        size={size === 'large' ? 'medium' : 'small'}
        variant="outlined"
      />
    );
  }

  if (variant === 'badge') {
    return (
      <Badge
        badgeContent={score}
        color={getRiskLevelColor(level)}
        max={100}
      >
        {getRiskLevelIcon(level)}
      </Badge>
    );
  }

  if (variant === 'dot') {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <Box
          sx={{
            width: size === 'small' ? 8 : size === 'large' ? 16 : 12,
            height: size === 'small' ? 8 : size === 'large' ? 16 : 12,
            borderRadius: '50%',
            backgroundColor: `${getRiskLevelColor(level)}.main`,
          }}
        />
        {showLabel && (
          <Typography
            variant={size === 'small' ? 'caption' : size === 'large' ? 'body1' : 'body2'}
            color="text.secondary"
          >
            {getRiskLevelLabel(level)}
          </Typography>
        )}
        {score !== undefined && (
          <Typography
            variant={size === 'small' ? 'caption' : size === 'large' ? 'body1' : 'body2'}
            fontWeight="medium"
          >
            ({score})
          </Typography>
        )}
      </Box>
    );
  }

  return null;
};

export default RiskLevelIndicator;