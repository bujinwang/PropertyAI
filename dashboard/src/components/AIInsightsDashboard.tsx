import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Info,
  Refresh,
  Lightbulb,
  Assessment,
  Timeline,
  Notifications,
  ThumbUp,
  ThumbDown,
} from '@mui/icons-material';
import { apiService } from '../services/apiService';

interface Insight {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  impact: number;
  recommendations: Recommendation[];
  timestamp: string;
  trend: 'up' | 'down' | 'stable';
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  actions: Action[];
}

interface Action {
  id: string;
  description: string;
  completed: boolean;
  dueDate?: string;
}

interface DashboardSummary {
  totalInsights: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  avgConfidence: number;
  avgImpact: number;
  categories: string[];
}

const AIInsightsDashboard: React.FC = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  const [feedbackDialog, setFeedbackDialog] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadInsights();
    loadSummary();
  }, []);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/ai/insights');
      if (response.data.status === 'success') {
        setInsights(response.data.data);
      }
    } catch (err: any) {
      setError('Failed to load insights');
      console.error('Error loading insights:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const response = await apiService.get('/ai/insights/summary');
      if (response.data) {
        setSummary(response.data);
      }
    } catch (err: any) {
      console.error('Error loading summary:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadInsights(), loadSummary()]);
    setRefreshing(false);
  };

  const handleInsightClick = (insight: Insight) => {
    setSelectedInsight(insight);
  };

  const handleFeedback = async (insightId: string, isHelpful: boolean) => {
    try {
      await apiService.post('/ai/feedback', {
        insightId,
        type: 'insight_helpfulness',
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

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp color="success" />;
      case 'down': return <TrendingDown color="error" />;
      default: return <Timeline color="action" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'financial': return <TrendingUp />;
      case 'operational': return <Assessment />;
      case 'tenant_satisfaction': return <ThumbUp />;
      default: return <Info />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          AI Insights Dashboard
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
        <Button onClick={handleRefresh} startIcon={<Refresh />}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          AI Insights Dashboard
        </Typography>
        <Button
          onClick={handleRefresh}
          startIcon={<Refresh />}
          disabled={refreshing}
          variant="outlined"
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      {/* Summary Cards */}
      {summary && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Insights
                </Typography>
                <Typography variant="h4">
                  {summary.totalInsights}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Critical Issues
                </Typography>
                <Typography variant="h4" color="error">
                  {summary.criticalCount}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Average Confidence
                </Typography>
                <Typography variant="h4">
                  {(summary.avgConfidence * 100).toFixed(1)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Average Impact
                </Typography>
                <Typography variant="h4">
                  {(summary.avgImpact * 100).toFixed(1)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Insights List */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Insights
            </Typography>
            <List>
              {insights.map((insight, index) => (
                <React.Fragment key={insight.id}>
                  <ListItem
                    button
                    onClick={() => handleInsightClick(insight)}
                    sx={{
                      borderRadius: 1,
                      mb: 1,
                      '&:hover': { backgroundColor: 'action.hover' }
                    }}
                  >
                    <ListItemIcon>
                      {getCategoryIcon(insight.category)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1">
                            {insight.title}
                          </Typography>
                          <Chip
                            label={insight.priority}
                            color={getPriorityColor(insight.priority) as any}
                            size="small"
                          />
                          {getTrendIcon(insight.trend)}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            {insight.description}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                            <Typography variant="caption">
                              Confidence: {(insight.confidence * 100).toFixed(1)}%
                            </Typography>
                            <Typography variant="caption">
                              Impact: {(insight.impact * 100).toFixed(1)}%
                            </Typography>
                            <Typography variant="caption">
                              {new Date(insight.timestamp).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < insights.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<Notifications />}
                onClick={() => {/* Handle notifications */}}
              >
                View Alerts
              </Button>
              <Button
                variant="outlined"
                startIcon={<Lightbulb />}
                onClick={() => {/* Handle recommendations */}}
              >
                Generate Report
              </Button>
              <Button
                variant="outlined"
                startIcon={<Assessment />}
                onClick={() => {/* Handle analytics */}}
              >
                View Analytics
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Insight Detail Dialog */}
      <Dialog
        open={!!selectedInsight}
        onClose={() => setSelectedInsight(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedInsight?.title}
        </DialogTitle>
        <DialogContent>
          {selectedInsight && (
            <Box>
              <Typography variant="body1" paragraph>
                {selectedInsight.description}
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Chip
                  label={`Priority: ${selectedInsight.priority}`}
                  color={getPriorityColor(selectedInsight.priority) as any}
                />
                <Chip
                  label={`Confidence: ${(selectedInsight.confidence * 100).toFixed(1)}%`}
                  variant="outlined"
                />
                <Chip
                  label={`Impact: ${(selectedInsight.impact * 100).toFixed(1)}%`}
                  variant="outlined"
                />
              </Box>

              <Typography variant="h6" gutterBottom>
                Recommendations
              </Typography>
              <List>
                {selectedInsight.recommendations.map((rec) => (
                  <ListItem key={rec.id}>
                    <ListItemText
                      primary={rec.title}
                      secondary={rec.description}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeedbackDialog(true)}>
            Provide Feedback
          </Button>
          <Button onClick={() => setSelectedInsight(null)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog
        open={feedbackDialog}
        onClose={() => setFeedbackDialog(false)}
      >
        <DialogTitle>Was this insight helpful?</DialogTitle>
        <DialogContent>
          <Typography>
            Your feedback helps us improve our AI recommendations.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => selectedInsight && handleFeedback(selectedInsight.id, false)}
            startIcon={<ThumbDown />}
          >
            Not Helpful
          </Button>
          <Button
            onClick={() => selectedInsight && handleFeedback(selectedInsight.id, true)}
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

export default AIInsightsDashboard;