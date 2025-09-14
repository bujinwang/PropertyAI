import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  LinearProgress,
  Badge
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface AnalyticsData {
  summary: {
    totalSensors: number;
    activeSensors: number;
    sensorsWithAlerts: number;
    totalReadings: number;
    totalAlerts: number;
    uptime: number;
  };
  sensorTypeBreakdown: Record<string, number>;
  recentAlerts: Array<{
    id: string;
    sensorName: string;
    deviceName: string;
    type: string;
    severity: string;
    message: string;
    timestamp: string;
    acknowledged: boolean;
  }>;
  timeRange: string;
}

interface SensorData {
  timestamp: string;
  value: number;
  quality: number;
}

interface AnalyticsDashboardProps {
  propertyId: string;
  timeRange?: '1h' | '24h' | '7d' | '30d';
  onAlertAcknowledged?: (alertId: string) => void;
  onSensorSelected?: (sensorId: string) => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  propertyId,
  timeRange = '24h',
  onAlertAcknowledged,
  onSensorSelected
}) => {
  const theme = useTheme();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [selectedSensor, setSelectedSensor] = useState<string | null>(null);
  const [exportDialog, setExportDialog] = useState<{
    open: boolean;
    sensorId?: string;
  }>({ open: false });

  useEffect(() => {
    fetchAnalyticsData();
  }, [propertyId, selectedTimeRange]);

  useEffect(() => {
    if (selectedSensor) {
      fetchSensorData(selectedSensor);
    }
  }, [selectedSensor]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/iot/properties/${propertyId}/analytics?timeRange=${selectedTimeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const data = await response.json();
      setAnalyticsData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSensorData = async (sensorId: string) => {
    try {
      const endDate = new Date();
      const startDate = new Date();

      switch (selectedTimeRange) {
        case '1h':
          startDate.setHours(startDate.getHours() - 1);
          break;
        case '24h':
          startDate.setHours(startDate.getHours() - 24);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
      }

      const response = await fetch(
        `/api/iot/sensors/${sensorId}/readings?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&limit=1000`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch sensor data');
      }

      const data = await response.json();
      setSensorData(data);
    } catch (err) {
      console.error('Failed to fetch sensor data:', err);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/iot/alerts/${alertId}/acknowledge`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ userId: 'current-user-id' }) // Replace with actual user ID
      });

      if (!response.ok) {
        throw new Error('Failed to acknowledge alert');
      }

      // Update local state
      if (analyticsData) {
        setAnalyticsData({
          ...analyticsData,
          recentAlerts: analyticsData.recentAlerts.map(alert =>
            alert.id === alertId ? { ...alert, acknowledged: true } : alert
          )
        });
      }

      onAlertAcknowledged?.(alertId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to acknowledge alert');
    }
  };

  const handleExportData = async () => {
    if (!selectedSensor) return;

    try {
      const endDate = new Date();
      const startDate = new Date();

      switch (selectedTimeRange) {
        case '1h':
          startDate.setHours(startDate.getHours() - 1);
          break;
        case '24h':
          startDate.setHours(startDate.getHours() - 24);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
      }

      const response = await fetch(
        `/api/iot/sensors/${selectedSensor}/export?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&format=csv`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sensor-data-${selectedSensor}-${selectedTimeRange}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setExportDialog({ open: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export data');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return theme.palette.error.main;
      case 'high':
        return theme.palette.warning.main;
      case 'medium':
        return theme.palette.info.main;
      case 'low':
        return theme.palette.success.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return <ErrorIcon />;
      case 'high':
        return <WarningIcon />;
      case 'medium':
        return <InfoIcon />;
      case 'low':
        return <CheckCircleIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUpIcon color="success" />;
      case 'decreasing':
        return <TrendingDownIcon color="error" />;
      default:
        return null;
    }
  };

  const prepareChartData = (data: SensorData[]) => {
    return data.map(item => ({
      ...item,
      timestamp: new Date(item.timestamp).toLocaleTimeString()
    }));
  };

  const preparePieData = () => {
    if (!analyticsData) return [];

    return Object.entries(analyticsData.sensorTypeBreakdown).map(([type, count]) => ({
      name: type,
      value: count,
      color: theme.palette.primary.main // You can customize colors per type
    }));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  if (!analyticsData) {
    return (
      <Alert severity="info">
        No analytics data available
      </Alert>
    );
  }

  const COLORS = [theme.palette.primary.main, theme.palette.secondary.main, theme.palette.success.main, theme.palette.warning.main];

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          IoT Analytics Dashboard
        </Typography>
        <Box display="flex" gap={2}>
          <TextField
            select
            size="small"
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="1h">Last Hour</MenuItem>
            <MenuItem value="24h">Last 24 Hours</MenuItem>
            <MenuItem value="7d">Last 7 Days</MenuItem>
            <MenuItem value="30d">Last 30 Days</MenuItem>
          </TextField>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchAnalyticsData}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Sensors
              </Typography>
              <Typography variant="h4">
                {analyticsData.summary.totalSensors}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Sensors
              </Typography>
              <Typography variant="h4" color="success.main">
                {analyticsData.summary.activeSensors}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {analyticsData.summary.uptime.toFixed(1)}% uptime
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Readings
              </Typography>
              <Typography variant="h4">
                {analyticsData.summary.totalReadings.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Alerts
              </Typography>
              <Typography variant="h4" color="warning.main">
                <Badge badgeContent={analyticsData.summary.totalAlerts} color="error">
                  {analyticsData.summary.sensorsWithAlerts}
                </Badge>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Sensor Type Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={preparePieData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {preparePieData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              System Health
            </Typography>
            <Box mb={2}>
              <Typography variant="body2" color="textSecondary">
                Overall Uptime
              </Typography>
              <LinearProgress
                variant="determinate"
                value={analyticsData.summary.uptime}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="body2" sx={{ mt: 1 }}>
                {analyticsData.summary.uptime.toFixed(1)}%
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="textSecondary">
                Alert Rate
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(analyticsData.summary.sensorsWithAlerts / analyticsData.summary.totalSensors) * 100}
                color="warning"
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="body2" sx={{ mt: 1 }}>
                {((analyticsData.summary.sensorsWithAlerts / analyticsData.summary.totalSensors) * 100).toFixed(1)}%
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Sensor Data Chart */}
      {selectedSensor && sensorData.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Sensor Data Trend
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={prepareChartData(sensorData)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <RechartsTooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke={theme.palette.primary.main}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {/* Recent Alerts */}
      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Recent Alerts ({analyticsData.recentAlerts.length})
          </Typography>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => setExportDialog({ open: true })}
            disabled={!selectedSensor}
          >
            Export Data
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Severity</TableCell>
                <TableCell>Sensor/Device</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {analyticsData.recentAlerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getSeverityIcon(alert.severity)}
                      <Chip
                        label={alert.severity}
                        size="small"
                        sx={{
                          backgroundColor: getSeverityColor(alert.severity),
                          color: 'white'
                        }}
                      />
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {alert.sensorName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {alert.deviceName}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">
                      {alert.type}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">
                      {alert.message}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">
                      {new Date(alert.timestamp).toLocaleString()}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={alert.acknowledged ? 'Acknowledged' : 'Active'}
                      size="small"
                      color={alert.acknowledged ? 'success' : 'warning'}
                    />
                  </TableCell>

                  <TableCell>
                    <Box display="flex" gap={1}>
                      {!alert.acknowledged && (
                        <Tooltip title="Acknowledge Alert">
                          <IconButton
                            size="small"
                            onClick={() => handleAcknowledgeAlert(alert.id)}
                          >
                            <CheckCircleIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => onSensorSelected?.(alert.id)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Export Dialog */}
      <Dialog
        open={exportDialog.open}
        onClose={() => setExportDialog({ open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Export Sensor Data</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Export data for the selected time range ({selectedTimeRange}) in CSV format.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This will include timestamp, value, and quality data for analysis.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialog({ open: false })}>
            Cancel
          </Button>
          <Button
            onClick={handleExportData}
            variant="contained"
            startIcon={<DownloadIcon />}
          >
            Export
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AnalyticsDashboard;