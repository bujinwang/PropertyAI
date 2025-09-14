import React, { useState } from 'react';
import { useQuery } from 'react-query';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';

const AnalyticsDashboard = () => {
  const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [propertyIds, setPropertyIds] = useState('');

  const { data, isLoading, error } = useQuery(
    ['analytics', dateFrom, dateTo, propertyIds],
    async () => {
      const params = new URLSearchParams({
        dateFrom: new Date(dateFrom).toISOString(),
        dateTo: new Date(dateTo).toISOString(),
        propertyIds: propertyIds
      });
      const response = await fetch(`/api/analytics/metrics?${params}`);
      if (!response.ok) throw new Error('Failed to fetch metrics');
      return response.json();
    },
    { enabled: !!dateFrom && !!dateTo }
  );

  if (error) return <Alert severity="error">Error loading analytics: {error.message}</Alert>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Analytics Dashboard</Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <TextField
            label="Date From"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label="Date To"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label="Property IDs (comma-separated)"
            value={propertyIds}
            onChange={(e) => setPropertyIds(e.target.value)}
            fullWidth
            placeholder="e.g., prop1,prop2"
          />
        </Grid>
      </Grid>

      {isLoading ? (
        <Box display="flex" justifyContent="center" sx={{ mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Occupancy Rate
                </Typography>
                <Typography variant="h4" component="div">
                  {data?.occupancyRate || 0}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Revenue
                </Typography>
                <Typography variant="h4" component="div">
                  ${data?.totalRevenue || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Average Rent
                </Typography>
                <Typography variant="h4" component="div">
                  ${data?.avgRent || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Tenants
                </Typography>
                <Typography variant="h4" component="div">
                  {data?.activeTenants || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default AnalyticsDashboard;