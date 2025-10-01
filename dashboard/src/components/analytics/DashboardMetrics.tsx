import React, { useEffect, useState } from 'react';
import { Grid, Box, Alert } from '@mui/material';
import MetricsWidget from './MetricsWidget';
import HomeIcon from '@mui/icons-material/Home';
import PeopleIcon from '@mui/icons-material/People';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import BuildIcon from '@mui/icons-material/Build';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssessmentIcon from '@mui/icons-material/Assessment';

interface Metrics {
  properties: {
    total: number;
    active: number;
    trend: 'up' | 'down' | 'flat';
    trendValue: string;
  };
  occupancy: {
    rate: number;
    trend: 'up' | 'down' | 'flat';
    trendValue: string;
  };
  revenue: {
    total: number;
    monthly: number;
    trend: 'up' | 'down' | 'flat';
    trendValue: string;
  };
  maintenance: {
    pending: number;
    inProgress: number;
    trend: 'up' | 'down' | 'flat';
    trendValue: string;
  };
  tenants: {
    total: number;
    new: number;
    trend: 'up' | 'down' | 'flat';
    trendValue: string;
  };
  performance: {
    roi: number;
    trend: 'up' | 'down' | 'flat';
    trendValue: string;
  };
}

export function DashboardMetrics() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      // In production, this would fetch from your API
      // const response = await fetch('/api/metrics/dashboard');
      // const data = await response.json();

      // Mock data for demonstration
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const mockData: Metrics = {
        properties: {
          total: 127,
          active: 115,
          trend: 'up',
          trendValue: '+8.2%',
        },
        occupancy: {
          rate: 92.5,
          trend: 'up',
          trendValue: '+2.1%',
        },
        revenue: {
          total: 2847500,
          monthly: 237000,
          trend: 'up',
          trendValue: '+12.5%',
        },
        maintenance: {
          pending: 23,
          inProgress: 12,
          trend: 'down',
          trendValue: '-15%',
        },
        tenants: {
          total: 342,
          new: 28,
          trend: 'up',
          trendValue: '+5.3%',
        },
        performance: {
          roi: 18.5,
          trend: 'up',
          trendValue: '+3.2%',
        },
      };

      setMetrics(mockData);
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError('Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (error) {
    return (
      <Box sx={{ mb: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {/* Properties */}
      <Grid item xs={12} sm={6} md={4}>
        <MetricsWidget
          title="Total Properties"
          value={metrics?.properties.total || 0}
          subtitle={`${metrics?.properties.active || 0} active`}
          trend={metrics?.properties.trend}
          trendValue={metrics?.properties.trendValue}
          color="primary"
          icon={<HomeIcon fontSize="large" />}
          loading={loading}
        />
      </Grid>

      {/* Occupancy Rate */}
      <Grid item xs={12} sm={6} md={4}>
        <MetricsWidget
          title="Occupancy Rate"
          value={metrics?.occupancy.rate || 0}
          suffix="%"
          trend={metrics?.occupancy.trend}
          trendValue={metrics?.occupancy.trendValue}
          color="success"
          icon={<TrendingUpIcon fontSize="large" />}
          loading={loading}
        />
      </Grid>

      {/* Revenue */}
      <Grid item xs={12} sm={6} md={4}>
        <MetricsWidget
          title="Monthly Revenue"
          value={metrics ? formatCurrency(metrics.revenue.monthly) : '$0'}
          subtitle={`Total: ${metrics ? formatCurrency(metrics.revenue.total) : '$0'}`}
          trend={metrics?.revenue.trend}
          trendValue={metrics?.revenue.trendValue}
          color="success"
          icon={<AttachMoneyIcon fontSize="large" />}
          loading={loading}
        />
      </Grid>

      {/* Maintenance */}
      <Grid item xs={12} sm={6} md={4}>
        <MetricsWidget
          title="Pending Maintenance"
          value={metrics?.maintenance.pending || 0}
          subtitle={`${metrics?.maintenance.inProgress || 0} in progress`}
          trend={metrics?.maintenance.trend}
          trendValue={metrics?.maintenance.trendValue}
          color="warning"
          icon={<BuildIcon fontSize="large" />}
          loading={loading}
        />
      </Grid>

      {/* Tenants */}
      <Grid item xs={12} sm={6} md={4}>
        <MetricsWidget
          title="Total Tenants"
          value={metrics?.tenants.total || 0}
          subtitle={`${metrics?.tenants.new || 0} new this month`}
          trend={metrics?.tenants.trend}
          trendValue={metrics?.tenants.trendValue}
          color="info"
          icon={<PeopleIcon fontSize="large" />}
          loading={loading}
        />
      </Grid>

      {/* ROI */}
      <Grid item xs={12} sm={6} md={4}>
        <MetricsWidget
          title="Average ROI"
          value={metrics?.performance.roi || 0}
          suffix="%"
          trend={metrics?.performance.trend}
          trendValue={metrics?.performance.trendValue}
          color="secondary"
          icon={<AssessmentIcon fontSize="large" />}
          loading={loading}
        />
      </Grid>
    </Grid>
  );
}

export default DashboardMetrics;
