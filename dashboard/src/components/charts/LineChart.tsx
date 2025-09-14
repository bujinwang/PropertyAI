import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';
import { TrendData } from '../../services/dashboardService';

interface LineChartProps {
  data: TrendData[];
  title?: string;
  xAxisKey?: string;
  yAxisKey?: string;
  color?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  loading?: boolean;
}

const LineChart: React.FC<LineChartProps> = ({
  data,
  title,
  xAxisKey = 'date',
  yAxisKey = 'value',
  color,
  height = 300,
  showGrid = true,
  showLegend = true,
  loading = false,
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

  return (
    <Box>
      {title && (
        <Typography variant="h6" component="h3" gutterBottom>
          {title}
        </Typography>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={theme.palette.divider}
            />
          )}
          <XAxis
            dataKey={xAxisKey}
            stroke={theme.palette.text.secondary}
            fontSize={12}
          />
          <YAxis
            stroke={theme.palette.text.secondary}
            fontSize={12}
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
          <Line
            type="monotone"
            dataKey={yAxisKey}
            stroke={chartColor}
            strokeWidth={2}
            dot={{ fill: chartColor, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: chartColor, strokeWidth: 2 }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default LineChart;