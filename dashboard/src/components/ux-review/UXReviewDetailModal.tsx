import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Avatar,
  TextField,
  IconButton,
  Divider,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
} from '@mui/material';
import {
  Close as CloseIcon,
  Assignment as AssignmentIcon,
  Comment as CommentIcon,
  Link as LinkIcon,
  Edit as EditIcon,
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

interface UXReviewDetailModalProps {
  open: boolean;
  onClose: () => void;
  review: UXReview | null;
}

export const UXReviewDetailModal: React.FC<UXReviewDetailModalProps> = ({
  open,
  onClose,
  review,
}) => {
  const [newComment, setNewComment] = useState('');

  if (!review) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'success';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'error';
      case 'IN_PROGRESS': return 'warning';
      case 'RESOLVED': return 'success';
      case 'CLOSED': return 'default';
      case 'WONT_FIX': return 'default';
      default: return 'default';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{review.title}</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ p: 2 }}>
          <Grid container spacing={3}>
            {/* Basic Info */}
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
              
              <Box mb={2}>
                <Typography variant="body1" paragraph>
                  {review.description || 'No description provided.'}
                </Typography>
              </Box>

              <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                <Chip label={review.reviewType} size="small" variant="outlined" />
                <Chip 
                  label={review.severity} 
                  size="small" 
                  color={getSeverityColor(review.severity) as any}
                  variant="filled" 
                />
                <Chip 
                  label={review.priority} 
                  size="small" 
                  color={getPriorityColor(review.priority) as any}
                  variant="filled" 
                />
                <Chip 
                  label={review.status} 
                  size="small" 
                  color={getStatusColor(review.status) as any}
                  variant="filled" 
                />
              </Box>

              <Box display="flex" gap={1} flexWrap="wrap">
                {review.tags.map((tag) => (
                  <Chip key={tag} label={tag} size="small" variant="outlined" />
                ))}
              </Box>
            </Grid>

            {/* Metadata */}
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>
                Details
              </Typography>
              
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Component Type
                </Typography>
                <Typography variant="body1">{review.componentType.replace('_', ' ')}</Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Component ID
                </Typography>
                <Typography variant="body1" fontFamily="monospace">{review.componentId}</Typography>
              </Box>

              {review.url && (
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    URL
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <a href={review.url} target="_blank" rel="noopener noreferrer">
                      {review.url}
                    </a>
                    <LinkIcon fontSize="small" color="action" />
                  </Box>
                </Box>
              )}

              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Created
                </Typography>
                <Typography variant="body1">{formatDate(review.createdAt)}</Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Reporter
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Avatar sx={{ width: 24, height: 24 }} 
                    src={`https://ui-avatars.com/api/?name=${review.reviewer.firstName}+${review.reviewer.lastName}&background=random`}
                  />
                  <Typography variant="body1">{review.reviewer.firstName} {review.reviewer.lastName}</Typography>
                </Box>
              </Box>
            </Grid>

            {/* Screenshots */}
            {review.screenshots.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Screenshots
                </Typography>
                <Grid container spacing={2}>
                  {review.screenshots.map((screenshot, index) => (
                    <Grid item key={index} xs={12} sm={6} md={4}>
                      <Card variant="outlined">
                        <CardContent sx={{ p: 1 }}>
                          <Box
                            component="img"
                            src={screenshot}
                            alt={`Screenshot ${index + 1}`}
                            sx={{
                              width: '100%',
                              height: 200,
                              objectFit: 'cover',
                              borderRadius: 1,
                            }}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            )}

            {/* Metrics */}
            {review.metrics.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Metrics
                </Typography>
                <Grid container spacing={2}>                  
                  {review.metrics.map((metric) => (
                    <Grid item key={metric.id} xs={12} sm={6} md={4}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" color="primary">
                            {metric.value} {metric.unit}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {metric.metricType.replace('_', ' ')}
                          </Typography>
                          {metric.target && (
                            <Typography variant="caption" color="text.secondary">
                              Target: {metric.target} {metric.unit}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            )}

            {/* Assignments */}
            {review.assignments.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Assignments
                </Typography>
                <List>
                  {review.assignments.map((assignment) => (
                    <ListItem key={assignment.id}>
                      <ListItemAvatar>
                        <Avatar
                          src={`https://ui-avatars.com/api/?name=${assignment.assignee.firstName}+${assignment.assignee.lastName}&background=random`}
                        />
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${assignment.assignee.firstName} ${assignment.assignee.lastName}`}
                        secondary={`Status: ${assignment.status} ${assignment.dueDate ? `| Due: ${formatDate(assignment.dueDate)}` : ''}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            )}

            {/* Comments */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Comments ({review.comments.length})
              </Typography>
              <List>
                {review.comments.map((comment) => (
                  <ListItem key={comment.id} alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar
                        src={`https://ui-avatars.com/api/?name=${comment.author.firstName}+${comment.author.lastName}&background=random`}
                      />
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="subtitle2">
                            {comment.author.firstName} {comment.author.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(comment.createdAt)}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2">{comment.content}</Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>

              <Box mt={2}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  variant="outlined"
                  size="small"
                />
              </Box>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
        <Button onClick={() => {}} color="primary" startIcon={<EditIcon />}>
          Edit
        </Button>
      </DialogActions>
    </Dialog>
  );
};