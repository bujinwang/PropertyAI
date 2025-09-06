// PropertyFlow AI Analytics Dashboard
// Comprehensive dashboard showcasing data visualization components

import * as React from 'react';
const { useState, useEffect, useMemo } = React;
import {
  Box,
  Typography,
  Grid,
  Paper,
  Tab,
  Tabs,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Divider,
  Alert,
  Button,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Home as HomeIcon,
  Build as MaintenanceIcon,
  People as PeopleIcon,
  MoreVert as MoreIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  DateRange as DateRangeIcon,
  ViewModule as GridViewIcon,
  ViewList as ListViewIcon,
} from '@mui/icons-material';
import {
  LineChart,
  BarChart,
  PieChart,
  generatePropertyRevenueData,
  generateExpenseBreakdownData,
  generateOccupancyTrendData,
  generateMaintenanceMetricsData,
  formatCurrency,
  formatPercentage,
  DEFAULT_CHART_CONFIG,
} from '../design-system/data-visualization';
import { FormSection, FormRow } from '../design-system/forms';

interface KPICardProps {
  title: string;
  value: string | number;
  change: number;
  changeLabel: string;
  icon: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'error';
}

const KPICard: React.FC<KPICardProps> = ({ 
  title, 
  value, 
  change, 
  changeLabel, 
  icon, 
  color = 'primary' 
}) => {
  const isPositive = change >= 0;
  const changeColor = color === 'error' ? 
    (isPositive ? 'error' : 'success') : 
    (isPositive ? 'success' : 'error');

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              {typeof value === 'number' ? formatCurrency(value) : value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
          <Box sx={{ color: `${color}.main` }}>
            {icon}
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            size="small"
            label={`${isPositive ? '+' : ''}${change.toFixed(1)}%`}
            color={changeColor}
            variant="outlined"
          />
          <Typography variant="caption" color="text.secondary">
            {changeLabel}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  loading?: boolean;
}

const ChartCard: React.FC<ChartCardProps> = ({ 
  title, 
  subtitle, 
  children, 
  actions,
  loading = false 
}) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title={title}
        subheader={subtitle}
        action={actions}
        sx={{ pb: 1 }}
      />
      <CardContent sx={{ pt: 0, '&:last-child': { pb: 2 } }}>
        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: 300 
          }}>
            <Typography variant="body2" color="text.secondary">
              Loading...
            </Typography>
          </Box>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
};

const AnalyticsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState('12m');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [refreshing, setRefreshing] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Generate demo data
  const revenueData = useMemo(() => generatePropertyRevenueData(12), []);
  const expenseData = useMemo(() => generateExpenseBreakdownData(), []);
  const occupancyData = useMemo(() => generateOccupancyTrendData(12), []);
  const maintenanceData = useMemo(() => generateMaintenanceMetricsData(), []);

  // KPI calculations
  const currentRevenue = 52000;
  const previousRevenue = 48000;
  const revenueChange = ((currentRevenue - previousRevenue) / previousRevenue) * 100;

  const currentOccupancy = 87.5;
  const previousOccupancy = 84.2;
  const occupancyChange = currentOccupancy - previousOccupancy;

  const totalExpenses = expenseData.series[0].data.reduce((sum, item) => sum + item.y, 0);
  const previousExpenses = 45000;
  const expenseChange = ((totalExpenses - previousExpenses) / previousExpenses) * 100;

  const activeMaintenanceRequests = 23;
  const previousRequests = 28;
  const requestChange = ((activeMaintenanceRequests - previousRequests) / previousRequests) * 100;

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleTimeRangeChange = (_: React.MouseEvent<HTMLElement>, newRange: string) => {
    if (newRange !== null) {
      setTimeRange(newRange);
    }
  };

  const handleViewModeChange = (_: React.MouseEvent<HTMLElement>, newViewMode: 'grid' | 'list') => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleExport = (format: string) => {
    console.log(`Exporting dashboard in ${format} format`);
    handleMenuClose();
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Dashboard Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Property Analytics Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Comprehensive insights into property performance, financials, and operations
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <ToggleButtonGroup
              value={timeRange}
              exclusive
              onChange={handleTimeRangeChange}
              size="small"
            >
              <ToggleButton value="7d">7D</ToggleButton>
              <ToggleButton value="30d">30D</ToggleButton>
              <ToggleButton value="12m">12M</ToggleButton>
              <ToggleButton value="1y">1Y</ToggleButton>
            </ToggleButtonGroup>
            
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewModeChange}
              size="small"
            >
              <ToggleButton value="grid">
                <GridViewIcon />
              </ToggleButton>
              <ToggleButton value="list">
                <ListViewIcon />
              </ToggleButton>
            </ToggleButtonGroup>
            
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={refreshing}
              size="small"
            >
              Refresh
            </Button>
            
            <IconButton onClick={handleMenuClick}>
              <MoreIcon />
            </IconButton>
          </Box>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            This dashboard demonstrates PropertyFlow AI's data visualization capabilities with sample data.
            Real-time data integration and advanced analytics features are available in production.
          </Typography>
        </Alert>
      </Box>

      {/* Export Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => handleExport('pdf')}>
          <DownloadIcon sx={{ mr: 1 }} /> Export as PDF
        </MenuItem>
        <MenuItem onClick={() => handleExport('excel')}>
          <DownloadIcon sx={{ mr: 1 }} /> Export as Excel
        </MenuItem>
        <MenuItem onClick={() => handleExport('csv')}>
          <DownloadIcon sx={{ mr: 1 }} /> Export as CSV
        </MenuItem>
      </Menu>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Monthly Revenue"
            value={currentRevenue}
            change={revenueChange}
            changeLabel="vs last month"
            icon={<MoneyIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Occupancy Rate"
            value={formatPercentage(currentOccupancy)}
            change={occupancyChange}
            changeLabel="vs last month"
            icon={<HomeIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total Expenses"
            value={totalExpenses}
            change={expenseChange}
            changeLabel="vs last month"
            icon={<TrendingUpIcon />}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Active Requests"
            value={activeMaintenanceRequests}
            change={requestChange}
            changeLabel="vs last month"
            icon={<MaintenanceIcon />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Navigation Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="analytics dashboard tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Financial Overview" />
          <Tab label="Property Performance" />
          <Tab label="Maintenance Analytics" />
          <Tab label="Market Insights" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Revenue Trend */}
          <Grid item xs={12} md={8}>
            <ChartCard
              title="Revenue Trend"
              subtitle="Monthly rental income over time"
              loading={refreshing}
            >
              <LineChart
                data={revenueData}
                height={350}
                showDots={true}
                smooth={true}
                xAxisType="date"
                {...DEFAULT_CHART_CONFIG}
              />
            </ChartCard>
          </Grid>
          
          {/* Expense Breakdown */}
          <Grid item xs={12} md={4}>
            <ChartCard
              title="Expense Breakdown"
              subtitle="Current month expenses by category"
              loading={refreshing}
            >
              <PieChart
                data={expenseData}
                height={350}
                variant="doughnut"
                showPercentages={true}
                customLegend={true}
                {...DEFAULT_CHART_CONFIG}
              />
            </ChartCard>
          </Grid>
          
          {/* Profit Margin Analysis */}
          <Grid item xs={12}>
            <ChartCard
              title="Profit Margin Analysis"
              subtitle="Revenue vs expenses comparison"
              loading={refreshing}
            >
              <BarChart
                data={{
                  series: [
                    {
                      name: 'Revenue',
                      data: revenueData.series[0].data,
                      color: '#10b981'
                    },
                    {
                      name: 'Expenses',
                      data: revenueData.series[0].data.map(point => ({
                        ...point,
                        y: point.y * 0.7 + Math.random() * point.y * 0.2 // Simulate expense data
                      })),
                      color: '#ef4444'
                    }
                  ],
                  metadata: {
                    title: 'Monthly Revenue vs Expenses',
                    subtitle: 'Comparison of income and expenses over time'
                  }
                }}
                height={350}
                showValues={false}
                stacked={false}
                {...DEFAULT_CHART_CONFIG}
              />
            </ChartCard>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          {/* Occupancy Trend */}
          <Grid item xs={12} md={6}>
            <ChartCard
              title="Occupancy Rate Trend"
              subtitle="Property occupancy percentage over time"
              loading={refreshing}
            >
              <LineChart
                data={occupancyData}
                height={350}
                showArea={true}
                areaOpacity={0.3}
                referenceLines={[
                  { value: 90, label: 'Target', color: '#10b981', strokeDasharray: '5 5' },
                  { value: 70, label: 'Minimum', color: '#ef4444', strokeDasharray: '5 5' }
                ]}
                {...DEFAULT_CHART_CONFIG}
              />
            </ChartCard>
          </Grid>
          
          {/* Property Performance Metrics */}
          <Grid item xs={12} md={6}>
            <ChartCard
              title="Property Performance Score"
              subtitle="Overall performance rating"
              loading={refreshing}
            >
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h2" component="div" sx={{ mb: 2, color: 'primary.main' }}>
                  8.7/10
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                  Excellent Performance
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Financial Score
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      9.2/10
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Tenant Satisfaction
                    </Typography>
                    <Typography variant="h6" color="primary.main">
                      8.8/10
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Maintenance Score
                    </Typography>
                    <Typography variant="h6" color="warning.main">
                      7.5/10
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Market Position
                    </Typography>
                    <Typography variant="h6" color="info.main">
                      8.3/10
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </ChartCard>
          </Grid>
        </Grid>
      )}

      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                Maintenance analytics help optimize property operations and reduce costs.
                Track request patterns, response times, and resource allocation.
              </Typography>
            </Alert>
          </Grid>
          
          {/* Placeholder for maintenance analytics */}
          <Grid item xs={12} md={6}>
            <ChartCard
              title="Maintenance Requests by Category"
              subtitle="Distribution of maintenance requests"
              loading={refreshing}
            >
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 8 }}>
                Maintenance analytics charts will be implemented here.
                This would show request categories, response times, and cost analysis.
              </Typography>
            </ChartCard>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <ChartCard
              title="Response Time Trends"
              subtitle="Average response times over time"
              loading={refreshing}
            >
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 8 }}>
                Response time trend analysis with SLA compliance tracking.
              </Typography>
            </ChartCard>
          </Grid>
        </Grid>
      )}

      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                Market insights provide competitive analysis and market positioning data
                to help optimize pricing and investment strategies.
              </Typography>
            </Alert>
          </Grid>
          
          {/* Placeholder for market insights */}
          <Grid item xs={12} md={8}>
            <ChartCard
              title="Market Rent Comparison"
              subtitle="Your property vs market average"
              loading={refreshing}
            >
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 8 }}>
                Market comparison charts showing rental rates, vacancy rates,
                and competitive positioning in the local market.
              </Typography>
            </ChartCard>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <ChartCard
              title="Market Position"
              subtitle="Competitive ranking"
              loading={refreshing}
            >
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 8 }}>
                Market position analysis and recommendations.
              </Typography>
            </ChartCard>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default AnalyticsDashboard;