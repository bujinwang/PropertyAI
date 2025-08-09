/**
 * Demand Forecast Charts Component
 * Displays demand forecasting with confidence indicators and trend analysis
 */

import React, { useMemo, useState } from 'react';
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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
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
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Timeline,
  Assessment,
  ExpandMore,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import { DemandForecast, ForecastFactor } from '../../types/market-intelligence';
import ConfidenceIndicator from '../../design-system/components/ai/ConfidenceIndicator';
import AIGeneratedContent from '../../design-system/components/ai/AIGeneratedContent';
import ExplanationTooltip from '../../design-system/components/ai/ExplanationTooltip';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DemandForecastChartsProps {
  forecasts: DemandForecast[];
  timeframe?: string;
  onTimeframeChange?: (timeframe: string) => void;
  loading?: boolean;
}

const DemandForecastCharts: React.FC<DemandForecastChartsProps> = ({
  forecasts,
  timeframe = '12months',
  onTimeframeChange,
  loading = false,
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);
  const [expandedFactor, setExpandedFactor] = useState<string | false>(false);

  const handleTimeframeChange = (event: SelectChangeEvent) => {
    const newTimeframe = event.target.value;
    setSelectedTimeframe(newTimeframe);
    if (onTimeframeChange) {
      onTimeframeChange(newTimeframe);
    }
  };

  const getTrendIcon = (trend: 'increasing' | 'decreasing' | 'stable') => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp color="success" />;
      case 'decreasing':
        return <TrendingDown color="error" />;
      default:
        return <TrendingFlat color="warning" />;
    }
  };

  const getTrendColor = (trend: 'increasing' | 'decreasing' | 'stable') => {
    switch (trend) {
      case 'increasing':
        return 'success';
      case 'decreasing':
        return 'error';
      default:
        return 'warning';
    }
  };

  // Prepare forecast chart data
  const forecastChartData = useMemo(() => {
    // Add null check for forecasts
    if (!forecasts || forecasts.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }
  
    const labels = forecasts.map(forecast => forecast.period);
    const demandValues = forecasts.map(forecast => forecast.predictedDemand);
    const confidenceValues = forecasts.map(forecast => forecast.confidence.value);
    
    // Calculate confidence bands (upper and lower bounds)
    const upperBound = demandValues.map((value, index) => {
      const confidence = confidenceValues[index] / 100;
      return value + (value * (1 - confidence) * 0.5);
    });
    
    const lowerBound = demandValues.map((value, index) => {
      const confidence = confidenceValues[index] / 100;
      return value - (value * (1 - confidence) * 0.5);
    });

    return {
      labels,
      datasets: [
        {
          label: 'Predicted Demand',
          data: demandValues,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4,
          fill: false,
        },
        {
          label: 'Upper Confidence Bound',
          data: upperBound,
          borderColor: 'rgba(75, 192, 192, 0.3)',
          backgroundColor: 'rgba(75, 192, 192, 0.1)',
          tension: 0.4,
          fill: '+1',
          pointRadius: 0,
        },
        {
          label: 'Lower Confidence Bound',
          data: lowerBound,
          borderColor: 'rgba(75, 192, 192, 0.3)',
          backgroundColor: 'rgba(75, 192, 192, 0.1)',
          tension: 0.4,
          fill: false,
          pointRadius: 0,
        },
      ],
    };
  }, [forecasts]);

  // Prepare confidence chart data
  const confidenceChartData = useMemo(() => {
    // Add null check for forecasts
    if (!forecasts || forecasts.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }
  
    const labels = forecasts.map(forecast => forecast.period);
    const confidenceValues = forecasts.map(forecast => forecast.confidence.value);

    return {
      labels,
      datasets: [
        {
          label: 'Forecast Confidence (%)',
          data: confidenceValues,
          backgroundColor: confidenceValues.map(value => 
            value >= 80 ? 'rgba(76, 175, 80, 0.8)' : 
            value >= 60 ? 'rgba(255, 193, 7, 0.8)' : 
            'rgba(244, 67, 54, 0.8)'
          ),
          borderColor: confidenceValues.map(value => 
            value >= 80 ? 'rgb(76, 175, 80)' : 
            value >= 60 ? 'rgb(255, 193, 7)' : 
            'rgb(244, 67, 54)'
          ),
          borderWidth: 1,
        },
      ],
    };
  }, [forecasts]);

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
      tooltip: {
        callbacks: {
          afterLabel: function(context) {
            if (context.datasetIndex === 0) {
              const forecast = forecasts[context.dataIndex];
              return `Confidence: ${forecast.confidence.value}%`;
            }
            return '';
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Demand Index',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Time Period',
        },
      },
    },
  };

  const barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Confidence (%)',
        },
      },
    },
  };

  // Get overall forecast summary
  const overallTrend = useMemo(() => {
    if (!forecasts || forecasts.length === 0) return 'stable';
    const firstValue = forecasts[0].predictedDemand;
    const lastValue = forecasts[forecasts.length - 1].predictedDemand;
    const change = ((lastValue - firstValue) / firstValue) * 100;
    
    if (change > 5) return 'increasing';
    if (change < -5) return 'decreasing';
    return 'stable';
  }, [forecasts]);

  const averageConfidence = useMemo(() => {
    if (!forecasts || forecasts.length === 0) return 0;
    return forecasts.reduce((sum, forecast) => sum + forecast.confidence.value, 0) / forecasts.length;
  }, [forecasts]);

  const handleFactorExpand = (panel: string) => (
    event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpandedFactor(isExpanded ? panel : false);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader title="Demand Forecast Analysis" />
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" height={400}>
            <Typography color="textSecondary">Loading demand forecasts...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <AIGeneratedContent
      confidence={averageConfidence}
      explanation="Demand forecasts generated using machine learning models analyzing historical data, market trends, and external factors"
      variant="outlined"
    >
      <Card elevation={2}>
        <CardHeader
          title="Demand Forecast Analysis"
          subheader={`AI-powered demand predictions with confidence indicators`}
          action={
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Timeframe</InputLabel>
              <Select
                value={selectedTimeframe}
                label="Timeframe"
                onChange={handleTimeframeChange}
              >
                <MenuItem value="6months">6 Months</MenuItem>
                <MenuItem value="12months">12 Months</MenuItem>
                <MenuItem value="18months">18 Months</MenuItem>
                <MenuItem value="24months">24 Months</MenuItem>
              </Select>
            </FormControl>
          }
        />
        <CardContent>
          {/* Summary Cards */}
          <Grid container spacing={2} mb={3}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={1}>
                    {getTrendIcon(overallTrend)}
                    <Typography variant="h6">
                      Overall Trend
                    </Typography>
                  </Box>
                  <Chip
                    label={overallTrend.charAt(0).toUpperCase() + overallTrend.slice(1)}
                    color={getTrendColor(overallTrend) as any}
                    size="small"
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" gutterBottom>
                    Average Confidence
                  </Typography>
                  <ConfidenceIndicator
                    confidence={averageConfidence}
                    variant="circular"
                    size="medium"
                    colorCoded
                    showNumericalScore
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" gutterBottom>
                    Forecast Periods
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {forecasts?.length || 0}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Data Points
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Charts */}
          <Grid container spacing={3} mb={3}>
            {/* Demand Forecast Chart */}
            <Grid size={{ xs: 12, lg: 8 }}>
              <Card variant="outlined">
                <CardHeader
                  title="Demand Forecast with Confidence Bands"
                  subheader="Predicted demand with uncertainty ranges"
                />
                <CardContent>
                  <Box height={350}>
                    <Line data={forecastChartData} options={lineChartOptions} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Confidence Chart */}
            <Grid size={{ xs: 12, lg: 4 }}>
              <Card variant="outlined">
                <CardHeader
                  title="Forecast Confidence"
                  subheader="Prediction reliability by period"
                />
                <CardContent>
                  <Box height={350}>
                    <Bar data={confidenceChartData} options={barChartOptions} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Forecast Factors Analysis */}
          <Card variant="outlined">
            <CardHeader
              title="Forecast Contributing Factors"
              subheader="Key factors influencing demand predictions"
            />
            <CardContent>
              {forecasts && forecasts.length > 0 && forecasts[0].factors?.map((factor, index) => (
                <Accordion
                  key={`${factor.name}-${index}`}
                  expanded={expandedFactor === factor.name}
                  onChange={handleFactorExpand(factor.name)}
                  sx={{ mb: 1 }}
                >
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box display="flex" alignItems="center" gap={2} width="100%">
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: factor.impact > 0 ? 'success.main' : 
                                   factor.impact < 0 ? 'error.main' : 'warning.main',
                        }}
                      />
                      <Typography variant="subtitle2" flex={1}>
                        {factor.name}
                      </Typography>
                      <Chip
                        label={`Impact: ${(factor.impact || 0) > 0 ? '+' : ''}${(factor.impact || 0).toFixed(1)}%`}
                        size="small"
                        color={(factor.impact || 0) > 0 ? 'success' : (factor.impact || 0) < 0 ? 'error' : 'default'}
                      />
                      <Chip
                        label={`Weight: ${((factor.weight || 0) * 100).toFixed(0)}%`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" color="textSecondary">
                      {factor.description}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </CardContent>
          </Card>

          {/* Forecast Reliability Alert */}
          <Box mt={3}>
            {averageConfidence >= 80 ? (
              <Alert severity="success" icon={<CheckCircle />}>
                <Typography variant="body2">
                  <strong>High Reliability:</strong> Forecast confidence is above 80%. 
                  Predictions are based on strong historical patterns and stable market conditions.
                </Typography>
              </Alert>
            ) : averageConfidence >= 60 ? (
              <Alert severity="warning" icon={<Warning />}>
                <Typography variant="body2">
                  <strong>Moderate Reliability:</strong> Forecast confidence is moderate (60-80%). 
                  Consider market volatility and external factors when making decisions.
                </Typography>
              </Alert>
            ) : (
              <Alert severity="error" icon={<Warning />}>
                <Typography variant="body2">
                  <strong>Low Reliability:</strong> Forecast confidence is below 60%. 
                  High market uncertainty detected. Use predictions with caution.
                </Typography>
              </Alert>
            )}
          </Box>

          {/* Methodology Explanation */}
          <Box mt={2} display="flex" justifyContent="center">
            <ExplanationTooltip
              title="Forecast Methodology"
              content="Our AI models use time series analysis, regression modeling, and external data sources including economic indicators, seasonal patterns, and market events to predict future demand with confidence intervals."
              placement="top"
            >
              <Typography variant="caption" color="primary" sx={{ cursor: 'pointer' }}>
                Learn about our forecasting methodology
              </Typography>
            </ExplanationTooltip>
          </Box>
        </CardContent>
      </Card>
    </AIGeneratedContent>
  );
};

export default DemandForecastCharts;