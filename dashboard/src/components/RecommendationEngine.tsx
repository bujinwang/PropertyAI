import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Alert,
  Grid,
  Paper,
  Divider,
} from '@mui/material';
import {
  ThumbUp,
  ThumbDown,
  CheckCircle,
  Schedule,
  TrendingUp,
  Warning,
  Lightbulb,
  PriorityHigh,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { apiService } from '../services/apiService';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  impact: number;
  expectedOutcome: string;
  timeline: string;
  actions: Action[];
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: string;
}

interface Action {
  id: string;
  description: string;
  completed: boolean;
  dueDate?: string;
  assignedTo?: string;
}

interface RecommendationStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  avgConfidence: number;
  avgImpact: number;
}

const RecommendationEngine: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [stats, setStats] = useState<RecommendationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [expandedRec, setExpandedRec] = useState<string | null>(null);
  const [feedbackDialog, setFeedbackDialog] = useState(false);

  useEffect(() => {
    loadRecommendations();
    loadStats();
  }, []);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/ai/recommendations');
      if (response.data) {
        setRecommendations(response.data);
      }
    } catch (err: any) {
      setError('Failed to load recommendations');
      console.error('Error loading recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiService.get('/ai/recommendations/stats');
      if (response.data) {
        setStats(response.data);
      }
    } catch (err: any) {
      console.error('Error loading stats:', err);
    }
  };

  const handleActionToggle = async (recId: string, actionId: string, completed: boolean) => {
    try {
      await apiService.patch(`/ai/recommendations/${recId}/actions/${actionId}`, {
        completed: !completed
      });

      // Update local state
      setRecommendations(prev =>
        prev.map(rec =>
          rec.id === recId
            ? {
                ...rec,
                actions: rec.actions.map(action =>
                  action.id === actionId
                    ? { ...action, completed: !completed }
                    : action
                )
              }
            : rec
        )
      );
    } catch (err: any) {
      console.error('Error updating action:', err);
    }
  };

  const handleRecommendationFeedback = async (recId: string, isHelpful: boolean) => {
    try {
      await apiService.post('/ai/feedback', {
        recommendationId: recId,
        type: 'recommendation_helpfulness',
        rating: isHelpful ? 1 : 0,
      });
      setFeedbackDialog(false);
    } catch (err: any) {
      console.error('Error submitting feedback:', err);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <PriorityHigh color="error" />;
      case 'high': return <Warning color="warning" />;
      case 'medium': return <Schedule color="info" />;
      case 'low': return <CheckCircle color="success" />;
      default: return <Lightbulb />;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      financial: '#4caf50',
      operational: '#2196f3',
      maintenance: '#ff9800',
      tenant: '#9c27b0',
      marketing: '#607d8b',
    };
    return colors[category] || '#757575';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'info';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          AI Recommendations
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={loadRecommendations}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        AI Recommendations
      </Typography>

      {/* Stats Overview */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Recommendations
                </Typography>
                <Typography variant="h4">
                  {stats.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Completed
                </Typography>
                <Typography variant="h4" color="success.main">
                  {stats.completed}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  In Progress
                </Typography>
                <Typography variant="h4" color="info.main">
                  {stats.inProgress}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Success Rate
                </Typography>
                <Typography variant="h4">
                  {stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : 0}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Recommendations List */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Priority Recommendations
        </Typography>
        <List>
          {recommendations.map((rec, index) => (
            <React.Fragment key={rec.id}>
              <ListItem
                sx={{
                  borderRadius: 1,
                  mb: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': { backgroundColor: 'action.hover' }
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: getCategoryColor(rec.category) }}>
                    {getPriorityIcon(rec.priority)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="subtitle1">
                        {rec.title}
                      </Typography>
                      <Chip
                        label={rec.priority}
                        color={getPriorityColor(rec.priority) as any}
                        size="small"
                      />
                      <Chip
                        label={rec.category}
                        variant="outlined"
                        size="small"
                      />
                      <Chip
                        label={rec.status.replace('_', ' ')}
                        color={getStatusColor(rec.status) as any}
                        size="small"
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="textSecondary" paragraph>
                        {rec.description}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Typography variant="caption">
                          Confidence: {(rec.confidence * 100).toFixed(1)}%
                        </Typography>
                        <Typography variant="caption">
                          Impact: {(rec.impact * 100).toFixed(1)}%
                        </Typography>
                        <Typography variant="caption">
                          Timeline: {rec.timeline}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="primary">
                        Expected Outcome: {rec.expectedOutcome}
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    onClick={() => setExpandedRec(expandedRec === rec.id ? null : rec.id)}
                  >
                    {expandedRec === rec.id ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>

              {/* Expanded Actions */}
              {expandedRec === rec.id && (
                <Box sx={{ ml: 8, mr: 2, mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Action Items
                  </Typography>
                  <List dense>
                    {rec.actions.map((action) => (
                      <ListItem key={action.id} sx={{ px: 0 }}>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <IconButton
                                size="small"
                                onClick={() => handleActionToggle(rec.id, action.id, action.completed)}
                                color={action.completed ? 'success' : 'default'}
                              >
                                <CheckCircle />
                              </IconButton>
                              <Typography
                                variant="body2"
                                sx={{
                                  textDecoration: action.completed ? 'line-through' : 'none',
                                  color: action.completed ? 'text.disabled' : 'text.primary'
                                }}
                              >
                                {action.description}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            action.dueDate && (
                              <Typography variant="caption" color="textSecondary">
                                Due: {new Date(action.dueDate).toLocaleDateString()}
                              </Typography>
                            )
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Button
                      size="small"
                      onClick={() => setSelectedRec(rec)}
                      variant="outlined"
                    >
                      View Details
                    </Button>
                    <Button
                      size="small"
                      onClick={() => setFeedbackDialog(true)}
                      startIcon={<ThumbUp />}
                    >
                      Feedback
                    </Button>
                  </Box>
                </Box>
              )}

              {index < recommendations.length - 1 && <Divider sx={{ my: 1 }} />}
            </React.Fragment>
          ))}
        </List>
      </Paper>

      {/* Recommendation Detail Dialog */}
      <Dialog
        open={!!selectedRec}
        onClose={() => setSelectedRec(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedRec?.title}
        </DialogTitle>
        <DialogContent>
          {selectedRec && (
            <Box>
              <Typography variant="body1" paragraph>
                {selectedRec.description}
              </Typography>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="textSecondary">
                    Priority
                  </Typography>
                  <Typography variant="body2">
                    {selectedRec.priority}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="textSecondary">
                    Confidence
                  </Typography>
                  <Typography variant="body2">
                    {(selectedRec.confidence * 100).toFixed(1)}%
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="textSecondary">
                    Impact
                  </Typography>
                  <Typography variant="body2">
                    {(selectedRec.impact * 100).toFixed(1)}%
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="textSecondary">
                    Timeline
                  </Typography>
                  <Typography variant="body2">
                    {selectedRec.timeline}
                  </Typography>
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom>
                Expected Outcome
              </Typography>
              <Typography variant="body2" paragraph>
                {selectedRec.expectedOutcome}
              </Typography>

              <Typography variant="h6" gutterBottom>
                Action Plan
              </Typography>
              <List>
                {selectedRec.actions.map((action) => (
                  <ListItem key={action.id}>
                    <ListItemText
                      primary={action.description}
                      secondary={
                        action.dueDate
                          ? `Due: ${new Date(action.dueDate).toLocaleDateString()}`
                          : 'No due date'
                      }
                    />
                    <ListItemSecondaryAction>
                      <Chip
                        label={action.completed ? 'Completed' : 'Pending'}
                        color={action.completed ? 'success' : 'default'}
                        size="small"
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedRec(null)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog
        open={feedbackDialog}
        onClose={() => setFeedbackDialog(false)}
      >
        <DialogTitle>Was this recommendation helpful?</DialogTitle>
        <DialogContent>
          <Typography>
            Your feedback helps us improve our AI recommendations.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => selectedRec && handleRecommendationFeedback(selectedRec.id, false)}
            startIcon={<ThumbDown />}
          >
            Not Helpful
          </Button>
          <Button
            onClick={() => selectedRec && handleRecommendationFeedback(selectedRec.id, true)}
            startIcon={<ThumbUp />}
            variant="contained"
          >
            Helpful
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RecommendationEngine;