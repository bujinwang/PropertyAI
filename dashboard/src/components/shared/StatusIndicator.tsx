import React from 'react';
import { Box, Chip, Typography, useTheme } from '@mui/material';
import { 
  CheckCircle, 
  Warning, 
  Error, 
  Info,
  Circle 
} from '@mui/icons-material';

export interface StatusIndicatorProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'good' | 'critical' | 'operational' | 'offline';
  label: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'dot' | 'badge' | 'chip';
  showIcon?: boolean;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  size = 'medium',
  variant = 'chip',
  showIcon = true
}) => {
  const theme = useTheme();

  const getStatusConfig = () => {
    switch (status) {
      case 'success':
      case 'good':
      case 'operational':
        return {
          color: theme.palette.success.main,
          backgroundColor: theme.palette.success.light,
          icon: <CheckCircle />,
          chipColor: 'success' as const
        };
      case 'warning':
        return {
          color: theme.palette.warning.main,
          backgroundColor: theme.palette.warning.light,
          icon: <Warning />,
          chipColor: 'warning' as const
        };
      case 'error':
      case 'critical':
        return {
          color: theme.palette.error.main,
          backgroundColor: theme.palette.error.light,
          icon: <Error />,
          chipColor: 'error' as const
        };
      case 'info':
      case 'offline':
        return {
          color: theme.palette.info.main,
          backgroundColor: theme.palette.info.light,
          icon: <Info />,
          chipColor: 'info' as const
        };
      default:
        return {
          color: theme.palette.grey[500],
          backgroundColor: theme.palette.grey[100],
          icon: <Circle />,
          chipColor: 'default' as const
        };
    }
  };

  const config = getStatusConfig();

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return { iconSize: 16, fontSize: '0.75rem' };
      case 'large':
        return { iconSize: 24, fontSize: '1rem' };
      default:
        return { iconSize: 20, fontSize: '0.875rem' };
    }
  };

  const sizeConfig = getSizeConfig();

  if (variant === 'dot') {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <Circle 
          sx={{ 
            color: config.color, 
            fontSize: sizeConfig.iconSize 
          }} 
        />
        <Typography 
          variant="body2" 
          sx={{ fontSize: sizeConfig.fontSize }}
          aria-label={`Status: ${label}`}
        >
          {label}
        </Typography>
      </Box>
    );
  }

  if (variant === 'badge') {
    return (
      <Box 
        display="inline-flex" 
        alignItems="center" 
        gap={0.5}
        sx={{
          backgroundColor: config.backgroundColor,
          color: config.color,
          px: 1,
          py: 0.5,
          borderRadius: 1,
          fontSize: sizeConfig.fontSize
        }}
        role="status"
        aria-label={`Status: ${label}`}
      >
        {showIcon && React.cloneElement(config.icon, { 
          sx: { fontSize: sizeConfig.iconSize } 
        })}
        <Typography variant="body2" sx={{ fontSize: sizeConfig.fontSize }}>
          {label}
        </Typography>
      </Box>
    );
  }

  // Default chip variant
  return (
    <Chip
      icon={showIcon ? React.cloneElement(config.icon, { 
        sx: { fontSize: sizeConfig.iconSize } 
      }) : undefined}
      label={label}
      color={config.chipColor}
      size={size === 'large' ? 'medium' : 'small'}
      aria-label={`Status: ${label}`}
    />
  );
};

export default StatusIndicator;