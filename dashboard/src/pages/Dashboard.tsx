import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Home as HomeIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  Notifications as NotificationsIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';

interface DashboardStats {
  totalRentals: number;
  availableRentals: number;
  occupancyRate: number;
  totalApplications: number;
  pendingApplications: number;
  monthlyRevenue: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalRentals: 0,
    availableRentals: 0,
    occupancyRate: 0,
    totalApplications: 0,
    pendingApplications: 0,
    monthlyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading dashboard data
    const loadDashboardData = async () => {
      try {
        // In a real app, this would fetch from your API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setStats({
          totalRentals: 45,
          availableRentals: 8,
          occupancyRate: 82.2,
          totalApplications: 127,
          pendingApplications: 12,
          monthlyRevenue: 125000,
        });
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Loading Dashboard...
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            component={Link}
            to="/rentals/new"
          >
            Add Rental
          </Button>
          <Button
            variant="outlined"
            startIcon={<VisibilityIcon />}
            component={Link}
            to="/rentals"
          >
            View All Rentals
          </Button>
        </Box>
      </Box>

      {/* Welcome Message */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body1">
          Welcome to PropertyAI Dashboard! You now have access to the new unified Rental Management system. 
          <Button component={Link} to="/rentals" sx={{ ml: 1 }}>
            Explore Rentals
          </Button>
        </Typography>
      </Alert>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Rentals
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalRentals}
                  </Typography>
                </Box>
                <HomeIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Available Units
                  </Typography>
                  <Typography variant="h4">
                    {stats.availableRentals}
                  </Typography>
                  <Chip 
                    label={`${((stats.availableRentals / stats.totalRentals) * 100).toFixed(1)}% available`}
                    size="small"
                    color="success"
                  />
                </Box>
                <TrendingUpIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Occupancy Rate
                  </Typography>
                  <Typography variant="h4">
                    {stats.occupancyRate}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={stats.occupancyRate} 
                    sx={{ mt: 1 }}
                  />
                </Box>
                <AssessmentIcon color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Monthly Revenue
                  </Typography>
                  <Typography variant="h4">
                    {formatCurrency(stats.monthlyRevenue)}
                  </Typography>
                </Box>
                <TrendingUpIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<AddIcon />}
                    component={Link}
                    to="/rentals/new"
                  >
                    Add New Rental
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<PeopleIcon />}
                    component={Link}
                    to="/tenant-screening"
                  >
                    Screen Tenant
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<AssessmentIcon />}
                    component={Link}
                    to="/ai-insights"
                  >
                    View AI Insights
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<NotificationsIcon />}
                    component={Link}
                    to="/maintenance"
                  >
                    Maintenance
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  • New rental application received for Unit 4B
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  • Maintenance request completed for Unit 2A
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  • Rent payment received from Tenant John Doe
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  • New rental listing published: Downtown Apartment
                </Typography>
              </Box>
            </CardContent>
            <CardActions>
              <Button size="small" component={Link} to="/notifications">
                View All Activity
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;