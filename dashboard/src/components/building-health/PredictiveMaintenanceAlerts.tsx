import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Chip,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  IconButton,
  Collapse,
  Grid,
  LinearProgress
} from '@mui/material';
import {
  Schedule,
  Warning,
  Error,
  Info,
  CheckCircle,
  ExpandMore,
  ExpandLess,
  PlayArrow,
  Assignment
} from '@mui/icons-material';
import { PredictiveAlert } from '../../types/building-health';
import AIGeneratedContent from '../../design-system/components/ai/AIGeneratedContent';
import ConfidenceIndicator from '../../design-system/components/ai/ConfidenceIndicator';
import { AIFeedback } from '../../types/ai';

interface PredictiveMaintenanceAlertsProps {
  alerts: PredictiveAlert[];
  onAlertAction?: (alertId: string, action: string) => void;
  onFeedback?: (alertId: string, feedback: AIFeedback) => void;
}

const PredictiveMaintenanceAlerts: React.FC<PredictiveMaintenanceAlertsProps> = ({
  alerts,
  onAlertAction,
  onFeedback
}) => {
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());

  const toggleExpanded = (alertId: string) => {
    setExpandedAlerts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(alertId)) {
        newSet.delete(alertId);
      } else {
        newSet.add(alertId);
      }
      return newSet;
    });
  };

  const getPriorityIcon = (priority: PredictiveAlert['priority']) => {
    switch (priority) {
      case 'critical':
        return <Error color="error" />;
      case 'high':
        return <Warning color="warning" />;
      case 'medium':
        return <Info color="info" />;
      case 'low':
        return <CheckCircle color="success" />;
      default:
        return <Info color="info" />;
    }
  };

  const getPriorityColor = (priority: PredictiveAlert['priority']) => {
    switch (priority) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getTimelineIndicator = (estimatedDate: Date) => {
    const now = new Date();
    const diffTime = estimatedDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: 'Overdue', color: 'error', urgency: 100 };
    } else if (diffDays <= 7) {
      return { text: `${diffDays} days`, color: 'error', urgency: 90 };
    } else if (diffDays <= 14) {
      return { text: `${diffDays} days`, color: 'warning', urgency: 70 };
    } else if (diffDays <= 30) {
      return { text: `${diffDays} days`, color: 'info', urgency: 50 };
    } else {
      return { text: `${diffDays} days`, color: 'success', urgency: 20 };
    }
  };

  const sortedAlerts = useMemo(() => {
    return [...alerts].sort((a, b) => {
      // Sort by priority first (critical > high > medium > low)
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then by timeline urgency
      const aTimeline = getTimelineIndicator(a.estimatedDate);
      const bTimeline = getTimelineIndicator(b.estimatedDate);
      return bTimeline.urgency - aTimeline.urgency;
    });
  }, [alerts]);

  const handleFeedback = (alertId: string, feedback: AIFeedback) => {
    onFeedback?.(alertId, feedback);
  };

  const handleAlertAction = (alertId: string, action: string) => {
    onAlertAction?.(alertId, action);
  };

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader title="Predictive Maintenance Alerts" />
        <CardContent>
          <Alert severity="info">
            No predictive maintenance alerts at this time. The AI system is monitoring your building systems for potential issues.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader 
        title="Predictive Maintenance Alerts"
        subheader={`${alerts.length} AI-generated maintenance predictions`}
        action={
          <Chip
            label={`${alerts.filter(a => a.priority === 'critical' || a.priority === 'high').length} High Priority`}
            color="warning"
            size="small"
          />
        }
      />
      <CardContent>
        <Grid container spacing={2}>
          {sortedAlerts.map((alert) => {
            const isExpanded = expandedAlerts.has(alert.id);
            const timeline = getTimelineIndicator(alert.estimatedDate);
            
            return (
              <Grid size={12} key={alert.id}>
                <AIGeneratedContent
                  confidence={alert.confidence * 100}
                  explanation={`This prediction is based on historical maintenance patterns, system performance data, and current usage trends for ${alert.category} systems.`}
                  onFeedback={(feedback) => handleFeedback(alert.id, feedback)}
                  variant="outlined"
                >
                  <Box>
                    {/* Alert Header */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', flex: 1 }}>
                        <Box sx={{ mr: 2, mt: 0.5 }}>
                          {getPriorityIcon(alert.priority)}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" component="h3" gutterBottom>
                            {alert.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {alert.description}
                          </Typography>
                          
                          {/* Priority and Timeline Indicators */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Chip
                              label={alert.priority.toUpperCase()}
                              color={getPriorityColor(alert.priority)}
                              size="small"
                              variant="filled"
                            />
                            <Chip
                              icon={<Schedule />}
                              label={`Due in ${timeline.text}`}
                              color={timeline.color as any}
                              size="small"
                              variant="outlined"
                            />
                            <Chip
                              label={alert.category}
                              size="small"
                              variant="outlined"
                            />
                          </Box>

                          {/* Timeline Progress Bar */}
                          <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                Timeline Progress
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {alert.estimatedDate.toLocaleDateString()}
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={timeline.urgency}
                              color={timeline.color as any}
                              sx={{ height: 6, borderRadius: 3 }}
                            />
                          </Box>
                        </Box>
                      </Box>
                      
                      {/* Confidence Score */}
                      <Box sx={{ ml: 2, minWidth: 120 }}>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                          AI Confidence
                        </Typography>
                        <ConfidenceIndicator
                          confidence={alert.confidence * 100}
                          variant="linear"
                          size="small"
                          showTooltip={true}
                          colorCoded={true}
                          showNumericalScore={true}
                        />
                      </Box>
                    </Box>

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<PlayArrow />}
                          onClick={() => handleAlertAction(alert.id, 'schedule')}
                          color={alert.priority === 'critical' ? 'error' : 'primary'}
                        >
                          Schedule Maintenance
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Assignment />}
                          onClick={() => handleAlertAction(alert.id, 'details')}
                        >
                          View Details
                        </Button>
                      </Box>
                      
                      <IconButton
                        onClick={() => toggleExpanded(alert.id)}
                        aria-label={isExpanded ? 'Show less' : 'Show more'}
                        size="small"
                      >
                        {isExpanded ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </Box>

                    {/* Expandable Recommended Actions */}
                    <Collapse in={isExpanded}>
                      <Divider sx={{ mb: 2 }} />
                      <Typography variant="subtitle2" gutterBottom>
                        AI-Recommended Actions
                      </Typography>
                      <List dense>
                        {alert.recommendedActions.map((action, index) => (
                          <ListItem key={index} sx={{ pl: 0 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <CheckCircle color="primary" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText 
                              primary={action}
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Collapse>
                  </Box>
                </AIGeneratedContent>
              </Grid>
            );
          })}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default PredictiveMaintenanceAlerts;