import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  DatePicker,
  Button,
  Chip,
  CircularProgress,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useUXMetrics } from '../../hooks/useUXMetrics';

interface MetricData {
  date: string;
  metricName: string;
  value: number;
  category: string;
  source: string;
}

interface MetricSummary {
  metricName: string;
  average: number;
  min: number;
  max: number;
  count: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export const UXAnalyticsDashboard: React.FC = () => {
  const { getMetrics, getMetricsSummary, isLoading, error } = useUXMetrics();
  
  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)); // 30 days ago
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [selectedMetric, setSelectedMetric] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [summary, setSummary] = useState<MetricSummary[]>([]);

  // Fetch available metrics and categories
  const fetchData = async () => {
    try {
      const [metricsData, summaryData] = await Promise.all([
        getMetrics({
          startDate,
          endDate,
          metricName: selectedMetric || undefined,
          category: selectedCategory || undefined,
        }),
        getMetricsSummary(startDate, endDate),
      ]);

      setMetrics(metricsData);
      setSummary(summaryData);
    } catch (err) {
      console.error('Failed to fetch UX analytics:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, selectedMetric, selectedCategory]);

  const handleRefresh = () => {
    fetchData();
  };

  // Process data for charts
  const processTimeSeriesData = () => {
    const groupedByDate = metrics.reduce((acc, metric) => {
      const date = new Date(metric.date).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = {};
      }
      acc[date][metric.metricName] = metric.value;
      return acc;
    }, {} as Record<string, Record<string, number>>);

    return Object.entries(groupedByDate).map(([date, values]) => ({
      date,
      ...values,
    }));
  };

  const processCategoryData = () => {
    const groupedByCategory = metrics.reduce((acc, metric) => {
      if (!acc[metric.category]) {
        acc[metric.category] = { count: 0, totalValue: 0 };
      }
      acc[metric.category].count += 1;
      acc[metric.category].totalValue += metric.value;
      return acc;
    }, {} as Record<string, { count: number; totalValue: number }>);

    return Object.entries(groupedByCategory).map(([category, data]) => ({
      category,
      count: data.count,
      averageValue: data.totalValue / data.count,
    }));
  };

  const processSourceData = () => {
    const groupedBySource = metrics.reduce((acc, metric) => {
      if (!acc[metric.source]) {
        acc[metric.source] = 0;
      }
      acc[metric.source] += 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(groupedBySource).map(([source, count]) => ({
      source,
      count,
    }));
  };

  const uniqueMetrics = [...new Set(metrics.map(m => m.metricName))];
  const uniqueCategories = [...new Set(metrics.map(m => m.category))];

  const timeSeriesData = processTimeSeriesData();
  const categoryData = processCategoryData();
  const sourceData = processSourceData();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <Typography color="error">Error loading analytics: {error}</Typography>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box p={3}>
        <Typography variant="h4" gutterBottom>
          UX Analytics Dashboard
        </Typography>

        {/* Filters */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(date) => date && setStartDate(date)}
              slotProps={{
                textField: { fullWidth: true, size: 'small' }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={(date) => date && setEndDate(date)}
              slotProps={{
                textField: { fullWidth: true, size: 'small' }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Metric</InputLabel>
              <Select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                label="Metric"
              >
                <MenuItem value="">All Metrics</MenuItem>
                {uniqueMetrics.map(metric => (
                  <MenuItem key={metric} value={metric}>{metric.replace('_', ' ')}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                label="Category"
              >
                <MenuItem value="">All Categories</MenuItem>
                {uniqueCategories.map(category => (
                  <MenuItem key={category} value={category}>{category}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Summary Cards */}
          {summary.map((item) => (
            <Grid item xs={12} sm={6} md={3} key={item.metricName}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {item.metricName.replace('_', ' ')}
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {item.average.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Min: {item.min} | Max: {item.max}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Samples: {item.count}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {/* Time Series Chart */}
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Time Series Analysis
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {uniqueMetrics.map((metric, index) => (
                      <Line
                        key={metric}
                        type="monotone"
                        dataKey={metric}
                        stroke={COLORS[index % COLORS.length]}
                        strokeWidth={2}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Category Distribution */}
          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Category Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, count }) => `${category}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Source Distribution */}
          <Grid item xs={12} lg={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Source Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sourceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="source" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Metrics List */}
          <Grid item xs={12} lg={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Metrics
                </Typography>
                <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {metrics.slice(0, 10).map((metric, index) => (
                    <Box key={index} mb={1} pb={1} borderBottom={1} borderColor="divider">
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">
                          {metric.metricName.replace('_', ' ')}
                        </Typography>
                        <Chip label={metric.value} size="small" color="primary" />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(metric.date).toLocaleDateString()} • {metric.category}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box mt={3} display="flex" justifyContent="center">
          <Button variant="contained" onClick={handleRefresh}>
            Refresh Data
          </Button>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};