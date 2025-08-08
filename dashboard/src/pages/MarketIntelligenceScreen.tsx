import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  MarketSummaryCard,
  CompetitorActivityAnalysis,
  MarketOpportunityAlerts,
  MarketTrendsCharts,
  CompetitorAnalysisMap,
  DemandForecastCharts,
} from '../components/market-intelligence';
import {
  AISummary,
  CompetitorData,
  MarketOpportunity,
  MarketTrend,
  DemandForecast,
} from '../types/market-intelligence';
import { AIFeedback } from '../types/ai';
import marketIntelligenceService from '../services/marketIntelligenceService';

const MarketIntelligenceScreen: React.FC = () => {
  const [marketSummary, setMarketSummary] = useState<AISummary | null>(null);
  const [competitors, setCompetitors] = useState<CompetitorData[]>([]);
  const [opportunities, setOpportunities] = useState<MarketOpportunity[]>([]);
  const [marketTrends, setMarketTrends] = useState<MarketTrend[]>([]);
  const [demandForecasts, setDemandForecasts] = useState<DemandForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMarketData();
  }, []);

  const loadMarketData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all market intelligence data
      const [summaryData, competitorData, opportunityData, trendsData, forecastsData] = await Promise.all([
        marketIntelligenceService.fetchMarketSummary(),
        marketIntelligenceService.fetchCompetitorActivity(),
        marketIntelligenceService.fetchMarketOpportunities(),
        marketIntelligenceService.fetchMarketTrends(),
        marketIntelligenceService.fetchDemandForecasts(),
      ]);

      setMarketSummary(summaryData);
      setCompetitors(competitorData);
      setOpportunities(opportunityData);
      setMarketTrends(trendsData);
      setDemandForecasts(forecastsData);
    } catch (err) {
      console.error('Error loading market data:', err);
      setError('Failed to load market intelligence data. Please try again.');
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
        <Grid xs={12}>
          {marketSummary && (
            <MarketSummaryCard
              summary={marketSummary}
              onFeedback={handleSummaryFeedback}
              loading={loading}
            />
          )}
        </Grid>

        {/* Market Trends Charts */}
        <Grid xs={12}>
          <MarketTrendsCharts
            trends={marketTrends}
            loading={loading}
          />
        </Grid>

        {/* Competitor Analysis Map and Activity */}
        <Grid xs={12} lg={6}>
          <CompetitorAnalysisMap
            competitors={competitors}
            onCompetitorSelect={handleCompetitorSelect}
            loading={loading}
          />
        </Grid>

        <Grid xs={12} lg={6}>
          <CompetitorActivityAnalysis
            competitors={competitors}
            onCompetitorSelect={handleCompetitorSelect}
            onFeedback={handleCompetitorFeedback}
            loading={loading}
          />
        </Grid>

        {/* Demand Forecast Charts */}
        <Grid xs={12}>
          <DemandForecastCharts
            forecasts={demandForecasts}
            loading={loading}
          />
        </Grid>

        {/* Market Opportunity Alerts */}
        <Grid xs={12}>
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
