import React from 'react';
import { Box, Typography, useTheme, Paper } from '@mui/material';
import { HeatMapData } from '../../services/dashboardService';

interface HeatMapProps {
  data: HeatMapData[];
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  colorScale?: string[];
  height?: number;
  loading?: boolean;
}

const HeatMap: React.FC<HeatMapProps> = ({
  data,
  title,
  xAxisLabel = 'X Axis',
  yAxisLabel = 'Y Axis',
  colorScale,
  height = 300,
  loading = false,
}) => {
  const theme = useTheme();

  const defaultColorScale = [
    '#f7fbff',
    '#deebf7',
    '#c6dbef',
    '#9ecae1',
    '#6baed6',
    '#4292c6',
    '#2171b5',
    '#08519c',
    '#08306b',
  ];

  const colors = colorScale || defaultColorScale;

  if (loading) {
    return (
      <Box
        sx={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Loading heatmap...
        </Typography>
      </Box>
    );
  }

  // Get unique values for axes
  const xValues = Array.from(new Set(data.map(d => d.x))).sort();
  const yValues = Array.from(new Set(data.map(d => d.y))).sort();

  // Find min and max values for color scaling
  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  const getColor = (value: number) => {
    if (maxValue === minValue) return colors[0];
    const ratio = (value - minValue) / (maxValue - minValue);
    const index = Math.floor(ratio * (colors.length - 1));
    return colors[Math.max(0, Math.min(colors.length - 1, index))];
  };

  const getDataPoint = (x: string, y: string) => {
    return data.find(d => d.x === x && d.y === y);
  };

  const cellSize = Math.min(40, Math.max(20, (height - 100) / Math.max(yValues.length, 1)));

  return (
    <Box>
      {title && (
        <Typography variant="h6" component="h3" gutterBottom>
          {title}
        </Typography>
      )}

      <Box sx={{ overflow: 'auto', maxHeight: height }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 'fit-content' }}>
          {/* Y-axis labels */}
          <Box sx={{ display: 'flex' }}>
            <Box sx={{ width: 60, height: cellSize, display: 'flex', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ transform: 'rotate(-90deg)', fontSize: '0.7rem' }}>
                {yAxisLabel}
              </Typography>
            </Box>
            {xValues.map(x => (
              <Box
                key={x}
                sx={{
                  width: cellSize,
                  height: cellSize,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="caption" sx={{ fontSize: '0.7rem', textAlign: 'center' }}>
                  {x}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Heatmap grid */}
          {yValues.map(y => (
            <Box key={y} sx={{ display: 'flex' }}>
              {/* Y-axis label */}
              <Box
                sx={{
                  width: 60,
                  height: cellSize,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  pr: 1,
                }}
              >
                <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                  {y}
                </Typography>
              </Box>

              {/* Data cells */}
              {xValues.map(x => {
                const dataPoint = getDataPoint(x, y);
                const value = dataPoint?.value || 0;
                const color = getColor(value);

                return (
                  <Paper
                    key={`${x}-${y}`}
                    elevation={1}
                    sx={{
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      border: `1px solid ${theme.palette.divider}`,
                      '&:hover': {
                        opacity: 0.8,
                      },
                    }}
                    title={`${xAxisLabel}: ${x}, ${yAxisLabel}: ${y}, Value: ${value}`}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.6rem',
                        color: theme.palette.getContrastText(color),
                        fontWeight: 'bold',
                      }}
                    >
                      {value}
                    </Typography>
                  </Paper>
                );
              })}
            </Box>
          ))}

          {/* X-axis label */}
          <Box sx={{ display: 'flex', mt: 1 }}>
            <Box sx={{ width: 60 }} />
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                {xAxisLabel}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Legend */}
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="caption" sx={{ mr: 1 }}>
          {minValue}
        </Typography>
        {colors.map((color, index) => (
          <Box
            key={index}
            sx={{
              width: 20,
              height: 20,
              backgroundColor: color,
              border: `1px solid ${theme.palette.divider}`,
            }}
          />
        ))}
        <Typography variant="caption" sx={{ ml: 1 }}>
          {maxValue}
        </Typography>
      </Box>
    </Box>
  );
};

export default HeatMap;