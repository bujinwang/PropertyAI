import React from 'react';
import {
  Box,
  Typography,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Skeleton
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { RatingAnalytics } from '../../types/enhancedTenantRating';

interface RatingChartProps {
  analytics: RatingAnalytics;
  chartType?: 'trend' | 'distribution' | 'categories';
  height?: number;
  loading?: boolean;
}

const COLORS = {
  primary: '#1976d2',
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
  info: '#2196f3'
};

const RATING_COLORS = ['#f44336', '#ff5722', '#ff9800', '#4caf50', '#2e7d32'];

const RatingChart: React.FC<RatingChartProps> = ({
  analytics,
  chartType = 'trend',
  height = 300,
  loading = false
}) => {
  const [selectedChart, setSelectedChart] = React.useState(chartType);

  const handleChartTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newChartType: string | null,
  ) => {
    if (newChartType !== null) {
      setSelectedChart(newChartType as 'trend' | 'distribution' | 'categories');
    }
  };

  // Prepare trend data
  const trendData = analytics.trendData.map(item => ({
    ...item,
    formattedDate: format(parseISO(item.date), 'MMM dd'),
    rating: Number(Number(item.rating || 0).toFixed(1))
  }));

  // Prepare distribution data
  const distributionData = Object.entries(analytics.ratingDistribution)
    .map(([rating, count]) => ({
      rating: `${rating} Star${rating !== '1' ? 's' : ''}`,
      count,
      percentage: analytics.totalRatings > 0 ? ((count / analytics.totalRatings) * 100).toFixed(1) : '0'
    }))
    .sort((a, b) => parseInt(b.rating) - parseInt(a.rating));

  // Prepare categories data
  const categoriesData = Object.entries(analytics.averageRatings)
    .filter(([key]) => key !== 'overall')
    .map(([key, value]) => ({
      category: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
      rating: Number(Number(value || 0).toFixed(1)),
      color: Number(value || 0) >= 4 ? COLORS.success : Number(value || 0) >= 3 ? COLORS.warning : COLORS.error
    }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper elevation={3} sx={{ p: 2, bgcolor: 'background.paper' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
            {label}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Typography key={index} variant="body2" sx={{ color: entry.color }}>
              {entry.name}: {entry.value}
              {selectedChart === 'distribution' && entry.payload.percentage && ` (${entry.payload.percentage}%)`}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Paper elevation={2} sx={{ p: 3 }}>
        <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" width="100%" height={height} />
      </Paper>
    );
  }

  const renderChart = () => {
    switch (selectedChart) {
      case 'trend':
        if (trendData.length === 0) {
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height }}>
              <Typography color="text.secondary">
                No trend data available. Need at least 2 ratings to show trends.
              </Typography>
            </Box>
          );
        }
        
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                dataKey="formattedDate" 
                stroke="#666"
                fontSize={12}
              />
              <YAxis 
                domain={[0, 5]} 
                stroke="#666"
                fontSize={12}
                tickFormatter={(value) => `${value}★`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="rating"
                stroke={COLORS.primary}
                strokeWidth={3}
                dot={{ fill: COLORS.primary, strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: COLORS.primary, strokeWidth: 2 }}
                name="Rating"
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'distribution':
        if (distributionData.length === 0) {
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height }}>
              <Typography color="text.secondary">
                No rating distribution data available.
              </Typography>
            </Box>
          );
        }

        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={distributionData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                dataKey="rating" 
                stroke="#666"
                fontSize={12}
              />
              <YAxis 
                stroke="#666"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="count" 
                name="Count"
                radius={[4, 4, 0, 0]}
              >
                {distributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={RATING_COLORS[4 - index] || COLORS.primary} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case 'categories':
        if (categoriesData.length === 0) {
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height }}>
              <Typography color="text.secondary">
                No category data available.
              </Typography>
            </Box>
          );
        }

        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart 
              data={categoriesData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              layout="horizontal"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                type="number"
                domain={[0, 5]}
                stroke="#666"
                fontSize={12}
                tickFormatter={(value) => `${value}★`}
              />
              <YAxis 
                type="category"
                dataKey="category"
                stroke="#666"
                fontSize={12}
                width={100}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="rating" 
                name="Average Rating"
                radius={[0, 4, 4, 0]}
              >
                {categoriesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  const getChartTitle = () => {
    switch (selectedChart) {
      case 'trend':
        return 'Rating Trends Over Time';
      case 'distribution':
        return 'Rating Distribution';
      case 'categories':
        return 'Average Ratings by Category';
      default:
        return 'Rating Analytics';
    }
  };

  const getChartDescription = () => {
    switch (selectedChart) {
      case 'trend':
        return 'Shows how ratings have changed over time';
      case 'distribution':
        return 'Shows the distribution of ratings from 1-5 stars';
      case 'categories':
        return 'Shows average ratings for each category';
      default:
        return '';
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            {getChartTitle()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {getChartDescription()}
          </Typography>
        </Box>

        <ToggleButtonGroup
          value={selectedChart}
          exclusive
          onChange={handleChartTypeChange}
          size="small"
        >
          <ToggleButton value="trend">
            Trend
          </ToggleButton>
          <ToggleButton value="distribution">
            Distribution
          </ToggleButton>
          <ToggleButton value="categories">
            Categories
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {renderChart()}
    </Paper>
  );
};

export default RatingChart;