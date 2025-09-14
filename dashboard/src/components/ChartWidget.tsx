import React from 'react';
import {
  Paper,
  Box,
  Typography,
  IconButton,
  Tooltip,
  Skeleton,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Fullscreen as FullscreenIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { LineChart, BarChart, PieChart, HeatMap } from './charts';
import { WidgetConfig, TrendData } from '../services/dashboardService';

interface ChartWidgetProps {
  widget: WidgetConfig;
  data: TrendData[];
  onRefresh?: () => void;
  onFullscreen?: () => void;
  onSettings?: () => void;
  loading?: boolean;
  error?: string | null;
}

const ChartWidget: React.FC<ChartWidgetProps> = ({
  widget,
  data,
  onRefresh,
  onFullscreen,
  onSettings,
  loading = false,
  error = null,
}) => {
  const renderChart = () => {
    if (error) {
      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: widget.position.h * 60,
          }}
        >
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        </Box>
      );
    }

    if (loading) {
      return (
        <Box sx={{ p: 2 }}>
          <Skeleton variant="text" sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={widget.position.h * 50} />
        </Box>
      );
    }

    const chartHeight = widget.position.h * 60;

    switch (widget.type) {
      case 'line-chart':
        return (
          <LineChart
            data={data}
            title=""
            height={chartHeight}
            loading={false}
            {...widget.settings}
          />
        );
      case 'bar-chart':
        return (
          <BarChart
            data={data}
            title=""
            height={chartHeight}
            loading={false}
            {...widget.settings}
          />
        );
      case 'pie-chart':
        return (
          <PieChart
            data={data}
            title=""
            height={chartHeight}
            loading={false}
            {...widget.settings}
          />
        );
      case 'heat-map':
        return (
          <HeatMap
            data={data.map(d => ({
              x: d.label || d.date,
              y: 'Value',
              value: d.value,
            }))}
            title=""
            height={chartHeight}
            loading={false}
            {...widget.settings}
          />
        );
      default:
        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: chartHeight,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Unsupported chart type: {widget.type}
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Paper
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        '&:hover .widget-actions': {
          opacity: 1,
        },
      }}
    >
      {/* Widget Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 1,
          borderBottom: 1,
          borderColor: 'divider',
          minHeight: 48,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
          {widget.title}
        </Typography>

        {/* Action Buttons */}
        <Box
          className="widget-actions"
          sx={{
            display: 'flex',
            opacity: 0,
            transition: 'opacity 0.2s',
          }}
        >
          {onRefresh && (
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={onRefresh} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          )}
          {onSettings && (
            <Tooltip title="Settings">
              <IconButton size="small" onClick={onSettings}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          )}
          {onFullscreen && (
            <Tooltip title="Fullscreen">
              <IconButton size="small" onClick={onFullscreen}>
                <FullscreenIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Widget Content */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {renderChart()}
      </Box>

      {/* Widget Footer (optional - for additional info) */}
      {widget.settings?.showFooter && (
        <Box
          sx={{
            p: 1,
            borderTop: 1,
            borderColor: 'divider',
            backgroundColor: 'grey.50',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Last updated: {new Date().toLocaleTimeString()}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default ChartWidget;