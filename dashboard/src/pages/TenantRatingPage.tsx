import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Alert,
  Breadcrumbs,
  Link,
  Divider,
  Chip
} from '@mui/material';
import { Home, Star } from '@mui/icons-material';
import { TenantSearchResult } from '../types/enhancedTenantRating';
import { useTenantRatings } from '../hooks/useTenantRatings';
import { useAuth } from '../contexts/AuthContext';

// Import components
import TenantAutocomplete from '../components/tenant-ratings/TenantAutocomplete';
import RatingForm from '../components/tenant-ratings/RatingForm';
import RatingsList from '../components/tenant-ratings/RatingsList';
import CategoryAverages from '../components/tenant-ratings/CategoryAverages';
import RatingChart from '../components/tenant-ratings/RatingChart';
import TenantRatingErrorBoundary from '../components/tenant-ratings/TenantRatingErrorBoundary';

const TenantRatingPageContent: React.FC = () => {
  const [selectedTenant, setSelectedTenant] = useState<TenantSearchResult | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  // Get authentication state for debugging
  const { user, token, isAuthenticated } = useAuth();

  // Use the custom hook for tenant ratings
  const {
    ratings,
    analytics,
    loading,
    error,
    createRating,
    updateRating,
    deleteRating,
    refetch,
    clearError
  } = useTenantRatings(selectedTenant?.id || null);

  const handleTenantSelect = (tenant: TenantSearchResult | null) => {
    setSelectedTenant(tenant);
    clearError();
  };

  const handleRatingSubmit = async (ratingData: any) => {
    try {
      setSubmitLoading(true);
      await createRating(ratingData);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleRatingEdit = (rating: any) => {
    // TODO: Implement edit functionality with a modal or form
    console.log('Edit rating:', rating);
  };

  const handleRatingDelete = async (ratingId: string) => {
    try {
      await deleteRating(ratingId);
    } catch (error) {
      console.error('Failed to delete rating:', error);
    }
  };

  // Get localStorage values for debugging
  const authToken = localStorage.getItem('authToken');
  const storedUser = localStorage.getItem('user');

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Remove this entire Authentication Debug Info section */}
      {/* Authentication Debug Info */}
      {/* <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>Authentication Debug Info</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Chip 
            label={`Authenticated: ${isAuthenticated}`} 
            color={isAuthenticated ? 'success' : 'error'} 
            size="small" 
          />
          <Chip 
            label={`Has Token: ${!!token}`} 
            color={token ? 'success' : 'error'} 
            size="small" 
          />
          <Chip 
            label={`Has User: ${!!user}`} 
            color={user ? 'success' : 'error'} 
            size="small" 
          />
          <Chip 
            label={`LocalStorage Token: ${!!authToken}`} 
            color={authToken ? 'success' : 'error'} 
            size="small" 
          />
          <Chip 
            label={`LocalStorage User: ${!!storedUser}`} 
            color={storedUser ? 'success' : 'error'} 
            size="small" 
          />
        </Box>
        {user && (
          <Typography variant="body2">
            User: {user.name} ({user.email}) - Role: {user.role}
          </Typography>
        )}
        {authToken && (
          <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
            Token: {authToken.substring(0, 50)}...
          </Typography>
        )}
      </Alert> */}

      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center' }}
          color="inherit"
          href="/"
        >
          <Home sx={{ mr: 0.5 }} fontSize="inherit" />
          Dashboard
        </Link>
        <Typography
          sx={{ display: 'flex', alignItems: 'center' }}
          color="text.primary"
        >
          <Star sx={{ mr: 0.5 }} fontSize="inherit" />
          Tenant Ratings
        </Typography>
      </Breadcrumbs>

      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
          Tenant Ratings Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Evaluate tenant performance across multiple categories and track ratings over time.
        </Typography>
      </Box>

      {/* Global Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      {/* Show authentication warning if not authenticated */}
      {!isAuthenticated && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>Authentication Required</Typography>
          <Typography>
            You need to be logged in to create tenant ratings. Please{' '}
            <Link href="/login" color="primary">log in</Link> to continue.
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column - Tenant Selection and Rating Form */}
        <Grid item xs={12} lg={6}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Tenant Selection */}
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                Select Tenant
              </Typography>
              <TenantAutocomplete
                onTenantSelect={handleTenantSelect}
                selectedTenant={selectedTenant}
              />
            </Paper>

            {/* Rating Form */}
            <RatingForm
              selectedTenant={selectedTenant}
              onSubmit={handleRatingSubmit}
              loading={submitLoading}
            />
          </Box>
        </Grid>

        {/* Right Column - Analytics and Charts */}
        <Grid item xs={12} lg={6}>
          {selectedTenant ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Category Averages */}
              {analytics && (
                <CategoryAverages
                  analytics={analytics}
                  loading={loading}
                />
              )}

              {/* Rating Chart */}
              {analytics && (
                <RatingChart
                  analytics={analytics}
                  loading={loading}
                  height={300}
                />
              )}
            </Box>
          ) : (
            <Paper elevation={1} sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
              <Star sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Select a Tenant
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Choose a tenant from the search above to view their ratings and analytics.
              </Typography>
            </Paper>
          )}
        </Grid>

        {/* Full Width - Ratings List */}
        {selectedTenant && (
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <RatingsList
              ratings={ratings}
              loading={loading}
              error={error}
              onEdit={handleRatingEdit}
              onDelete={handleRatingDelete}
              showActions={true}
            />
          </Grid>
        )}
      </Grid>

      {/* Help Text */}
      <Box sx={{ mt: 4, p: 3, bgcolor: 'primary.50', borderRadius: 2, border: '1px solid', borderColor: 'primary.200' }}>
        <Typography variant="h6" color="primary.main" gutterBottom>
          How to Use Tenant Ratings
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
              1. Select a Tenant
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Use the search field to find and select a tenant by name, email, or property address.
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
              2. Rate Performance
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Rate the tenant across four categories: cleanliness, communication, payment history, and property care.
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
              3. Track Progress
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View analytics, trends, and historical ratings to track tenant performance over time.
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

const TenantRatingPage: React.FC = () => {
  return (
    <TenantRatingErrorBoundary>
      <TenantRatingPageContent />
    </TenantRatingErrorBoundary>
  );
};

export default TenantRatingPage;
