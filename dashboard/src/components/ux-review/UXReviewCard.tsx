import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
  IconButton,
  Stack,
  Divider,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Comment as CommentIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';

interface UXReview {
  id: string;
  title: string;
  description?: string;
  componentId: string;
  componentType: string;
  reviewer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  reviewType: string;
  severity: string;
  status: string;
  priority: string;
  url?: string;
  screenshots: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  metrics: any[];
  assignments: any[];
  comments: any[];
}

interface UXReviewCardProps {
  review: UXReview;
  onClick: () => void;
  onAssign: () => void;
  getStatusIcon: (status: string) => React.ReactNode;
  getSeverityColor: (severity: string) => string;
  getPriorityColor: (priority: string) => string;
}

export const UXReviewCard: React.FC<UXReviewCardProps> = ({
  review,
  onClick,
  onAssign,
  getStatusIcon,
  getSeverityColor,
  getPriorityColor,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return '⚠️';
      case 'HIGH': return '🔶';
      case 'MEDIUM': return '🔷';
      case 'LOW': return '✅';
      default: return '⚪';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'URGENT': return '🚨';
      case 'HIGH': return '⬆️';
      case 'MEDIUM': return '➡️';
      case 'LOW': return '⬇️';
      default: return '⚪';
    }
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        fontSize: '16px', // Enhanced readability
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 8, // More prominent hover
        },
        '&:focus': {
          outline: '3px solid #1976d2', // More prominent focus
          outlineOffset: '3px',
          boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.3)',
        },
        '&focus-visible': {
          outline: '3px solid #1976d2',
          outlineOffset: '3px',
        },
      }}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`UX Review: ${review.title}. Press Enter or Space to view details.`}
    >
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Box display="flex" alignItems="center" gap={1}>
            {getStatusIcon(review.status)}
            <Typography variant="h6" component="h3" noWrap sx={{ maxWidth: 200 }}>
              {review.title}
            </Typography>
          </Box>
          <IconButton 
            size="small" 
            onClick={(e) => { e.stopPropagation(); onAssign(); }}
            aria-label={`Assign ${review.title} to team member`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation();
                e.preventDefault();
                onAssign();
              }
            }}
          >
            <AssignmentIcon />
          </IconButton>
        </Box>

        {/* Component Info */}
        <Box mb={1}>
          <Typography variant="body2" color="text.secondary" noWrap>
            {review.componentType} • {review.componentId}
          </Typography>
          {review.url && (
            <Typography variant="body2" color="primary" noWrap>
              {review.url}
            </Typography>
          )}
        </Box>

        {/* Description */}
        {review.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
            mb={2}
          >
            {review.description}
          </Typography>
        )}

        {/* Tags */}
        {review.tags.length > 0 && (
          <Box mb={2}>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              {review.tags.slice(0, 3).map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  variant="outlined"
                  sx={{ mb: 0.5 }}
                />
              ))}
              {review.tags.length > 3 && (
                <Chip
                  label={`+${review.tags.length - 3}`}
                  size="small"
                  variant="outlined"
                  sx={{ mb: 0.5 }}
                />
              )}
            </Stack>
          </Box>
        )}

        {/* Badges */}
        <Box 
          display="flex" 
          gap={1} 
          mb={2} 
          flexWrap="wrap"
          role="list"
          aria-label="Review attributes"
        >
          <Chip
            label={review.reviewType}
            size="small"
            color="default"
            variant="outlined"
            role="listitem"
            aria-label={`Review type: ${review.reviewType}`}
          />
          <Chip
            label={review.severity}
            size="small"
            color={getSeverityColor(review.severity) as any}
            variant="filled"
            role="listitem"
            aria-label={`Severity: ${review.severity}`}
          />
          <Chip
            label={review.priority}
            size="small"
            color={getPriorityColor(review.priority) as any}
            variant="filled"
            role="listitem"
            aria-label={`Priority: ${review.priority}`}
          />
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* Footer */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1} aria-label="Reviewer information">
            <Avatar
              sx={{ width: 24, height: 24, fontSize: 12 }}
              src={`https://ui-avatars.com/api/?name=${review.reviewer.firstName}+${review.reviewer.lastName}&background=random`}
              alt={`Reviewer: ${review.reviewer.firstName} ${review.reviewer.lastName}`}
            />
            <Typography variant="caption" color="text.secondary" aria-label={`Reviewer: ${review.reviewer.firstName} ${review.reviewer.lastName}`}>
              {review.reviewer.firstName} {review.reviewer.lastName}
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={1} aria-label="Review statistics">
            <Box display="flex" alignItems="center" gap={0.5} aria-label={`${review.comments.length} comments`}>
              <CommentIcon fontSize="small" color="action" aria-hidden="true" />
              <Typography variant="caption" color="text.secondary" aria-label={`${review.comments.length} comments`}>
                {review.comments.length}
              </Typography>
            </Box>

            <Box display="flex" alignItems="center" gap={0.5} aria-label={`${review.assignments.length} assignments`}>
              <AssignmentIcon fontSize="small" color="action" aria-hidden="true" />
              <Typography variant="caption" color="text.secondary" aria-label={`${review.assignments.length} assignments`}>
                {review.assignments.length}
              </Typography>
            </Box>

            <Typography variant="caption" color="text.secondary" aria-label={`Created on ${formatDate(review.createdAt)}`}>
              {formatDate(review.createdAt)}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};