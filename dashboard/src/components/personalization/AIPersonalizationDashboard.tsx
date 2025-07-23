/**
 * AI Personalization Dashboard Component
 * Main dashboard for displaying personalized recommendations with category layout
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
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
import { Alert } from '@mui/material';
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

  // Handle explanation request
  const handleExplanationRequest = useCallback(async (itemId: string) => {
    try {
      // For demo purposes, use mock explanation. In production, use real API
      const item = state.categories
        .flatMap(cat => cat.items)
        .find(item => item.id === itemId);
      
      if (!item) {
        throw new Error('Item not found');
      }

      const mockExplanation = {
        itemId,
        reasons: [
          {
            factor: 'Location Preference',
            description: `This recommendation is based on your location in ${state.userPreferences.location.city}, ${state.userPreferences.location.state}`,
            weight: 0.4,
            dataSource: 'location' as const,
          },
          {
            factor: 'Interest Match',
            description: `This matches your interests in ${state.userPreferences.interests.join(', ')}`,
            weight: 0.3,
            dataSource: 'preferences' as const,
          },
          {
            factor: 'Community Popularity',
            description: 'This is popular among residents with similar profiles in your area',
            weight: 0.3,
            dataSource: 'behavior' as const,
          },
        ],
        confidence: item.confidence,
        dataPoints: [
          'Your location preferences',
          'Similar user behavior patterns',
          'Local service ratings and reviews',
          'Your interaction history',
        ],
        privacyNote: 'We use anonymized data to protect your privacy while providing personalized recommendations.',
      };
      
      setState(prev => ({
        ...prev,
        explanations: {
          ...prev.explanations,
          [itemId]: mockExplanation,
        },
      }));

      setExplanationDialog({
        open: true,
        itemId,
        explanation: mockExplanation.reasons.map(r => r.description).join('. '),
      });
    } catch (error) {
      console.error('Error fetching explanation:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load explanation',
        severity: 'error',
      });
    }
  }, [state.categories, state.userPreferences]);

  // Handle feedback submission
  const handleFeedback = useCallback(async (
    itemId: string, 
    feedback: 'positive' | 'negative', 
    comment?: string
  ) => {
    try {
      const feedbackData: RecommendationFeedback = {
        itemId,
        userId,
        feedback,
        comment,
        timestamp: new Date(),
        context: {
          category: state.categories.find(cat => 
            cat.items.some(item => item.id === itemId)
          )?.type || 'local-services',
          position: 0, // Could be calculated based on item position
        },
      };

      // For demo purposes, just log the feedback. In production, use real API
      console.log('Feedback submitted:', feedbackData);
      
      setSnackbar({
        open: true,
        message: 'Thank you for your feedback!',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setSnackbar({
        open: true,
        message: 'Failed to submit feedback',
        severity: 'error',
      });
    }
  }, [userId, state.categories]);

  // Handle CTA click
  const handleCtaClick = useCallback((itemId: string, url: string) => {
    // Track click analytics
    console.log('CTA clicked:', { itemId, url });
    
    // Open URL in new tab
    window.open(url, '_blank', 'noopener,noreferrer');
    
    setSnackbar({
      open: true,
      message: 'Opening recommendation...',
      severity: 'info',
    });
  }, []);

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
              onExplanationRequest={handleExplanationRequest}
              onFeedback={handleFeedback}
              onCtaClick={handleCtaClick}
              maxItems={6}
              showViewAll={true}
            />
          ))
        )}
      </Box>

      {/* Explanation Dialog */}
      <Dialog
        open={explanationDialog.open}
        onClose={() => setExplanationDialog({ open: false, itemId: null, explanation: '' })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Info sx={{ mr: 1, color: 'primary.main' }} />
            Why am I seeing this recommendation?
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {explanationDialog.explanation}
          </Typography>
          
          {explanationDialog.itemId && state.explanations[explanationDialog.itemId] && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Personalization Factors:
              </Typography>
              
              {state.explanations[explanationDialog.itemId].reasons.map((reason, index) => (
                <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {reason.factor} ({Math.round(reason.weight * 100)}% influence)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {reason.description}
                  </Typography>
                  <Chip
                    label={reason.dataSource}
                    size="small"
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                </Box>
              ))}
              
              <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                <Typography variant="body2" color="info.contrastText">
                  <strong>Privacy Note:</strong> {state.explanations[explanationDialog.itemId].privacyNote}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExplanationDialog({ open: false, itemId: null, explanation: '' })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AIPersonalizationDashboard;