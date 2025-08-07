import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Paper,
  Grid,
  Chip,
  Tooltip
} from '@mui/material';
import { TrendingUp, TrendingDown, Remove } from '@mui/icons-material';
import { RatingAnalytics, RATING_CATEGORIES } from '../../types/enhancedTenantRating';

interface CategoryAveragesProps {
  analytics: RatingAnalytics;
  loading?: boolean;
  showTrends?: boolean;
}

const CategoryAverages: React.FC<CategoryAveragesProps> = ({
  analytics,
  loading = false,
  showTrends = true
}) => {
  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'success';
    if (rating >= 3) return 'warning';
    if (rating >= 2) return 'error';
    return 'error';
  };

  const getRatingColorHex = (rating: number) => {
    if (rating >= 4) return '#4caf50';
    if (rating >= 3) return '#ff9800';
    if (rating >= 2) return '#f44336';
    return '#d32f2f';
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 4) return 'Very Good';
    if (rating >= 3) return 'Good';
    if (rating >= 2) return 'Fair';
    if (rating >= 1) return 'Poor';
    return 'No Rating';
  };

  const calculateTrend = (categoryKey: string) => {
    // This would typically compare with previous period data
    // For now, we'll simulate based on current rating vs overall average
    const categoryRating = analytics.averageRatings[categoryKey as keyof typeof analytics.averageRatings];
    const overallRating = analytics.averageRatings.overall;
    
    if (categoryRating > overallRating + 0.2) return 'up';
    if (categoryRating < overallRating - 0.2) return 'down';
    return 'stable';
  };

  if (loading) {
    return (
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Category Averages
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {Array.from({ length: 5 }).map((_, index) => (
            <Box key={index}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ width: '30%', height: 16, bgcolor: 'grey.200', borderRadius: 1 }} />
                <Box sx={{ width: '20%', height: 16, bgcolor: 'grey.200', borderRadius: 1 }} />
              </Box>
              <LinearProgress sx={{ height: 8, borderRadius: 4 }} />
            </Box>
          ))}
        </Box>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        Category Averages
      </Typography>

      {/* Overall Rating */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1 }}>
          {analytics.averageRatings.overall.toFixed(1)}
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Overall Rating
        </Typography>
        <Chip
          label={getRatingLabel(analytics.averageRatings.overall)}
          color={getRatingColor(analytics.averageRatings.overall) as any}
          variant="filled"
          sx={{ fontWeight: 'bold' }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Based on {analytics.totalRatings} rating{analytics.totalRatings !== 1 ? 's' : ''}
        </Typography>
      </Box>

      {/* Category Breakdown */}
      <Grid container spacing={3}>
        {Object.entries(RATING_CATEGORIES).map(([key, label]) => {
          const rating = analytics.averageRatings[key as keyof typeof analytics.averageRatings];
          const percentage = (rating / 5) * 100;
          const trend = showTrends ? calculateTrend(key) : null;

          return (
            <Grid item xs={12} sm={6} key={key}>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {label}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {rating.toFixed(1)}
                    </Typography>
                    
                    {showTrends && trend && (
                      <Tooltip title={`${trend === 'up' ? 'Above' : trend === 'down' ? 'Below' : 'At'} average`}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {trend === 'up' && <TrendingUp color="success" fontSize="small" />}
                          {trend === 'down' && <TrendingDown color="error" fontSize="small" />}
                          {trend === 'stable' && <Remove color="disabled" fontSize="small" />}
                        </Box>
                      </Tooltip>
                    )}
                  </Box>
                </Box>
                
                <LinearProgress
                  variant="determinate"
                  value={percentage}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: getRatingColorHex(rating),
                      borderRadius: 4,
                    }
                  }}
                />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    {getRatingLabel(rating)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {percentage.toFixed(0)}%
                  </Typography>
                </Box>
              </Box>
            </Grid>
          );
        })}
      </Grid>

      {/* Rating Distribution Summary */}
      <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
          Rating Distribution
        </Typography>
        
        <Grid container spacing={1}>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = analytics.ratingDistribution[star] || 0;
            const percentage = analytics.totalRatings > 0 ? (count / analytics.totalRatings) * 100 : 0;
            
            return (
              <Grid item xs key={star}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    {star}★
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={percentage}
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      bgcolor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: getRatingColorHex(star),
                        borderRadius: 2,
                      }
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {count}
                  </Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Paper>
  );
};

export default CategoryAverages;