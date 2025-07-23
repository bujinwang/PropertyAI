/**
 * Market Summary Card Component
 * Displays AI-generated market summaries with insights and recommendations
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Button,
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Lightbulb,
  Warning,
  Star,
  ExpandMore,
  ThumbUp,
  ThumbDown,
} from '@mui/icons-material';
import AIGeneratedContent from '../../design-system/components/ai/AIGeneratedContent';
import ConfidenceIndicator from '../../design-system/components/ai/ConfidenceIndicator';
import ExplanationTooltip from '../../design-system/components/ai/ExplanationTooltip';
import { AISummary, AIRecommendation } from '../../types/market-intelligence';
import { AIFeedback } from '../../types/ai';

interface MarketSummaryCardProps {
  summary: AISummary;
  onFeedback?: (feedback: AIFeedback) => void;
  loading?: boolean;
}

const MarketSummaryCard: React.FC<MarketSummaryCardProps> = ({
  summary,
  onFeedback,
  loading = false,
}) => {
  const [expandedRecommendation, setExpandedRecommendation] = useState<string | false>(false);

  const getMarketConditionColor = (condition: string) => {
    switch (condition) {
      case 'favorable':
        return 'success';
      case 'challenging':
        return 'error';
      default:
        return 'warning';
    }
  };

  const getMarketConditionIcon = (condition: string) => {
    switch (condition) {
      case 'favorable':
        return <TrendingUp />;
      case 'challenging':
        return <TrendingDown />;
      default:
        return <TrendingFlat />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      default:
        return 'info';
    }
  };

  const handleRecommendationExpand = (panel: string) => (
    event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpandedRecommendation(isExpanded ? panel : false);
  };

  const handleFeedback = (type: 'positive' | 'negative', comment?: string) => {
    if (onFeedback) {
      onFeedback({
        type,
        comment,
        timestamp: new Date(),
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader title="Market Intelligence Summary" />
        <CardContent>
          <Box display="flex" justifyContent="center" p={4}>
            <Typography color="textSecondary">Loading market summary...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <AIGeneratedContent
      confidence={summary.confidence}
      explanation={summary.explanation}
      onFeedback={handleFeedback}
      variant="outlined"
    >
      <Card elevation={2}>
        <CardHeader
          title={
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="h6" component="h2">
                {summary.title}
              </Typography>
              <Chip
                icon={getMarketConditionIcon(summary.marketCondition)}
                label={summary.marketCondition.charAt(0).toUpperCase() + summary.marketCondition.slice(1)}
                color={getMarketConditionColor(summary.marketCondition) as any}
                size="small"
              />
            </Box>
          }
          subheader={
            <Box display="flex" alignItems="center" gap={2} mt={1}>
              <ConfidenceIndicator
                confidence={summary.confidence}
                showTooltip
                explanation="Confidence based on data quality, market stability, and prediction accuracy"
                variant="linear"
                size="small"
                colorCoded
                showNumericalScore
              />
              <Typography variant="caption" color="textSecondary">
                Updated {summary.timestamp.toLocaleString()}
              </Typography>
            </Box>
          }
        />

        <CardContent>
          {/* Main Summary */}
          <Typography variant="body1" paragraph>
            {summary.content}
          </Typography>

          {/* Key Insights */}
          <Box mb={3}>
            <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
              <Lightbulb color="primary" />
              Key Insights
            </Typography>
            <List dense>
              {summary.keyInsights.map((insight, index) => (
                <ListItem key={index} disableGutters>
                  <ListItemIcon>
                    <Box
                      width={8}
                      height={8}
                      borderRadius="50%"
                      bgcolor="primary.main"
                    />
                  </ListItemIcon>
                  <ListItemText primary={insight} />
                </ListItem>
              ))}
            </List>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* AI Recommendations */}
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              AI Recommendations
            </Typography>
            {summary.recommendations.map((recommendation) => (
              <Accordion
                key={recommendation.id}
                expanded={expandedRecommendation === recommendation.id}
                onChange={handleRecommendationExpand(recommendation.id)}
                sx={{ mb: 1 }}
              >
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box display="flex" alignItems="center" gap={2} width="100%">
                    <Chip
                      label={recommendation.priority}
                      color={getPriorityColor(recommendation.priority) as any}
                      size="small"
                    />
                    <Typography variant="subtitle2" flex={1}>
                      {recommendation.title}
                    </Typography>
                    <ConfidenceIndicator
                      confidence={recommendation.confidence.value}
                      variant="circular"
                      size="small"
                      colorCoded
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box>
                    <Typography variant="body2" paragraph>
                      {recommendation.description}
                    </Typography>
                    <Box display="flex" gap={2} mb={2}>
                      <Chip
                        label={`Category: ${recommendation.category}`}
                        variant="outlined"
                        size="small"
                      />
                      <Chip
                        label={`Timeline: ${recommendation.timeline}`}
                        variant="outlined"
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Expected Outcome:</strong> {recommendation.expectedOutcome}
                    </Typography>
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Risk Factors and Opportunities */}
          <Box display="flex" gap={3}>
            {/* Risk Factors */}
            <Box flex={1}>
              <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                <Warning color="warning" />
                Risk Factors
              </Typography>
              <List dense>
                {summary.riskFactors.map((risk, index) => (
                  <ListItem key={index} disableGutters>
                    <ListItemIcon>
                      <Warning color="warning" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={risk}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>

            {/* Opportunities */}
            <Box flex={1}>
              <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                <Star color="success" />
                Opportunities
              </Typography>
              <List dense>
                {summary.opportunities.map((opportunity, index) => (
                  <ListItem key={index} disableGutters>
                    <ListItemIcon>
                      <Star color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={opportunity}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Box>

          {/* Explanation Tooltip */}
          <Box mt={2}>
            <ExplanationTooltip
              title="How is this summary generated?"
              content={summary.explanation || 'AI analysis combines market data, competitor intelligence, and predictive modeling to generate insights and recommendations.'}
              placement="top"
            >
              <Button variant="text" size="small" color="primary">
                Learn about our analysis methodology
              </Button>
            </ExplanationTooltip>
          </Box>
        </CardContent>
      </Card>
    </AIGeneratedContent>
  );
};

export default MarketSummaryCard;