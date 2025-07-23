/**
 * Simple test component to verify Market Intelligence components work
 */

import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import {
  MarketTrendsCharts,
  CompetitorAnalysisMap,
  DemandForecastCharts,
} from './index';

const MarketIntelligenceTest: React.FC = () => {
  // Mock data for testing
  const mockTrends = [
    {
      id: 'trend-1',
      metric: 'Average Rent',
      currentValue: 2850,
      previousValue: 2750,
      change: 100,
      changePercent: 3.6,
      trend: 'up' as const,
      timeframe: 'Last 3 months',
      unit: '$',
      category: 'rent' as const
    }
  ];

  const mockCompetitors = [
    {
      id: 'comp-1',
      name: 'Test Property',
      location: [40.7128, -74.0060] as [number, number],
      address: '123 Test St',
      rentRange: [2000, 3000] as [number, number],
      occupancyRate: 90,
      amenities: ['Gym', 'Pool'],
      propertyType: 'Apartment',
      units: 100,
      marketShare: 10,
      recentActivity: []
    }
  ];

  const mockForecasts = [
    {
      id: 'forecast-1',
      period: 'Q1 2024',
      predictedDemand: 82,
      confidence: { value: 85, level: 'high' as const, explanation: 'Test confidence' },
      factors: [
        {
          name: 'Test Factor',
          impact: 5.2,
          description: 'Test description',
          weight: 0.25
        }
      ],
      seasonalAdjustment: 1.08,
      trendDirection: 'increasing' as const
    }
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Market Intelligence Components Test
      </Typography>
      
      <Box mb={4}>
        <Typography variant="h5" gutterBottom>
          Market Trends Charts
        </Typography>
        <MarketTrendsCharts trends={mockTrends} loading={false} />
      </Box>

      <Box mb={4}>
        <Typography variant="h5" gutterBottom>
          Competitor Analysis Map
        </Typography>
        <CompetitorAnalysisMap competitors={mockCompetitors} loading={false} />
      </Box>

      <Box mb={4}>
        <Typography variant="h5" gutterBottom>
          Demand Forecast Charts
        </Typography>
        <DemandForecastCharts forecasts={mockForecasts} loading={false} />
      </Box>
    </Container>
  );
};

export default MarketIntelligenceTest;