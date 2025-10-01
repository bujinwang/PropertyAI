import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Chip,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';

interface MetricsWidgetProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'flat';
  trendValue?: string;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  icon?: React.ReactNode;
  loading?: boolean;
  prefix?: string;
  suffix?: string;
}

export function MetricsWidget({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  color = 'primary',
  icon,
  loading = false,
  prefix = '',
  suffix = '',
}: MetricsWidgetProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUpIcon fontSize="small" />;
      case 'down':
        return <TrendingDownIcon fontSize="small" />;
      case 'flat':
        return <TrendingFlatIcon fontSize="small" />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'success';
      case 'down':
        return 'error';
      case 'flat':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            
            {loading ? (
              <Box display="flex" alignItems="center" height={48}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <>
                <Typography
                  variant="h4"
                  component="div"
                  color={`${color}.main`}
                  fontWeight="bold"
                  sx={{ my: 1 }}
                >
                  {prefix}
                  {value}
                  {suffix}
                </Typography>

                {(trend || subtitle) && (
                  <Box display="flex" alignItems="center" gap={1} mt={1}>
                    {trend && trendValue && (
                      <Chip
                        icon={getTrendIcon()}
                        label={trendValue}
                        size="small"
                        color={getTrendColor()}
                        variant="outlined"
                      />
                    )}
                    {subtitle && (
                      <Typography variant="caption" color="text.secondary">
                        {subtitle}
                      </Typography>
                    )}
                  </Box>
                )}
              </>
            )}
          </Box>

          {icon && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 56,
                height: 56,
                borderRadius: 2,
                bgcolor: `${color}.light`,
                color: `${color}.main`,
              }}
            >
              {icon}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

export default MetricsWidget;
