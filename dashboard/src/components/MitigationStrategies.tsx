import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  AlertTitle,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Build as BuildIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Business as BusinessIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayArrowIcon,
  Assignment as AssignmentIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';

interface MitigationStrategy {
  category: string;
  riskScore: number;
  priority: 'immediate' | 'urgent' | 'high' | 'medium';
  actions: string[];
  estimatedCost: string;
  timeline: string;
}

interface MitigationStrategiesProps {
  mitigationStrategies: MitigationStrategy[];
  onActionTaken: () => void;
}

export const MitigationStrategies: React.FC<MitigationStrategiesProps> = ({
  mitigationStrategies,
  onActionTaken
}) => {
  const [selectedStrategy, setSelectedStrategy] = useState<MitigationStrategy | null>(null);
  const [strategyDialog, setStrategyDialog] = useState(false);
  const [actionProgress, setActionProgress] = useState<{ [key: string]: number }>({});
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());

  // Priority colors and icons
  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'immediate':
        return {
          color: '#d32f2f',
          bgColor: '#ffebee',
          icon: <WarningIcon sx={{ color: '#d32f2f' }} />,
          label: 'Immediate Action Required'
        };
      case 'urgent':
        return {
          color: '#f57c00',
          bgColor: '#fff3e0',
          icon: <WarningIcon sx={{ color: '#f57c00' }} />,
          label: 'Urgent Attention Needed'
        };
      case 'high':
        return {
          color: '#fbc02d',
          bgColor: '#fffde7',
          icon: <TrendingUpIcon sx={{ color: '#fbc02d' }} />,
          label: 'High Priority'
        };
      case 'medium':
        return {
          color: '#388e3c',
          bgColor: '#e8f5e8',
          icon: <InfoIcon sx={{ color: '#388e3c' }} />,
          label: 'Medium Priority'
        };
      default:
        return {
          color: '#757575',
          bgColor: '#f5f5f5',
          icon: <InfoIcon />,
          label: 'Low Priority'
        };
    }
  };

  // Category icons
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'maintenance':
        return <BuildIcon />;
      case 'churn':
        return <TrendingUpIcon />;
      case 'market':
        return <BusinessIcon />;
      case 'financial':
        return <MoneyIcon />;
      case 'operational':
        return <BusinessIcon />;
      case 'compliance':
        return <AssignmentIcon />;
      case 'behavioral':
        return <WarningIcon />;
      case 'payment':
        return <MoneyIcon />;
      case 'satisfaction':
        return <TrendingUpIcon />;
      default:
        return <AssignmentIcon />;
    }
  };

  // Handle strategy selection
  const handleStrategySelect = (strategy: MitigationStrategy) => {
    setSelectedStrategy(strategy);
    setStrategyDialog(true);
  };

  // Handle action completion
  const handleActionComplete = (strategyIndex: number, actionIndex: number) => {
    const actionKey = `${strategyIndex}-${actionIndex}`;
    setCompletedActions(prev => new Set([...prev, actionKey]));

    // Simulate progress update
    setActionProgress(prev => ({
      ...prev,
      [actionKey]: 100
    }));

    // Notify parent component
    setTimeout(() => {
      onActionTaken();
    }, 500);
  };

  // Handle action start
  const handleActionStart = (strategyIndex: number, actionIndex: number) => {
    const actionKey = `${strategyIndex}-${actionIndex}`;
    setActionProgress(prev => ({
      ...prev,
      [actionKey]: 25 // Start with 25% progress
    }));
  };

  // Calculate strategy completion percentage
  const getStrategyCompletion = (strategy: MitigationStrategy, strategyIndex: number) => {
    const totalActions = strategy.actions.length;
    const completedActions = strategy.actions.filter((_, actionIndex) => {
      const actionKey = `${strategyIndex}-${actionIndex}`;
      return completedActions.has(actionKey);
    }).length;

    return totalActions > 0 ? (completedActions / totalActions) * 100 : 0;
  };

  // Sort strategies by priority
  const sortedStrategies = [...mitigationStrategies].sort((a, b) => {
    const priorityOrder = { immediate: 0, urgent: 1, high: 2, medium: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  if (mitigationStrategies.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <AssignmentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Mitigation Strategies Available
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Run a risk assessment to generate mitigation strategies for identified risks.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Strategy Overview */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error">
                {mitigationStrategies.filter(s => s.priority === 'immediate').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Immediate Actions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: '#f57c00' }}>
                {mitigationStrategies.filter(s => s.priority === 'urgent').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Urgent Actions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: '#fbc02d' }}>
                {mitigationStrategies.filter(s => s.priority === 'high').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                High Priority
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: '#388e3c' }}>
                {mitigationStrategies.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Strategies
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Critical Actions Alert */}
      {mitigationStrategies.some(s => s.priority === 'immediate') && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Immediate Action Required</AlertTitle>
          {mitigationStrategies.filter(s => s.priority === 'immediate').length} critical mitigation strategies require immediate attention.
        </Alert>
      )}

      {/* Mitigation Strategies List */}
      <Box>
        {sortedStrategies.map((strategy, strategyIndex) => {
          const config = getPriorityConfig(strategy.priority);
          const completionPercentage = getStrategyCompletion(strategy, strategyIndex);

          return (
            <Accordion key={strategyIndex} sx={{ mb: 2 }}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  backgroundColor: config.bgColor,
                  '&:hover': {
                    backgroundColor: config.bgColor,
                    opacity: 0.9
                  }
                }}
              >
                <Box display="flex" alignItems="center" width="100%" gap={2}>
                  {getCategoryIcon(strategy.category)}
                  <Box flex={1}>
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                      <Typography variant="h6">
                        {strategy.category.charAt(0).toUpperCase() + strategy.category.slice(1)} Risk Mitigation
                      </Typography>
                      <Chip
                        label={config.label}
                        size="small"
                        sx={{
                          backgroundColor: config.color,
                          color: 'white',
                          fontSize: '0.7rem'
                        }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Risk Score: {strategy.riskScore.toFixed(1)} •
                      Cost: {strategy.estimatedCost} •
                      Timeline: {strategy.timeline}
                    </Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="body2" color="text.secondary">
                      {completionPercentage.toFixed(0)}% Complete
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={completionPercentage}
                      sx={{
                        width: 100,
                        height: 6,
                        borderRadius: 3,
                        mt: 0.5
                      }}
                    />
                  </Box>
                </Box>
              </AccordionSummary>

              <AccordionDetails>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Recommended Actions
                  </Typography>

                  <List>
                    {strategy.actions.map((action, actionIndex) => {
                      const actionKey = `${strategyIndex}-${actionIndex}`;
                      const isCompleted = completedActions.has(actionKey);
                      const progress = actionProgress[actionKey] || 0;

                      return (
                        <ListItem key={actionIndex} sx={{ px: 0 }}>
                          <ListItemIcon>
                            {isCompleted ? (
                              <CheckCircleIcon sx={{ color: '#388e3c' }} />
                            ) : (
                              <AssignmentIcon />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={action}
                            secondary={
                              progress > 0 && progress < 100 ? (
                                <Box sx={{ mt: 1 }}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={progress}
                                    sx={{ height: 4, borderRadius: 2 }}
                                  />
                                  <Typography variant="caption" color="text.secondary">
                                    {progress}% complete
                                  </Typography>
                                </Box>
                              ) : null
                            }
                          />
                          <ListItemSecondaryAction>
                            {!isCompleted ? (
                              <Box display="flex" gap={1}>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<PlayArrowIcon />}
                                  onClick={() => handleActionStart(strategyIndex, actionIndex)}
                                >
                                  Start
                                </Button>
                                <Button
                                  size="small"
                                  variant="contained"
                                  startIcon={<CheckCircleIcon />}
                                  onClick={() => handleActionComplete(strategyIndex, actionIndex)}
                                >
                                  Complete
                                </Button>
                              </Box>
                            ) : (
                              <Chip
                                label="Completed"
                                size="small"
                                color="success"
                                icon={<CheckCircleIcon />}
                              />
                            )}
                          </ListItemSecondaryAction>
                        </ListItem>
                      );
                    })}
                  </List>

                  <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Estimated Cost: {strategy.estimatedCost}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Timeline: {strategy.timeline}
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      onClick={() => handleStrategySelect(strategy)}
                    >
                      View Details
                    </Button>
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>

      {/* Strategy Detail Dialog */}
      <Dialog
        open={strategyDialog}
        onClose={() => setStrategyDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedStrategy && (
            <Box display="flex" alignItems="center" gap={1}>
              {getCategoryIcon(selectedStrategy.category)}
              <Typography variant="h6">
                {selectedStrategy.category.charAt(0).toUpperCase() + selectedStrategy.category.slice(1)} Risk Mitigation Strategy
              </Typography>
            </Box>
          )}
        </DialogTitle>
        <DialogContent>
          {selectedStrategy && (
            <Box>
              <Grid container spacing={2} mb={3}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Risk Score</Typography>
                  <Typography variant="h5" sx={{ color: getPriorityConfig(selectedStrategy.priority).color }}>
                    {selectedStrategy.riskScore.toFixed(1)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Priority</Typography>
                  <Chip
                    label={getPriorityConfig(selectedStrategy.priority).label}
                    sx={{
                      backgroundColor: getPriorityConfig(selectedStrategy.priority).color,
                      color: 'white'
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Estimated Cost</Typography>
                  <Typography variant="body1">{selectedStrategy.estimatedCost}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Timeline</Typography>
                  <Typography variant="body1">{selectedStrategy.timeline}</Typography>
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom>
                Detailed Action Plan
              </Typography>

              <Stepper orientation="vertical">
                {selectedStrategy.actions.map((action, index) => {
                  const actionKey = `${sortedStrategies.findIndex(s => s === selectedStrategy)}-${index}`;
                  const isCompleted = completedActions.has(actionKey);
                  const progress = actionProgress[actionKey] || 0;

                  return (
                    <Step key={index} active={true} completed={isCompleted}>
                      <StepLabel
                        StepIconComponent={() =>
                          isCompleted ? (
                            <CheckCircleIcon sx={{ color: '#388e3c' }} />
                          ) : (
                            <AssignmentIcon />
                          )
                        }
                      >
                        {action}
                      </StepLabel>
                      <StepContent>
                        <Box>
                          {progress > 0 && progress < 100 && (
                            <Box mb={1}>
                              <LinearProgress
                                variant="determinate"
                                value={progress}
                                sx={{ height: 6, borderRadius: 3 }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                Progress: {progress}%
                              </Typography>
                            </Box>
                          )}

                          <Box display="flex" gap={1}>
                            {!isCompleted && (
                              <>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<PlayArrowIcon />}
                                  onClick={() => handleActionStart(
                                    sortedStrategies.findIndex(s => s === selectedStrategy),
                                    index
                                  )}
                                >
                                  Start Action
                                </Button>
                                <Button
                                  size="small"
                                  variant="contained"
                                  startIcon={<CheckCircleIcon />}
                                  onClick={() => handleActionComplete(
                                    sortedStrategies.findIndex(s => s === selectedStrategy),
                                    index
                                  )}
                                >
                                  Mark Complete
                                </Button>
                              </>
                            )}
                            {isCompleted && (
                              <Chip
                                label="Action Completed"
                                color="success"
                                icon={<CheckCircleIcon />}
                              />
                            )}
                          </Box>
                        </Box>
                      </StepContent>
                    </Step>
                  );
                })}
              </Stepper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStrategyDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};