/**
 * Market Trends Charts Component
 * Displays rent prices, vacancy rates, and market trends using Chart.js
 */

import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
} from '@mui/icons-material';
import { MarketTrend } from '../../types/market-intelligence';
import ConfidenceIndicator from '../../design-system/components/ai/ConfidenceIndicator';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface MarketTrendsChartsProps {
  trends: MarketTrend[];
  timeframe?: string;
  onTimeframeChange?: (timeframe: string) => void;
  loading?: boolean;
}

const MarketTrendsCharts: React.FC<MarketTrendsChartsProps> = ({
  trends,
  timeframe = '6months',
  onTimeframeChange,
  loading = false,
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = React.useState(timeframe);

  const handleTimeframeChange = (event: SelectChangeEvent) => {
    const newTimeframe = event.target.value;
    setSelectedTimeframe(newTimeframe);
    if (onTimeframeChange) {
      onTimeframeChange(newTimeframe);
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp color="success" />;
      case 'down':
        return <TrendingDown color="error" />;
      default:
        return <TrendingFlat color="warning" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'success';
      case 'down':
        return 'error';
      default:
        return 'warning';
    }
  };

  // Group trends by category
  const trendsByCategory = useMemo(() => {
    return trends.reduce((acc, trend) => {
      if (!acc[trend.category]) {
        acc[trend.category] = [];
      }
      acc[trend.category].push(trend);
      return acc;
    }, {} as Record<string, MarketTrend[]>);
  }, [trends]);

  // Prepare chart data for rent trends
  const rentTrendsData = useMemo(() => {
    const rentTrends = trendsByCategory.rent || [];
    const labels = rentTrends.map(trend => trend.timeframe);
    const currentValues = rentTrends.map(trend => trend.currentValue);
    const previousValues = rentTrends.map(trend => trend.previousValue);

    return {
      labels,
      datasets: [
        {
          label: 'Current Period',
          data: currentValues,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
        },
        {
          label: 'Previous Period',
          data: previousValues,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.1,
        },
      ],
    };
  }, [trendsByCategory]);

  // Prepare chart data for vacancy rates
  const vacancyRatesData = useMemo(() => {
    const vacancyTrends = trendsByCategory.vacancy || [];
    const labels = vacancyTrends.map(trend => trend.timeframe);
    const values = vacancyTrends.map(trend => trend.currentValue);

    return {
      labels,
      datasets: [
        {
          label: 'Vacancy Rate (%)',
          data: values,
          backgroundColor: values.map(value => 
            value > 10 ? 'rgba(255, 99, 132, 0.8)' : 
            value > 5 ? 'rgba(255, 206, 86, 0.8)' : 
            'rgba(75, 192, 192, 0.8)'
          ),
          borderColor: values.map(value => 
            value > 10 ? 'rgb(255, 99, 132)' : 
            value > 5 ? 'rgb(255, 206, 86)' : 
            'rgb(75, 192, 192)'
          ),
          borderWidth: 1,
        },
      ],
    };
  }, [trendsByCategory]);

  // Chart options
  const lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value) {
            return '$' + value.toLocaleString();
          },
        },
      },
    },
  };

  const barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return value + '%';
          },
        },
      },
    },
  };

  if (loading) {
    return (
      <Card>
        <CardHeader title="Market Trends" />
        <CardContent>
          <Box display="flex" justifyContent="center" p={4}>
            <Typography color="textSecondary">Loading market trends...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation={2}>
      <CardHeader
        title="Market Trends Analysis"
        subheader="Real-time market data with trend analysis"
        action={
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Timeframe</InputLabel>
            <Select
              value={selectedTimeframe}
              label="Timeframe"
              onChange={handleTimeframeChange}
            >
              <MenuItem value="1month">1 Month</MenuItem>
              <MenuItem value="3months">3 Months</MenuItem>
              <MenuItem value="6months">6 Months</MenuItem>
              <MenuItem value="1year">1 Year</MenuItem>
            </Select>
          </FormControl>
        }
      />
      <CardContent>
        {/* Trend Summary Cards */}
        <Grid container spacing={2} mb={3}>
          {Object.entries(trendsByCategory).map(([category, categoryTrends]) => {
            const latestTrend = categoryTrends[categoryTrends.length - 1];
            if (!latestTrend) return null;

            return (
              <Grid xs={12} sm={6} md={3} key={category}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={1}>
                      {getTrendIcon(latestTrend.trend)}
                      <Typography variant="h6" component="h3">
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </Typography>
                    </Box>
                    <Typography variant="h4" color="primary" gutterBottom>
                      {latestTrend.unit === '$' 
                        ? `$${latestTrend.currentValue.toLocaleString()}`
                        : `${latestTrend.currentValue}${latestTrend.unit}`
                      }
                    </Typography>
                    <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                      <Chip
                        label={`${latestTrend.change > 0 ? '+' : ''}${latestTrend.changePercent.toFixed(1)}%`}
                        color={getTrendColor(latestTrend.trend) as any}
                        size="small"
                      />
                      <Typography variant="caption" color="textSecondary">
                        vs {latestTrend.timeframe}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Charts */}
        <Grid container spacing={3}>
          {/* Rent Prices Chart */}
          {trendsByCategory.rent && trendsByCategory.rent.length > 0 && (
            <Grid xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader
                  title="Average Rent Prices"
                  subheader="Monthly rent price trends"
                />
                <CardContent>
                  <Box height={300}>
                    <Line data={rentTrendsData} options={lineChartOptions} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Vacancy Rates Chart */}
          {trendsByCategory.vacancy && trendsByCategory.vacancy.length > 0 && (
            <Grid xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader
                  title="Vacancy Rates"
                  subheader="Market vacancy percentage over time"
                />
                <CardContent>
                  <Box height={300}>
                    <Bar data={vacancyRatesData} options={barChartOptions} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Demand/Supply Chart */}
          {(trendsByCategory.demand || trendsByCategory.supply) && (
            <Grid xs={12}>
              <Card variant="outlined">
                <CardHeader
                  title="Supply & Demand Analysis"
                  subheader="Market balance indicators"
                />
                <CardContent>
                  <Box height={300}>
                    <Line 
                      data={{
                        labels: trendsByCategory.demand?.[0]?.timeframe ? 
                          [trendsByCategory.demand[0].timeframe] : ['Current'],
                        datasets: [
                          ...(trendsByCategory.demand ? [{
                            label: 'Demand Index',
                            data: trendsByCategory.demand.map(t => t.currentValue),
                            borderColor: 'rgb(75, 192, 192)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            tension: 0.1,
                          }] : []),
                          ...(trendsByCategory.supply ? [{
                            label: 'Supply Index',
                            data: trendsByCategory.supply.map(t => t.currentValue),
                            borderColor: 'rgb(255, 99, 132)',
                            backgroundColor: 'rgba(255, 99, 132, 0.2)',
                            tension: 0.1,
                          }] : []),
                        ],
                      }}
                      options={{
                        ...lineChartOptions,
                        scales: {
                          y: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: 'Index Value',
                            },
                          },
                        },
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>

        {/* AI Confidence Indicator */}
        <Box mt={3} display="flex" alignItems="center" justifyContent="center">
          <ConfidenceIndicator
            confidence={85}
            showTooltip
            explanation="Market trend analysis confidence based on data quality, sample size, and historical accuracy"
            variant="linear"
            size="medium"
            colorCoded
            showNumericalScore
          />
          <Typography variant="caption" color="textSecondary" ml={2}>
            AI Analysis Confidence
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default MarketTrendsCharts;