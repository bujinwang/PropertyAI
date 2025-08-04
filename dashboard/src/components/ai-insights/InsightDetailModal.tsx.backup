import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Chip,
  IconButton,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Divider,
  Card,
  CardContent,
  LinearProgress,
  Avatar,
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Close as CloseIcon,
  Refresh as RefreshIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  Insights as InsightsIcon
} from '@mui/icons-material';
import { Insight, AIRecommendation, InsightPriority } from '../../types/ai-insights';
import { aiInsightsService } from '../../services/aiInsightsService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface InsightDetailModalProps {
  open: boolean;
  insight: Insight | null;
  onClose: () => void;
  onRefresh?: (insightId: string) => void;
}

interface FeedbackState {
  helpful: boolean | null;
  comment: string;
  actionTaken: boolean;
}

export const InsightDetailModal: React.FC<InsightDetailModalProps> = ({
  open,
  insight,
  onClose,
  onRefresh
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [feedback, setFeedback] = useState<FeedbackState>({
    helpful: null,
    comment: '',
    actionTaken: false
  });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'data' | 'recommendations' | 'history'>('overview');

  const priorityColors = {
    critical: '#f44336',
    high: '#ff9800',
    medium: '#2196f3',
    low: '#4caf50'
  };

  if (!insight) return null;

  const handleFeedbackSubmit = async () => {
    if (feedback.helpful === null) return;

    setSubmittingFeedback(true);
    try {
      await aiInsightsService.submitInsightFeedback(insight.id, {
        helpful: feedback.helpful,
        comment: feedback.comment || undefined,
        actionTaken: feedback.actionTaken
      });

      // Reset feedback
      setFeedback({ helpful: null, comment: '', actionTaken: false });
      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleRecommendationAction = async (recommendationId: string, actionId: string, completed: boolean) => {
    try {
      await aiInsightsService.updateRecommendationAction(
        insight.id,
        recommendationId,
        actionId,
        completed
      );
      
      // Refresh insight if callback provided
      if (onRefresh) {
        onRefresh(insight.id);
      }
    } catch (error) {
      console.error('Error updating recommendation action:', error);
    }
  };

  const handleRegenerate = async () => {
    try {
      const regenerated = await aiInsightsService.regenerateInsight(insight.id);
      if (onRefresh) {
        onRefresh(insight.id);
      }
    } catch (error) {
      console.error('Error regenerating insight:', error);
    }
  };

  const renderConfidenceScore = (confidence: number) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <LinearProgress 
        variant="determinate" 
        value={confidence} 
        sx={{ 
          width: 100, 
          height: 8, 
          borderRadius: 4,
          backgroundColor: theme.palette.grey[200],
          '& .MuiLinearProgress-bar': {
            backgroundColor: confidence > 80 ? '#4caf50' 
              : confidence > 60 ? '#ff9800' : '#f44336'
          }
        }} 
      />
      <Typography variant="body2" color="text.secondary">
        {confidence}%
      </Typography>
    </Box>
  );

  const renderTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUpIcon sx={{ color: '#4caf50', fontSize: 20 }} />;
      case 'down':
        return <TrendingDownIcon sx={{ color: '#f44336', fontSize: 20 }} />;
      default:
        return null;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      fullScreen={isMobile}
      scroll="paper"
    >
      <DialogTitle sx={{ m: 0, p: 2 }} disableTypography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: priorityColors[insight.priority] }}>
              <InsightsIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" component="div">
                {insight.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Chip 
                  label={insight.priority.toUpperCase()} 
                  size="small"
                  sx={{ 
                    bgcolor: priorityColors[insight.priority],
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
                <Chip 
                  label={insight.category} 
                  size="small"
                  variant="outlined"
                />
                {renderTrendIcon(insight.trend)}
              </Box>
            </Box>
          </Box>

          <Box>
            <IconButton onClick={handleRegenerate} title="Regenerate insight">
              <RefreshIcon />
            </IconButton>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ px: 3, py: 1 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {['overview', 'data', 'recommendations', 'history'].map((tab) => (
              <Button
                key={tab}
                size="small"
                variant={activeTab === tab ? 'contained' : 'text'}
                onClick={() => setActiveTab(tab as any)}
                sx={{ textTransform: 'capitalize' }}
              >
                {tab.replace('_', ' ')}
              </Button>
            ))}
          </Box>
        </Box>
      </Box>

      <DialogContent dividers>
        {activeTab === 'overview' && (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Typography variant="body1" paragraph>
                  {insight.description}
                </Typography>
                <Typography variant="h6" gutterBottom>
                  Key Findings
                </Typography>
                <List dense>
                  {insight.dataPoints?.map((point, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 30 }}>
                        <CheckIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={point.label} secondary={point.value} />
                    </ListItem>
                  ))}
                </List>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Confidence Score
                    </Typography>
                    {renderConfidenceScore(insight.confidence)}
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {insight.confidenceExplanation}
                    </Typography>
                  </CardContent>
                </Card>

                <Card variant="outlined" sx={{ mt: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Impact
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {insight.impact}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Estimated {insight.impactType || 'business'} impact
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {insight.aiRecommendations && insight.aiRecommendations.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  AI Recommendations
                </Typography>
                <Grid container spacing={2}>
                  {insight.aiRecommendations.slice(0, 3).map((rec) => (
                    <Grid item xs={12} md={6} key={rec.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom>
                            {rec.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {rec.description}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Chip 
                              label={rec.priority} 
                              size="small"
                              color={rec.priority === 'high' ? 'error' : rec.priority === 'medium' ? 'warning' : 'default'}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {rec.timeline}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Box>
        )}

        {activeTab === 'data' && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Supporting Data
            </Typography>
            
            {insight.chartData && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {insight.chartData.title || 'Trend Analysis'}
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={insight.chartData.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke={theme.palette.primary.main} 
                        strokeWidth={2}
                        dot={{ fill: theme.palette.primary.main }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Raw Data Points</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {insight.dataPoints?.map((point, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemText 
                        primary={point.label}
                        secondary={`${point.value} (${point.change || 'No change'})`}
                      />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          </Box>
        )}

        {activeTab === 'recommendations' && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Detailed Recommendations
            </Typography>
            
            {insight.aiRecommendations?.map((rec) => (
              <Card key={rec.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {rec.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {rec.description}
                      </Typography>
                    </Box>
                    <Chip 
                      label={rec.priority.toUpperCase()} 
                      color={rec.priority === 'high' ? 'error' : rec.priority === 'medium' ? 'warning' : 'info'}
                      variant="filled"
                    />
                  </Box>

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Timeline
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {rec.timeline}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Expected Outcome
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {rec.expectedOutcome}
                      </Typography>
                    </Grid>
                  </Grid>

                  {rec.actions?.map((action) => (
                    <Box key={action.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <CheckIcon 
                        color={action.completed ? 'success' : 'disabled'}
                        fontSize="small"
                      />
                      <Typography 
                        variant="body2"
                        sx={{ 
                          textDecoration: action.completed ? 'line-through' : 'none',
                          color: action.completed ? 'text.secondary' : 'text.primary'
                        }}
                      >
                        {action.description}
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        {activeTab === 'history' && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Insight History
            </Typography>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              Generated: {new Date(insight.createdAt).toLocaleString()}
            </Typography>
            
            {insight.updatedAt && (
              <Typography variant="body2" color="text.secondary" paragraph>
                Last Updated: {new Date(insight.updatedAt).toLocaleString()}
              </Typography>
            )}
            
            <Typography variant="body1" paragraph>
              {insight.methodology || 'AI-generated insight based on historical data and predictive models.'}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Was this insight helpful?
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              onClick={() => setFeedback(prev => ({ ...prev, helpful: true }))}
              color={feedback.helpful === true ? 'success' : 'default'}
              size="small"
            >
              <ThumbUpIcon />
            </IconButton>
            <IconButton
              onClick={() => setFeedback(prev => ({ ...prev, helpful: false }))}
              color={feedback.helpful === false ? 'error' : 'default'}
              size="small"
            >
              <ThumbDownIcon />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={onClose}>
            Close
          </Button>
          <Button
            variant="contained"
            onClick={handleFeedbackSubmit}
            disabled={feedback.helpful === null || submittingFeedback}
          >
            {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};