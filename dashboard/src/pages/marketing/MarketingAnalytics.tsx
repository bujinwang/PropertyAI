import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface AnalyticsData {
  websiteTraffic: Array<{
    date: string;
    visitors: number;
    pageViews: number;
    bounceRate: number;
  }>;
  leadSources: Array<{
    source: string;
    leads: number;
    cost: number;
    conversion: number;
  }>;
  propertyViews: Array<{
    propertyId: string;
    propertyName: string;
    views: number;
    inquiries: number;
    conversionRate: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const MarketingAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    websiteTraffic: [],
    leadSources: [],
    propertyViews: []
  });

  useEffect(() => {
    // Mock data - replace with actual API call
    setAnalyticsData({
      websiteTraffic: [
        { date: '2024-01-01', visitors: 1200, pageViews: 3400, bounceRate: 35 },
        { date: '2024-01-02', visitors: 1350, pageViews: 3800, bounceRate: 32 },
        { date: '2024-01-03', visitors: 1100, pageViews: 3100, bounceRate: 38 },
        { date: '2024-01-04', visitors: 1450, pageViews: 4200, bounceRate: 29 },
        { date: '2024-01-05', visitors: 1600, pageViews: 4800, bounceRate: 25 },
        { date: '2024-01-06', visitors: 1300, pageViews: 3900, bounceRate: 33 },
        { date: '2024-01-07', visitors: 1250, pageViews: 3600, bounceRate: 36 }
      ],
      leadSources: [
        { source: 'Google Ads', leads: 145, cost: 2800, conversion: 12.5 },
        { source: 'Facebook', leads: 89, cost: 1200, conversion: 8.3 },
        { source: 'Zillow', leads: 234, cost: 4500, conversion: 15.2 },
        { source: 'Apartments.com', leads: 167, cost: 3200, conversion: 11.8 },
        { source: 'Organic Search', leads: 298, cost: 0, conversion: 18.7 }
      ],
      propertyViews: [
        { propertyId: '1', propertyName: 'Downtown Luxury Loft', views: 2340, inquiries: 45, conversionRate: 1.9 },
        { propertyId: '2', propertyName: 'Suburban Family Home', views: 1890, inquiries: 38, conversionRate: 2.0 },
        { propertyId: '3', propertyName: 'Waterfront Condo', views: 3200, inquiries: 72, conversionRate: 2.3 },
        { propertyId: '4', propertyName: 'City Center Apartment', views: 1560, inquiries: 28, conversionRate: 1.8 },
        { propertyId: '5', propertyName: 'Garden View Studio', views: 980, inquiries: 15, conversionRate: 1.5 }
      ]
    });
  }, [timeRange]);

  const totalLeads = analyticsData.leadSources.reduce((sum, source) => sum + source.leads, 0);
  const totalCost = analyticsData.leadSources.reduce((sum, source) => sum + source.cost, 0);
  const avgConversion = analyticsData.leadSources.reduce((sum, source) => sum + source.conversion, 0) / analyticsData.leadSources.length;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Marketing Analytics
        </Typography>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            label="Time Range"
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <MenuItem value="7d">Last 7 days</MenuItem>
            <MenuItem value="30d">Last 30 days</MenuItem>
            <MenuItem value="90d">Last 90 days</MenuItem>
            <MenuItem value="1y">Last year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Leads
              </Typography>
              <Typography variant="h4">
                {totalLeads.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="success.main">
                +12% from last period
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Marketing Spend
              </Typography>
              <Typography variant="h4">
                ${totalCost.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="error.main">
                +8% from last period
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Cost per Lead
              </Typography>
              <Typography variant="h4">
                ${Math.round(totalCost / totalLeads)}
              </Typography>
              <Typography variant="body2" color="success.main">
                -3% from last period
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Avg. Conversion Rate
              </Typography>
              <Typography variant="h4">
                {avgConversion.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="success.main">
                +2.1% from last period
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Website Traffic Chart */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Website Traffic
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData.websiteTraffic}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="visitors"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                    name="Visitors"
                  />
                  <Area
                    type="monotone"
                    dataKey="pageViews"
                    stackId="2"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    name="Page Views"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Lead Sources Pie Chart */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Lead Sources
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData.leadSources}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ source, percent }) => `${source} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="leads"
                  >
                    {analyticsData.leadSources.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Lead Sources Performance Table */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Lead Source Performance
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Source</TableCell>
                      <TableCell align="right">Leads</TableCell>
                      <TableCell align="right">Cost</TableCell>
                      <TableCell align="right">Cost/Lead</TableCell>
                      <TableCell align="right">Conversion</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analyticsData.leadSources.map((source) => (
                      <TableRow key={source.source}>
                        <TableCell>{source.source}</TableCell>
                        <TableCell align="right">{source.leads}</TableCell>
                        <TableCell align="right">${source.cost.toLocaleString()}</TableCell>
                        <TableCell align="right">
                          ${source.cost > 0 ? Math.round(source.cost / source.leads) : 0}
                        </TableCell>
                        <TableCell align="right">{source.conversion}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Property Performance */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Performing Properties
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Property</TableCell>
                      <TableCell align="right">Views</TableCell>
                      <TableCell align="right">Inquiries</TableCell>
                      <TableCell align="right">Conv. Rate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analyticsData.propertyViews.map((property) => (
                      <TableRow key={property.propertyId}>
                        <TableCell>{property.propertyName}</TableCell>
                        <TableCell align="right">{property.views.toLocaleString()}</TableCell>
                        <TableCell align="right">{property.inquiries}</TableCell>
                        <TableCell align="right">{property.conversionRate}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Conversion Funnel Chart */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Conversion Funnel
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    { stage: 'Website Visitors', count: 12500 },
                    { stage: 'Property Views', count: 8900 },
                    { stage: 'Inquiries', count: 1200 },
                    { stage: 'Applications', count: 450 },
                    { stage: 'Leases Signed', count: 180 }
                  ]}
                  layout="horizontal"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="stage" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MarketingAnalytics;