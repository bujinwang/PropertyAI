/**
 * Recommendation Category Section Component
 * Displays a category of recommendations with header and grid layout
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  Card,
  CardContent,
  Icon,
  Chip,

} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Refresh,
} from '@mui/icons-material';
import { RecommendationCategorySectionProps } from '../../types/personalization';
import { RecommendationCard } from './RecommendationCard';
import LoadingStateIndicator from '../../design-system/components/ai/LoadingStateIndicator';

export const RecommendationCategorySection: React.FC<RecommendationCategorySectionProps> = ({
  category,
  onExplanationRequest,
  onFeedback,
  onCtaClick,
  maxItems = 6,
  showViewAll = true,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const displayItems = expanded ? category.items : category.items.slice(0, maxItems);
  const hasMoreItems = category.items.length > maxItems;

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const handleRefresh = async () => {
    setLoading(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
  };

  const getCategoryIcon = (iconName: string) => {
    // Map icon names to Material-UI icons
    const iconMap: Record<string, string> = {
      'business': 'business',
      'event': 'event',
      'local_offer': 'local_offer',
    };
    return iconMap[iconName] || 'category';
  };

  return (
    <Card 
      sx={{ 
        mb: 3,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <CardContent>
        {/* Category Header */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Icon 
              sx={{ 
                mr: 1, 
                color: 'primary.main',
                fontSize: '1.5rem',
              }}
            >
              {getCategoryIcon(category.icon)}
            </Icon>
            <Box>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
                {category.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {category.description}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={`${category.totalItems} items`}
              size="small"
              variant="outlined"
              color="primary"
            />
            <Button
              size="small"
              startIcon={<Refresh />}
              onClick={handleRefresh}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Loading State */}
        {loading && (
          <Box sx={{ mb: 2 }}>
            <LoadingStateIndicator
              message="Refreshing recommendations..."
              variant="progress"
            />
          </Box>
        )}

        {/* Recommendations Grid */}
        {!loading && (
          <>
            <Grid container spacing={2}>
              {displayItems.map((item) => (
                <Grid item xs={12} sm={6} md={4} key={item.id}>
                  <RecommendationCard
                    item={item}
                    onExplanationRequest={onExplanationRequest}
                    onFeedback={onFeedback}
                    onCtaClick={onCtaClick}
                    showPersonalizationLabel={true}
                    compact={false}
                  />
                </Grid>
              ))}
            </Grid>

            {/* Empty State */}
            {displayItems.length === 0 && (
              <Box 
                sx={{ 
                  textAlign: 'center', 
                  py: 4,
                  color: 'text.secondary',
                }}
              >
                <Typography variant="body1">
                  No recommendations available in this category.
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Check back later for new personalized suggestions.
                </Typography>
              </Box>
            )}

            {/* View All / Collapse Button */}
            {hasMoreItems && showViewAll && (
              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={handleExpandClick}
                  endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
                >
                  {expanded 
                    ? 'Show Less' 
                    : `View All ${category.totalItems} Recommendations`
                  }
                </Button>
              </Box>
            )}
          </>
        )}

        {/* Last Updated Info */}
        <Box sx={{ mt: 2, textAlign: 'right' }}>
          <Typography variant="caption" color="text.secondary">
            Last updated: {category.lastUpdated.toLocaleString()}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default RecommendationCategorySection;