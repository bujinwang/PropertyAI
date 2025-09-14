import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Tabs,
  Tab
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Home,
  AttachMoney,
  Assessment,
  Timeline
} from '@mui/icons-material';
import { marketDataService, MarketData, MarketTrends, PricingRecommendation, CompetitiveAnalysis } from '../services/marketDataService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`market-tabpanel-${index}`}
      aria-labelledby={`market-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const MarketTrendsDashboard: React.FC = () => {
  const [zipCode, setZipCode] = useState<string>('10001');
  const [propertyId, setPropertyId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState<number>(0);

  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [trends, setTrends] = useState<MarketTrends | null>(null);
  const [recommendations, setRecommendations] = useState<PricingRecommendation | null>(null);
  const [analysis, setAnalysis] = useState<CompetitiveAnalysis | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const fetchMarketData = async () => {
    if (!zipCode.trim()) {
      setError('Please enter a valid zip code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await marketDataService.getMarketDashboardData(zipCode, propertyId || undefined);

      setMarketData(result.marketData);
      setTrends(result.trends);
      setRecommendations(result.recommendations || null);
      setAnalysis(result.analysis || null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch market data');
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend.toLowerCase()) {
      case 'increasing':
        return <TrendingUp color="success" />;
      case 'decreasing':
        return <TrendingDown color="error" />;
      default:
        return <TrendingFlat color="action" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend.toLowerCase()) {
      case 'increasing':
        return 'success.main';
      case 'decreasing':
        return 'error.main';
      default:
        return 'text.secondary';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
        Market Trends Dashboard
      </Typography>

      {/* Search Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              label="Zip Code"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              placeholder="e.g., 10001"
              sx={{ minWidth: 200 }}
            />
            <TextField
              label="Property ID (Optional)"
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              placeholder="For personalized recommendations"
              sx={{ minWidth: 200 }}
            />
            <Button
              variant="contained"
              onClick={fetchMarketData}
              disabled={loading}
              sx={{ height: 56, minWidth: 150 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Analyze Market'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {marketData && (
        <>
          {/* Market Overview */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
            <Card sx={{ minWidth: 250, flex: 1 }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <Home color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Market Overview</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {zipCode} Market Data
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Source: {marketData.source}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Updated: {new Date(marketData.lastUpdated).toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ minWidth: 250, flex: 1 }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  {getTrendIcon(marketData.marketTrend)}
                  <Typography variant="h6" sx={{ ml: 1 }}>Market Trend</Typography>
                </Box>
                <Typography variant="h4" sx={{ color: getTrendColor(marketData.marketTrend) }}>
                  {formatPercentage(marketData.trendPercentage)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {marketData.marketTrend.charAt(0).toUpperCase() + marketData.marketTrend.slice(1)}
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ minWidth: 250, flex: 1 }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <AttachMoney color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Avg 2BR Rent</Typography>
                </Box>
                <Typography variant="h4">
                  {formatCurrency(marketData.avgRent2BR)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  1BR: {formatCurrency(marketData.avgRent1BR)}
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ minWidth: 250, flex: 1 }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <Assessment color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Vacancy Rate</Typography>
                </Box>
                <Typography variant="h4">
                  {marketData.vacancyRate.toFixed(1)}%
                </Typography>
                <Chip
                  label={marketData.vacancyRate < 3 ? 'Low' : marketData.vacancyRate > 6 ? 'High' : 'Moderate'}
                  color={marketData.vacancyRate < 3 ? 'success' : marketData.vacancyRate > 6 ? 'error' : 'warning'}
                  size="small"
                />
              </CardContent>
            </Card>
          </Box>

          {/* Tabs for detailed analysis */}
          <Card>
            <CardContent>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="market analysis tabs">
                <Tab label="Market Trends" icon={<Timeline />} iconPosition="start" />
                <Tab label="Comparable Properties" icon={<Home />} iconPosition="start" />
                {recommendations && (
                  <Tab label="Pricing Recommendations" icon={<AttachMoney />} iconPosition="start" />
                )}
                {analysis && (
                  <Tab label="Competitive Analysis" icon={<Assessment />} iconPosition="start" />
                )}
              </Tabs>

              {/* Market Trends Tab */}
              <TabPanel value={tabValue} index={0}>
                {trends && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      12-Month Trend Analysis
                    </Typography>
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Month</TableCell>
                            <TableCell align="right">Avg 2BR Rent</TableCell>
                            <TableCell align="right">Vacancy Rate</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {trends.trends.slice(-6).map((trend) => (
                            <TableRow key={trend.date}>
                              <TableCell>{new Date(trend.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</TableCell>
                              <TableCell align="right">{formatCurrency(trend.avgRent2BR)}</TableCell>
                              <TableCell align="right">{trend.vacancyRate.toFixed(1)}%</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
              </TabPanel>

              {/* Comparable Properties Tab */}
              <TabPanel value={tabValue} index={1}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Similar Properties in {zipCode}
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Address</TableCell>
                          <TableCell align="right">Rent</TableCell>
                          <TableCell align="right">Sq Ft</TableCell>
                          <TableCell align="center">Beds</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {marketData.comparableProperties.map((property, index) => (
                          <TableRow key={index}>
                            <TableCell>{property.address}</TableCell>
                            <TableCell align="right">{formatCurrency(property.rent)}</TableCell>
                            <TableCell align="right">{property.sqft}</TableCell>
                            <TableCell align="center">{property.beds}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </TabPanel>

              {/* Pricing Recommendations Tab */}
              {recommendations && (
                <TabPanel value={tabValue} index={2}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Pricing Recommendations
                    </Typography>
                    {recommendations.recommendations.map((rec, index) => (
                      <Alert
                        key={index}
                        severity={rec.confidence > 80 ? 'success' : rec.confidence > 60 ? 'warning' : 'info'}
                        sx={{ mb: 2 }}
                      >
                        <Typography variant="subtitle2">{rec.action}</Typography>
                        <Typography variant="body2">{rec.reasoning}</Typography>
                        <Box mt={1}>
                          <Typography variant="caption">
                            Current: {formatCurrency(rec.currentRent)} |
                            Market: {formatCurrency(rec.marketAverage)} |
                            Confidence: {rec.confidence}%
                          </Typography>
                        </Box>
                      </Alert>
                    ))}
                  </Box>
                </TabPanel>
              )}

              {/* Competitive Analysis Tab */}
              {analysis && (
                <TabPanel value={tabValue} index={3}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Competitive Position Analysis
                    </Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
                      <Card sx={{ minWidth: 200, flex: 1 }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>Market Position</Typography>
                          <Chip
                            label={analysis.marketPosition.toUpperCase()}
                            color={
                              analysis.marketPosition === 'premium' ? 'success' :
                              analysis.marketPosition === 'value' ? 'warning' : 'info'
                            }
                            sx={{ fontSize: '1rem', py: 1, px: 2 }}
                          />
                        </CardContent>
                      </Card>

                      <Card sx={{ minWidth: 200, flex: 1 }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>Price Difference</Typography>
                          <Typography variant="h4" sx={{
                            color: analysis.marketDifference > 0 ? 'success.main' : 'error.main'
                          }}>
                            {formatPercentage(analysis.marketDifference)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            vs Market Average
                          </Typography>
                        </CardContent>
                      </Card>

                      <Card sx={{ minWidth: 200, flex: 1 }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>Comparable Properties</Typography>
                          <Typography variant="h4">
                            {analysis.comparableProperties.length}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Similar listings found
                          </Typography>
                        </CardContent>
                      </Card>
                    </Box>

                    {analysis.insights.map((insight, index) => (
                      <Alert key={index} severity="info" sx={{ mb: 2 }}>
                        {insight}
                      </Alert>
                    ))}
                  </Box>
                </TabPanel>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
};

export default MarketTrendsDashboard;