import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Box,
} from '@mui/material';
import {
  MarketSummaryCard,
  CompetitorActivityAnalysis,
  MarketOpportunityAlerts,
  MarketTrendsCharts,
  DemandForecastCharts,
  CompetitorAnalysisMap,
} from '../components/market-intelligence';
import { marketIntelligenceService } from '../services/marketIntelligenceService';
import type {
  AISummary,
  CompetitorData,
  MarketOpportunity,
  MarketTrend,
  DemandForecast,
} from '../types/market-intelligence';
import type { AIFeedback } from '../types/ai';

const MarketIntelligenceScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marketSummary, setMarketSummary] = useState<AISummary | null>(null);
  const [competitors, setCompetitors] = useState<CompetitorData[]>([]);
  const [opportunities, setOpportunities] = useState<MarketOpportunity[]>([]);
  const [marketTrends, setMarketTrends] = useState<MarketTrend[]>([]);
  const [demandForecasts, setDemandForecasts] = useState<DemandForecast[]>([]);

  useEffect(() => {
    loadMarketData();
  }, []);

  const loadMarketData = async () => {
    try {
      setLoading(true);
      setError(null);
  
      // Use sequential loading with delays to prevent rate limiting
      const requests = [
        () => marketIntelligenceService.fetchMarketSummary(),
        () => marketIntelligenceService.fetchCompetitorActivity(),
        () => marketIntelligenceService.fetchMarketOpportunities(),
        () => marketIntelligenceService.fetchMarketTrends(),
        () => marketIntelligenceService.fetchDemandForecasts(),
      ];

      const results = await apiService.batchRequests(requests);
      
      // Handle results with proper error checking
      const [summaryResult, competitorResult, opportunityResult, trendsResult, forecastsResult] = results;
      
      setMarketSummary(summaryResult.data || null);
      setCompetitors(competitorResult.data || []);
      setOpportunities(opportunityResult.data || []);
      setMarketTrends(trendsResult.data || []);
      setDemandForecasts(forecastsResult.data || []);
  
      // Check for errors and show warnings
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        console.warn(`${errors.length} API requests failed:`, errors);
        setError(`Some data could not be loaded. ${errors.length} of 5 requests failed.`);
      }
    } catch (err) {
      console.error('Error loading market data:', err);
      setError('Failed to load market intelligence data. Please try again.');
  
      // Set fallback empty data
      setMarketSummary(null);
      setCompetitors([]);
      setOpportunities([]);
      setMarketTrends([]);
      setDemandForecasts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSummaryFeedback = async (feedback: AIFeedback) => {
    if (marketSummary) {
      try {
        await marketIntelligenceService.submitMarketFeedback(
          marketSummary.id,
          { type: feedback.type, comment: feedback.comment }
        );
      } catch (error) {
        console.error('Error submitting feedback:', error);
      }
    }
  };

  const handleCompetitorFeedback = async (feedback: AIFeedback) => {
    try {
      await marketIntelligenceService.submitMarketFeedback(
        'competitor-analysis',
        { type: feedback.type, comment: feedback.comment }
      );
    } catch (error) {
      console.error('Error submitting competitor feedback:', error);
    }
  };

  const handleOpportunityFeedback = async (feedback: AIFeedback) => {
    try {
      await marketIntelligenceService.submitMarketFeedback(
        'market-opportunities',
        { type: feedback.type, comment: feedback.comment }
      );
    } catch (error) {
      console.error('Error submitting opportunity feedback:', error);
    }
  };

  const handleOpportunityAction = (opportunity: MarketOpportunity, action: string) => {
    console.log(`Action "${action}" triggered for opportunity:`, opportunity.title);
    // Implement specific actions like save, share, implement
    switch (action) {
      case 'implement':
        // Start implementation workflow
        break;
      case 'save':
        // Save to user's saved opportunities
        break;
      case 'share':
        // Share with team members
        break;
      default:
        break;
    }
  };

  const handleCompetitorSelect = (competitor: CompetitorData) => {
    console.log('Selected competitor:', competitor.name);
    // Could trigger detailed analysis or comparison view
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Box textAlign="center">
            <CircularProgress size={48} sx={{ mb: 2 }} />
            <Typography variant="h6" color="textSecondary">
              Loading Market Intelligence...
            </Typography>
          </Box>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Market Intelligence
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        AI-powered market analysis with competitor insights and opportunity identification
      </Typography>

      <Grid container spacing={4}>
        {/* AI-Generated Market Summary */}
        <Grid size={12}>
          {marketSummary && (
            <MarketSummaryCard
              summary={marketSummary}
              onFeedback={handleSummaryFeedback}
              loading={loading}
            />
          )}
        </Grid>

        {/* Market Trends Charts */}
        <Grid size={12}>
          <MarketTrendsCharts
            trends={marketTrends}
            loading={loading}
          />
        </Grid>

        {/* Competitor Analysis Map and Activity */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <CompetitorAnalysisMap
            competitors={competitors}
            onCompetitorSelect={handleCompetitorSelect}
            loading={loading}
          />
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <CompetitorActivityAnalysis
            competitors={competitors}
            onCompetitorSelect={handleCompetitorSelect}
            onFeedback={handleCompetitorFeedback}
            loading={loading}
          />
        </Grid>

        {/* Demand Forecast Charts */}
        <Grid size={12}>
          <DemandForecastCharts
            forecasts={demandForecasts}
            loading={loading}
          />
        </Grid>

        {/* Market Opportunity Alerts */}
        <Grid size={12}>
          <MarketOpportunityAlerts
            opportunities={opportunities}
            onOpportunityAction={handleOpportunityAction}
            onFeedback={handleOpportunityFeedback}
            loading={loading}
          />
        </Grid>
      </Grid>
    </Container>
  );
};

export default MarketIntelligenceScreen;
