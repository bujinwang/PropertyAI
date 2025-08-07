import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Pagination,
  Skeleton,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper
} from '@mui/material';
import { Star, TrendingUp, TrendingDown } from '@mui/icons-material';
import RatingCard from './RatingCard';
import { EnhancedTenantRating } from '../../types/enhancedTenantRating';

interface RatingsListProps {
  ratings: EnhancedTenantRating[];
  loading?: boolean;
  error?: string | null;
  onEdit?: (rating: EnhancedTenantRating) => void;
  onDelete?: (ratingId: string) => void;
  showActions?: boolean;
  itemsPerPage?: number;
}

type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest';

const RatingsList: React.FC<RatingsListProps> = ({
  ratings,
  loading = false,
  error = null,
  onEdit,
  onDelete,
  showActions = false,
  itemsPerPage = 5
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Sort ratings based on selected option
  const sortedRatings = useMemo(() => {
    const sorted = [...ratings];
    
    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'highest':
        return sorted.sort((a, b) => (b.overallRating || b.rating || 0) - (a.overallRating || a.rating || 0));
      case 'lowest':
        return sorted.sort((a, b) => (a.overallRating || a.rating || 0) - (b.overallRating || b.rating || 0));
      default:
        return sorted;
    }
  }, [ratings, sortBy]);

  // Paginate ratings
  const totalPages = Math.ceil(sortedRatings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRatings = sortedRatings.slice(startIndex, startIndex + itemsPerPage);

  // Calculate statistics
  const averageRating = useMemo(() => {
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, rating) => acc + (rating.overallRating || rating.rating || 0), 0);
    return Math.round((sum / ratings.length) * 10) / 10;
  }, [ratings]);

  const ratingTrend = useMemo(() => {
    if (ratings.length < 2) return null;
    
    const sortedByDate = [...ratings].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    const recentRatings = sortedByDate.slice(-3);
    const olderRatings = sortedByDate.slice(0, -3);
    
    if (olderRatings.length === 0) return null;
    
    const recentAvg = recentRatings.reduce((acc, r) => acc + (r.overallRating || r.rating || 0), 0) / recentRatings.length;
    const olderAvg = olderRatings.reduce((acc, r) => acc + (r.overallRating || r.rating || 0), 0) / olderRatings.length;
    
    return recentAvg > olderAvg ? 'up' : recentAvg < olderAvg ? 'down' : 'stable';
  }, [ratings]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  const handleSortChange = (event: any) => {
    setSortBy(event.target.value as SortOption);
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  // Loading skeleton
  if (loading) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Tenant Ratings
        </Typography>
        {Array.from({ length: 3 }).map((_, index) => (
          <Paper key={index} elevation={2} sx={{ p: 3, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Skeleton variant="circular" width={40} height={40} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="30%" height={24} />
                <Skeleton variant="text" width="20%" height={16} />
              </Box>
              <Skeleton variant="rectangular" width={60} height={24} />
            </Box>
            <Grid container spacing={2}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Grid item xs={6} sm={3} key={i}>
                  <Skeleton variant="text" width="100%" height={20} />
                  <Skeleton variant="rectangular" width="100%" height={24} />
                </Grid>
              ))}
            </Grid>
          </Paper>
        ))}
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  // Empty state
  if (ratings.length === 0) {
    return (
      <Paper elevation={1} sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
        <Star sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Ratings Yet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This tenant hasn't received any ratings yet. Submit the first rating above!
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Header with Statistics */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Tenant Ratings ({ratings.length})
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Average: {averageRating.toFixed(1)} ★
            </Typography>
            
            {ratingTrend && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {ratingTrend === 'up' && <TrendingUp color="success" fontSize="small" />}
                {ratingTrend === 'down' && <TrendingDown color="error" fontSize="small" />}
                <Typography 
                  variant="caption" 
                  color={ratingTrend === 'up' ? 'success.main' : ratingTrend === 'down' ? 'error.main' : 'text.secondary'}
                >
                  {ratingTrend === 'up' ? 'Improving' : ratingTrend === 'down' ? 'Declining' : 'Stable'}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Sort Controls */}
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Sort by</InputLabel>
          <Select
            value={sortBy}
            onChange={handleSortChange}
            label="Sort by"
          >
            <MenuItem value="newest">Newest First</MenuItem>
            <MenuItem value="oldest">Oldest First</MenuItem>
            <MenuItem value="highest">Highest Rating</MenuItem>
            <MenuItem value="lowest">Lowest Rating</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Ratings List */}
      <Box sx={{ mb: 3 }}>
        {paginatedRatings.map((rating) => (
          <RatingCard
            key={rating.id}
            rating={rating}
            showActions={showActions}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </Box>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            size="medium"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Results Info */}
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
        Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedRatings.length)} of {sortedRatings.length} ratings
      </Typography>
    </Box>
  );
};

export default RatingsList;