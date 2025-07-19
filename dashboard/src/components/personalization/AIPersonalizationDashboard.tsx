/**
 * AI Personalization Dashboard Component
 * Main dashboard for displaying personalized recommendations with category layout
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Alert,
  Snackbar,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Paper,
  Chip,
} from '@mui/material';
import {
  Refresh,
  Settings,
  Info,
} from '@mui/icons-material';
import { PersonalizationDashboardProps, PersonalizationState, RecommendationFeedback } from '../../types/personalization';
import RecommendationCategorySection from './RecommendationCategorySection';
import { personalizationService } from '../../services/personalizationService';
import LoadingStateIndicator from '../../design-system/components/ai/LoadingStateIndicator';

const AIPersonalizationDashboard: React.FC<PersonalizationDashboardProps> = ({
  userId,
  onPreferencesUpdate,
  onRefresh,
  className,
}) => {
  const [state, setState] = useState<PersonalizationState>({
    categories: [],
    userPreferences: {
      interests: [],
      location: { city: '', state: '', zipCode: '' },
      demographics: {},
      communicationPreferences: { frequency: 'weekly', channels: [] },
      privacySettings: {
        allowLocationTracking: false,
        allowBehaviorTracking: false,
        allowThirdPartyData: false,
      },
    },
    explanations: {},
    loading: true,
    error: null,
    lastRefresh: null,
  });

  const [explanationDialog, setExplanationDialog] = useState<{
    open: boolean;
    itemId: string | null;
    explanation: string;
  }>({
    open: false,
    itemId: null,
    explanation: '',
  });

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // Load recommendations data
  const loadRecommendations = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // For demo purposes, use mock data. In production, use real API
      const data = personalizationService.getMockRecommendations();
      
      setState(prev => ({
        ...prev,
        categories: data.categories,
        userPreferences: data.userPreferences,
        loading: false,
        lastRefresh: new Date(),
      }));
    } catch (error) {
      console.error('Error loading recommendations:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load recommendations',
      }));
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  if (state.loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <LoadingStateIndicator
          message="Loading your personalized recommendations..."
          variant="skeleton"
          estimatedTime={3}
        />
      </Container>
    );
  }

  if (state.error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={loadRecommendations}>
              Retry
            </Button>
          }
        >
          {state.error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" className={className} sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Your Personalized Recommendations
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Discover local services, community events, and exclusive offers tailored just for you.
        </Typography>
        
        {/* Summary Stats */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
                  {state.categories.reduce((total, cat) => total + cat.totalItems, 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Recommendations
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="success.main" sx={{ fontWeight: 'bold' }}>
                  {state.categories.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Categories
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  {state.lastRefresh?.toLocaleTimeString() || 'Never'}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                <Chip
                  label="AI Powered"
                  color="primary"
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label="Personalized"
                  color="secondary"
                  size="small"
                  variant="outlined"
                />
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* Recommendation Categories */}
      <Box sx={{ mb: 4 }}>
        {state.categories.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No recommendations available
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              We're working on generating personalized recommendations for you.
            </Typography>
            <Button variant="contained" onClick={loadRecommendations} startIcon={<Refresh />}>
              Check Again
            </Button>
          </Paper>
        ) : (
          state.categories.map((category) => (
            <RecommendationCategorySection
              key={category.id}
              category={category}
              onExplanationRequest={() => {}}
              onFeedback={() => {}}
              onCtaClick={() => {}}
              maxItems={6}
              showViewAll={true}
            />
          ))
        )}
      </Box>
    </Container>
  );
};

export default AIPersonalizationDashboard;