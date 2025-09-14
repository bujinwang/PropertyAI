import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';
import { TrendData } from '../../services/dashboardService';

interface BarChartProps {
  data: TrendData[];
  title?: string;
  xAxisKey?: string;
  yAxisKey?: string;
  color?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  loading?: boolean;
  orientation?: 'vertical' | 'horizontal';
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  title,
  xAxisKey = 'date',
  yAxisKey = 'value',
  color,
  height = 300,
  showGrid = true,
  showLegend = true,
  loading = false,
  orientation = 'vertical',
}) => {
  const theme = useTheme();

  const chartColor = color || theme.palette.primary.main;

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
          Loading chart...
        </Typography>
      </Box>
    );
  }

  const isHorizontal = orientation === 'horizontal';

  return (
    <Box>
      {title && (
        <Typography variant="h6" component="h3" gutterBottom>
          {title}
        </Typography>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
          layout={isHorizontal ? 'horizontal' : 'vertical'}
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={theme.palette.divider}
            />
          )}
          <XAxis
            type={isHorizontal ? 'number' : 'category'}
            dataKey={isHorizontal ? yAxisKey : xAxisKey}
            stroke={theme.palette.text.secondary}
            fontSize={12}
          />
          <YAxis
            type={isHorizontal ? 'category' : 'number'}
            dataKey={isHorizontal ? xAxisKey : undefined}
            stroke={theme.palette.text.secondary}
            fontSize={12}
            width={isHorizontal ? 80 : 60}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 4,
            }}
            labelStyle={{ color: theme.palette.text.primary }}
          />
          {showLegend && <Legend />}
          <Bar
            dataKey={yAxisKey}
            fill={chartColor}
            radius={[2, 2, 0, 0]}
          />
        </RechartsBarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default BarChart;