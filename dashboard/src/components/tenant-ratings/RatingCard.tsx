import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
  IconButton,
  Collapse,
  Divider,
  Grid,
  Tooltip
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Person,
  Edit,
  Delete,
  CalendarToday
} from '@mui/icons-material';
import { format } from 'date-fns';
import StarRating from './StarRating';
import { EnhancedTenantRating, RATING_CATEGORIES } from '../../types/enhancedTenantRating';

interface RatingCardProps {
  rating: EnhancedTenantRating;
  showActions?: boolean;
  onEdit?: (rating: EnhancedTenantRating) => void;
  onDelete?: (ratingId: string) => void;
  compact?: boolean;
}

const RatingCard: React.FC<RatingCardProps> = ({
  rating,
  showActions = false,
  onEdit,
  onDelete,
  compact = false
}) => {
  const [expanded, setExpanded] = useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const handleEdit = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (onEdit) {
      onEdit(rating);
    }
  };

  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (onDelete && window.confirm('Are you sure you want to delete this rating?')) {
      onDelete(rating.id);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy at h:mm a');
    } catch {
      return 'Invalid date';
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'success';
    if (rating >= 3) return 'warning';
    return 'error';
  };

  // Ensure overallRating is always a valid number
  const overallRating = Number(rating.overallRating || rating.rating || 0);

  // Safe access to rater information
  const raterFirstName = rating.rater?.firstName || 'Unknown';
  const raterLastName = rating.rater?.lastName || 'User';

  return (
    <Card 
      elevation={2} 
      sx={{ 
        mb: 2,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          elevation: 4,
          transform: 'translateY(-2px)'
        }
      }}
    >
      <CardContent sx={{ pb: compact ? 2 : 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>
              <Person />
            </Avatar>
            
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {raterFirstName} {raterLastName}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarToday sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {formatDate(rating.createdAt)}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Overall Rating */}
            <Chip
              label={`${overallRating.toFixed(1)} ★`}
              color={getRatingColor(overallRating) as any}
              variant="filled"
              size="small"
              sx={{ fontWeight: 'bold' }}
            />

            {/* Actions */}
            {showActions && (
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {onEdit && (
                  <Tooltip title="Edit rating">
                    <IconButton size="small" onClick={handleEdit} color="primary">
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                
                {onDelete && (
                  <Tooltip title="Delete rating">
                    <IconButton size="small" onClick={handleDelete} color="error">
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            )}

            {/* Expand/Collapse */}
            <IconButton
              onClick={handleExpandClick}
              size="small"
              sx={{
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease-in-out'
              }}
            >
              <ExpandMore />
            </IconButton>
          </Box>
        </Box>

        {/* Category Ratings Preview */}
        {!compact && (
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {Object.entries(RATING_CATEGORIES).map(([key, label]) => {
              const categoryRating = Number(rating.categories?.[key as keyof typeof rating.categories] || 0);
              return (
                <Grid item xs={6} sm={3} key={key}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      {label}
                    </Typography>
                    <Chip
                      label={`${categoryRating.toFixed(1)} ★`}
                      size="small"
                      color={getRatingColor(categoryRating) as any}
                      variant="outlined"
                    />
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        )}

        {/* Tags */}
        {rating.tags && rating.tags.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
            {rating.tags.map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                size="small"
                variant="outlined"
                color="primary"
              />
            ))}
          </Box>
        )}

        {/* Expandable Content */}
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Divider sx={{ my: 2 }} />
          
          {/* Detailed Category Ratings */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
              Detailed Ratings
            </Typography>
            
            <Grid container spacing={2}>
              {Object.entries(RATING_CATEGORIES).map(([key, label]) => {
                const categoryRating = Number(rating.categories?.[key as keyof typeof rating.categories] || 0);
                return (
                  <Grid item xs={12} sm={6} key={key}>
                    <StarRating
                      value={categoryRating}
                      disabled={true}
                      size="small"
                      label={label}
                      showValue={true}
                    />
                  </Grid>
                );
              })}
            </Grid>
          </Box>

          {/* Comment */}
          {rating.comment && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                Comments
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  p: 2, 
                  bgcolor: 'grey.50', 
                  borderRadius: 1,
                  fontStyle: 'italic',
                  lineHeight: 1.6
                }}
              >
                "{rating.comment}"
              </Typography>
            </Box>
          )}

          {/* Metadata */}
          <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary">
              Created: {formatDateTime(rating.createdAt)}
              {rating.updatedAt !== rating.createdAt && (
                <> • Updated: {formatDateTime(rating.updatedAt)}</>
              )}
            </Typography>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default RatingCard;