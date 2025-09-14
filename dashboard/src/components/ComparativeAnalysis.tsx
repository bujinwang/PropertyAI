import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  ButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
} from '@mui/material';
import {
  Compare as CompareIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
  FilterList as FilterIcon,
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
} from '@mui/icons-material';
import { LineChart, BarChart } from './charts';
import {
  dashboardService,
  AnalyticsData,
  TrendData,
  AnalyticsFilters,
} from '../services/dashboardService';

interface ComparativeAnalysisProps {
  onAlertCreated?: (alert: any) => void;
}

interface ComparisonConfig {
  type: 'time' | 'property' | 'metric';
  baseline: {
    period: string;
    propertyId?: string;
    metric?: string;
  };
  comparison: {
    period: string;
    propertyId?: string;
    metric?: string;
  };
}

interface AlertConfig {
  id: string;
  metric: string;
  condition: 'above' | 'below' | 'change';
  threshold: number;
  enabled: boolean;
  propertyId?: string;
}

const ComparativeAnalysis: React.FC<ComparativeAnalysisProps> = ({ onAlertCreated }) => {
  const [comparisonConfig, setComparisonConfig] = useState<ComparisonConfig>({
    type: 'time',
    baseline: { period: '30d' },
    comparison: { period: '60d' },
  });

  const [baselineData, setBaselineData] = useState<AnalyticsData | null>(null);
  const [comparisonData, setComparisonData] = useState<AnalyticsData | null>(null);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<AlertConfig[]>([]);

  const loadComparisonData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const baselineFilters: AnalyticsFilters = {
        period: comparisonConfig.baseline.period,
        propertyId: comparisonConfig.baseline.propertyId,
      };

      const comparisonFilters: AnalyticsFilters = {
        period: comparisonConfig.comparison.period,
        propertyId: comparisonConfig.comparison.propertyId,
      };

      const [baseline, comparison] = await Promise.all([
        dashboardService.getAnalyticsData(baselineFilters),
        dashboardService.getAnalyticsData(comparisonFilters),
      ]);

      setBaselineData(baseline);
      setComparisonData(comparison);

      // Load trend data for visualization
      const trends = await dashboardService.getTrendData('revenue', baselineFilters);
      setTrendData(trends);

    } catch (err) {
      setError('Failed to load comparison data');
      console.error('Comparison data loading error:', err);
    } finally {
      setLoading(false);
    }
  }, [comparisonConfig]);

  const calculateDifference = (baseline: number, comparison: number) => {
    const diff = comparison - baseline;
    const percentChange = baseline !== 0 ? (diff / baseline) * 100 : 0;
    return { diff, percentChange };
  };

  const renderComparisonCard = (
    title: string,
    baselineValue: number,
    comparisonValue: number,
    formatValue?: (value: number) => string
  ) => {
    const { diff, percentChange } = calculateDifference(baselineValue, comparisonValue);
    const isPositive = diff > 0;

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {title}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="h5" sx={{ mr: 1 }}>
              {formatValue ? formatValue(comparisonValue) : comparisonValue.toLocaleString()}
            </Typography>
            {isPositive ? (
              <TrendingUpIcon color="success" />
            ) : (
              <TrendingDownIcon color="error" />
            )}
          </Box>

          <Typography variant="body2" color="text.secondary">
            vs {formatValue ? formatValue(baselineValue) : baselineValue.toLocaleString()} ({comparisonConfig.baseline.period})
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <Typography
              variant="body2"
              color={isPositive ? 'success.main' : 'error.main'}
              sx={{ mr: 1 }}
            >
              {isPositive ? '+' : ''}{diff > 0 ? '+' : ''}{percentChange.toFixed(1)}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ({isPositive ? '+' : ''}{diff.toLocaleString()})
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const handleCreateAlert = useCallback((metric: string, threshold: number, condition: 'above' | 'below') => {
    const newAlert: AlertConfig = {
      id: `alert-${Date.now()}`,
      metric,
      condition,
      threshold,
      enabled: true,
      propertyId: comparisonConfig.baseline.propertyId,
    };

    setAlerts(prev => [...prev, newAlert]);

    if (onAlertCreated) {
      onAlertCreated(newAlert);
    }
  }, [comparisonConfig.baseline.propertyId, onAlertCreated]);

  const toggleAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId ? { ...alert, enabled: !alert.enabled } : alert
    ));
  }, []);

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
        <Button onClick={loadComparisonData} sx={{ ml: 2 }}>
          Retry
        </Button>
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        Comparative Analysis
      </Typography>

      {/* Configuration Panel */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Comparison Configuration
        </Typography>

        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Comparison Type</InputLabel>
              <Select
                value={comparisonConfig.type}
                label="Comparison Type"
                onChange={(e) => setComparisonConfig(prev => ({
                  ...prev,
                  type: e.target.value as any
                }))}
              >
                <MenuItem value="time">Time Period</MenuItem>
                <MenuItem value="property">Property</MenuItem>
                <MenuItem value="metric">Metric</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Baseline Period</InputLabel>
              <Select
                value={comparisonConfig.baseline.period}
                label="Baseline Period"
                onChange={(e) => setComparisonConfig(prev => ({
                  ...prev,
                  baseline: { ...prev.baseline, period: e.target.value }
                }))}
              >
                <MenuItem value="7d">Last 7 days</MenuItem>
                <MenuItem value="30d">Last 30 days</MenuItem>
                <MenuItem value="90d">Last 90 days</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Comparison Period</InputLabel>
              <Select
                value={comparisonConfig.comparison.period}
                label="Comparison Period"
                onChange={(e) => setComparisonConfig(prev => ({
                  ...prev,
                  comparison: { ...prev.comparison, period: e.target.value }
                }))}
              >
                <MenuItem value="7d">Last 7 days</MenuItem>
                <MenuItem value="30d">Last 30 days</MenuItem>
                <MenuItem value="90d">Last 90 days</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={2}>
            <Button
              fullWidth
              variant="contained"
              onClick={loadComparisonData}
              disabled={loading}
              startIcon={<CompareIcon />}
            >
              {loading ? 'Loading...' : 'Compare'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Results */}
      {baselineData && comparisonData && (
        <>
          {/* KPI Comparison Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              {renderComparisonCard(
                'Revenue',
                baselineData.revenue.value,
                comparisonData.revenue.value,
                (value) => `$${value.toLocaleString()}`
              )}
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              {renderComparisonCard(
                'Occupancy Rate',
                baselineData.occupancyRate.value,
                comparisonData.occupancyRate.value,
                (value) => `${value.toFixed(1)}%`
              )}
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              {renderComparisonCard(
                'Maintenance Costs',
                baselineData.maintenanceCosts.value,
                comparisonData.maintenanceCosts.value,
                (value) => `$${value.toLocaleString()}`
              )}
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              {renderComparisonCard(
                'Tenant Satisfaction',
                baselineData.tenantSatisfaction.value,
                comparisonData.tenantSatisfaction.value,
                (value) => `${value.toFixed(1)}%`
              )}
            </Grid>
          </Grid>

          {/* Trend Visualization */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Trend Comparison
                </Typography>
                <LineChart
                  data={trendData}
                  title="Revenue Trends Comparison"
                  height={300}
                  loading={loading}
                />
              </Paper>
            </Grid>
          </Grid>

          {/* Alert Management */}
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                KPI Alerts & Notifications
              </Typography>
              <Button
                variant="outlined"
                startIcon={<NotificationsIcon />}
                onClick={() => handleCreateAlert('revenue', 10000, 'below')}
              >
                Create Alert
              </Button>
            </Box>

            {alerts.length > 0 && (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Metric</TableCell>
                      <TableCell>Condition</TableCell>
                      <TableCell>Threshold</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {alerts.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell>{alert.metric}</TableCell>
                        <TableCell>{alert.condition}</TableCell>
                        <TableCell>{alert.threshold.toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip
                            label={alert.enabled ? 'Active' : 'Disabled'}
                            color={alert.enabled ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => toggleAlert(alert.id)}
                          >
                            {alert.enabled ? <NotificationsActiveIcon /> : <NotificationsIcon />}
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {alerts.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No alerts configured. Create alerts to get notified when KPIs meet certain conditions.
              </Typography>
            )}
          </Paper>
        </>
      )}
    </Box>
  );
};

export default ComparativeAnalysis;