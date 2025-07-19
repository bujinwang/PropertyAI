import React from 'react';
import { Chip, Box, Typography, Tooltip } from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { RiskLevelIndicatorProps, RiskLevel } from '../../types/risk-assessment';

/**
 * Risk level indicator component with color-coded visualization
 * Supports multiple variants and accessibility features
 */
export const RiskLevelIndicator: React.FC<RiskLevelIndicatorProps> = ({
  level,
  score,
  size = 'medium',
  showLabel = true,
  variant = 'chip',
}) => {
  const getRiskConfig = (riskLevel: RiskLevel) => {
    switch (riskLevel) {
      case 'low':
        return {
          color: 'success' as const,
          label: 'Low Risk',
          icon: <CheckCircleIcon />,
          description: 'Low risk applicant - meets most criteria',
        };
      case 'medium':
        return {
          color: 'warning' as const,
          label: 'Medium Risk',
          icon: <WarningIcon />,
          description: 'Medium risk applicant - requires review',
        };
      case 'high':
        return {
          color: 'error' as const,
          label: 'High Risk',
          icon: <ErrorIcon />,
          description: 'High risk applicant - careful consideration needed',
        };
      default:
        return {
          color: 'default' as const,
          label: 'Unknown',
          icon: null,
          description: 'Risk level not determined',
        };
    }
  };

  const config = getRiskConfig(level);
  const chipSize = size === 'small' ? 'small' : 'medium';

  const renderChip = () => (
    <Chip
      label={showLabel ? config.label : ''}
      color={config.color}
      size={chipSize}
      icon={config.icon}
      variant="filled"
      aria-label={`Risk level: ${config.label}${score ? ` (Score: ${score})` : ''}`}
    />
  );

  const renderBadge = () => (
    <Box
      display="inline-flex"
      alignItems="center"
      gap={0.5}
      sx={{
        px: 1,
        py: 0.5,
        borderRadius: 1,
        bgcolor: `${config.color}.light`,
        color: `${config.color}.dark`,
        fontSize: size === 'small' ? '0.75rem' : '0.875rem',
      }}
    >
      {React.cloneElement(config.icon, { 
        sx: { fontSize: size === 'small' ? 16 : 20 } 
      })}
      {showLabel && (
        <Typography variant="caption" fontWeight="medium">
          {config.label}
        </Typography>
      )}
    </Box>
  );

  const renderDot = () => (
    <Box
      display="inline-flex"
      alignItems="center"
      gap={1}
    >
      <Box
        sx={{
          width: size === 'small' ? 8 : size === 'large' ? 16 : 12,
          height: size === 'small' ? 8 : size === 'large' ? 16 : 12,
          borderRadius: '50%',
          bgcolor: `${config.color}.main`,
        }}
        aria-label={`${config.label} indicator`}
      />
      {showLabel && (
        <Typography 
          variant={size === 'small' ? 'caption' : 'body2'}
          color="text.secondary"
        >
          {config.label}
        </Typography>
      )}
    </Box>
  );

  const renderIndicator = () => {
    switch (variant) {
      case 'badge':
        return renderBadge();
      case 'dot':
        return renderDot();
      case 'chip':
      default:
        return renderChip();
    }
  };

  const content = (
    <Box display="inline-flex" alignItems="center" gap={1}>
      {renderIndicator()}
      {score && (
        <Typography 
          variant={size === 'small' ? 'caption' : 'body2'}
          color="text.secondary"
          fontWeight="medium"
        >
          ({score})
        </Typography>
      )}
    </Box>
  );

  return (
    <Tooltip title={config.description} arrow>
      {content}
    </Tooltip>
  );
};

export default RiskLevelIndicator;