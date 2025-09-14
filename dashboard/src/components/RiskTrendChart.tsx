import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';

interface RiskAssessment {
  assessmentId: string;
  overallRiskScore: number;
  riskLevel: 'minimal' | 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  assessmentDate: string;
  nextAssessmentDate: string;
  dataQuality: number;
  riskFactors?: any;
  mitigationStrategies?: any[];
  trendData?: any;
}

interface PortfolioRisk {
  overallScore: number;
  riskLevel: string;
  confidence: number;
  criticalCount: number;
  highCount: number;
  riskFactors: any;
  mitigationStrategies: any[];
  dataQuality: number;
}

interface RiskTrendChartProps {
  portfolioRisk: PortfolioRisk | null;
  propertyRisks: RiskAssessment[];
  tenantRisks: RiskAssessment[];
}

interface TrendData {
  date: string;
  portfolio: number;
  properties: number;
  tenants: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  minimal: number;
}

export const RiskTrendChart: React.FC<RiskTrendChartProps> = ({
  portfolioRisk,
  propertyRisks,
  tenantRisks
}) => {
  const [timeRange, setTimeRange] = useState('30d');
  const [chartType, setChartType] = useState('line');
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(false);

  // Risk level colors
  const riskColors = {
    critical: '#d32f2f',
    high: '#f57c00',
    medium: '#fbc02d',
    low: '#388e3c',
    minimal: '#1976d2'
  };

  // Generate mock trend data (in real implementation, this would come from API)
  const generateTrendData = (days: number): TrendData[] => {
    const data: TrendData[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      // Generate realistic trend data
      const baseScore = portfolioRisk?.overallScore || 2.5;
      const variation = (Math.random() - 0.5) * 0.8; // Random variation
      const trend = Math.sin(i / 10) * 0.3; // Seasonal trend

      const portfolioScore = Math.max(0, Math.min(5, baseScore + variation + trend));

      // Generate risk level distribution
      const totalEntities = propertyRisks.length + tenantRisks.length || 10;
      const critical = Math.floor(Math.random() * 3);
      const high = Math.floor(Math.random() * 5);
      const medium = Math.floor(Math.random() * totalEntities * 0.3);
      const low = Math.floor(Math.random() * totalEntities * 0.4);
      const minimal = totalEntities - critical - high - medium - low;

      data.push({
        date: date.toISOString().split('T')[0],
        portfolio: parseFloat(portfolioScore.toFixed(1)),
        properties: parseFloat((portfolioScore + (Math.random() - 0.5) * 0.5).toFixed(1)),
        tenants: parseFloat((portfolioScore + (Math.random() - 0.5) * 0.5).toFixed(1)),
        critical,
        high,
        medium,
        low,
        minimal
      });
    }

    return data;
  };

  // Handle time range change
  const handleTimeRangeChange = (event: SelectChangeEvent) => {
    setTimeRange(event.target.value);
  };

  // Handle chart type change
  const handleChartTypeChange = (event: SelectChangeEvent) => {
    setChartType(event.target.value);
  };

  // Load trend data
  useEffect(() => {
    setLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const data = generateTrendData(days);
      setTrendData(data);
      setLoading(false);
    }, 500);
  }, [timeRange, portfolioRisk, propertyRisks, tenantRisks]);

  // Calculate trend statistics
  const trendStats = React.useMemo(() => {
    if (trendData.length < 2) return null;

    const firstScore = trendData[0].portfolio;
    const lastScore = trendData[trendData.length - 1].portfolio;
    const change = lastScore - firstScore;
    const changePercent = (change / firstScore) * 100;

    let trend = 'stable';
    let trendIcon = <TrendingFlatIcon />;
    let trendColor = '#757575';

    if (Math.abs(changePercent) > 5) {
      if (changePercent > 0) {
        trend = 'increasing';
        trendIcon = <TrendingUpIcon sx={{ color: '#d32f2f' }} />;
        trendColor = '#d32f2f';
      } else {
        trend = 'decreasing';
        trendIcon = <TrendingDownIcon sx={{ color: '#388e3c' }} />;
        trendColor = '#388e3c';
      }
    }

    return {
      change: parseFloat(change.toFixed(1)),
      changePercent: parseFloat(changePercent.toFixed(1)),
      trend,
      trendIcon,
      trendColor,
      averageScore: parseFloat((trendData.reduce((sum, d) => sum + d.portfolio, 0) / trendData.length).toFixed(1))
    };
  }, [trendData]);

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 2, boxShadow: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            {new Date(label).toLocaleDateString()}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Box key={index} display="flex" alignItems="center" mb={0.5}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  backgroundColor: entry.color,
                  borderRadius: '50%',
                  mr: 1
                }}
              />
              <Typography variant="body2">
                {entry.name}: {entry.value}
                {entry.dataKey === 'portfolio' || entry.dataKey === 'properties' || entry.dataKey === 'tenants'
                  ? ''
                  : ` (${((entry.value / (propertyRisks.length + tenantRisks.length || 10)) * 100).toFixed(1)}%)`
                }
              </Typography>
            </Box>
          ))}
        </Paper>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <Box textAlign="center">
          <LinearProgress sx={{ mb: 2, width: 200 }} />
          <Typography variant="body2" color="text.secondary">
            Loading trend data...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {/* Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                label="Time Range"
                onChange={handleTimeRangeChange}
              >
                <MenuItem value="7d">Last 7 Days</MenuItem>
                <MenuItem value="30d">Last 30 Days</MenuItem>
                <MenuItem value="90d">Last 90 Days</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Chart Type</InputLabel>
              <Select
                value={chartType}
                label="Chart Type"
                onChange={handleChartTypeChange}
              >
                <MenuItem value="line">Line Chart</MenuItem>
                <MenuItem value="area">Area Chart</MenuItem>
                <MenuItem value="bar">Bar Chart</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Trend Statistics */}
      {trendStats && (
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h6" color="text.secondary">
                      Risk Trend
                    </Typography>
                    <Typography variant="h4" sx={{ color: trendStats.trendColor }}>
                      {trendStats.change > 0 ? '+' : ''}{trendStats.change}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {trendStats.changePercent > 0 ? '+' : ''}{trendStats.changePercent}% change
                    </Typography>
                  </Box>
                  {trendStats.trendIcon}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Average Risk Score
                </Typography>
                <Typography variant="h4">
                  {trendStats.averageScore}
                </Typography>
                <Chip
                  label={trendStats.trend}
                  size="small"
                  sx={{
                    backgroundColor: trendStats.trendColor,
                    color: 'white',
                    mt: 1
                  }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Data Points
                </Typography>
                <Typography variant="h4">
                  {trendData.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {timeRange} period
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Risk Score Trends Chart */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Risk Score Trends
        </Typography>

        <Box sx={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            {chartType === 'line' && (
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <YAxis domain={[0, 5]} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="portfolio"
                  stroke="#1976d2"
                  strokeWidth={3}
                  name="Portfolio Risk"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="properties"
                  stroke="#388e3c"
                  strokeWidth={2}
                  name="Avg Property Risk"
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="tenants"
                  stroke="#f57c00"
                  strokeWidth={2}
                  name="Avg Tenant Risk"
                  dot={{ r: 3 }}
                />
              </LineChart>
            )}

            {chartType === 'area' && (
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <YAxis domain={[0, 5]} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="portfolio"
                  stackId="1"
                  stroke="#1976d2"
                  fill="#1976d2"
                  fillOpacity={0.6}
                  name="Portfolio Risk"
                />
                <Area
                  type="monotone"
                  dataKey="properties"
                  stackId="2"
                  stroke="#388e3c"
                  fill="#388e3c"
                  fillOpacity={0.4}
                  name="Avg Property Risk"
                />
                <Area
                  type="monotone"
                  dataKey="tenants"
                  stackId="3"
                  stroke="#f57c00"
                  fill="#f57c00"
                  fillOpacity={0.4}
                  name="Avg Tenant Risk"
                />
              </AreaChart>
            )}

            {chartType === 'bar' && (
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <YAxis domain={[0, 5]} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="portfolio" fill="#1976d2" name="Portfolio Risk" />
                <Bar dataKey="properties" fill="#388e3c" name="Avg Property Risk" />
                <Bar dataKey="tenants" fill="#f57c00" name="Avg Tenant Risk" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </Box>
      </Paper>

      {/* Risk Level Distribution Chart */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Risk Level Distribution Over Time
        </Typography>

        <Box sx={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => new Date(date).toLocaleDateString()}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="critical"
                stackId="1"
                stroke={riskColors.critical}
                fill={riskColors.critical}
                name="Critical"
              />
              <Area
                type="monotone"
                dataKey="high"
                stackId="1"
                stroke={riskColors.high}
                fill={riskColors.high}
                name="High"
              />
              <Area
                type="monotone"
                dataKey="medium"
                stackId="1"
                stroke={riskColors.medium}
                fill={riskColors.medium}
                name="Medium"
              />
              <Area
                type="monotone"
                dataKey="low"
                stackId="1"
                stroke={riskColors.low}
                fill={riskColors.low}
                name="Low"
              />
              <Area
                type="monotone"
                dataKey="minimal"
                stackId="1"
                stroke={riskColors.minimal}
                fill={riskColors.minimal}
                name="Minimal"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    </Box>
  );
};