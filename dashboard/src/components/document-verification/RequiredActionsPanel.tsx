import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  IconButton,
  Checkbox,
  Collapse,
  Alert,
  Badge,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  Assignment,
  ExpandMore,
  ExpandLess,
  Schedule,
  CheckCircle,
  Error as ErrorIcon,
  PriorityHigh,
  Flag,
  SmartToy
} from '@mui/icons-material';
import { RequiredAction, ActionPriority } from '../../types/document-verification';
import AIGeneratedContent from '../../design-system/components/ai/AIGeneratedContent';
import ConfidenceIndicator from '../../design-system/components/ai/ConfidenceIndicator';
import { updateRequiredAction } from '../../services/documentVerificationService';

interface RequiredActionsPanelProps {
  actions: RequiredAction[];
  onActionUpdate?: (actionId: string, completed: boolean) => void;
}

const RequiredActionsPanel: React.FC<RequiredActionsPanelProps> = ({
  actions,
  onActionUpdate
}) => {
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set());
  const [updatingActions, setUpdatingActions] = useState<Set<string>>(new Set());

  const getPriorityColor = (priority: ActionPriority) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const getPriorityIcon = (priority: ActionPriority) => {
    switch (priority) {
      case 'critical': return (
        <Tooltip title="Critical Priority - Immediate Action Required">
          <Badge badgeContent="!" color="error">
            <ErrorIcon color="error" />
          </Badge>
        </Tooltip>
      );
      case 'high': return (
        <Tooltip title="High Priority - Action Required Soon">
          <PriorityHigh color="warning" />
        </Tooltip>
      );
      case 'medium': return (
        <Tooltip title="Medium Priority - Standard Timeline">
          <Flag color="info" />
        </Tooltip>
      );
      case 'low': return (
        <Tooltip title="Low Priority - Can Be Completed Later">
          <Schedule color="action" />
        </Tooltip>
      );
      default: return <Assignment />;
    }
  };

  const handleToggleExpand = useCallback((actionId: string) => {
    setExpandedActions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(actionId)) {
        newSet.delete(actionId);
      } else {
        newSet.add(actionId);
      }
      return newSet;
    });
  }, []);

  const handleActionToggle = useCallback(async (actionId: string, completed: boolean) => {
    setUpdatingActions(prev => new Set(prev).add(actionId));
    
    try {
      await updateRequiredAction(actionId, completed);
      onActionUpdate?.(actionId, completed);
    } catch (error) {
      console.error('Failed to update action:', error);
    } finally {
      setUpdatingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(actionId);
        return newSet;
      });
    }
  }, [onActionUpdate]);

  const formatDueDate = (date: Date) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else {
      return `Due in ${diffDays} days`;
    }
  };

  const pendingActions = actions.filter(action => !action.completed);
  const completedActions = actions.filter(action => action.completed);
  const criticalActions = pendingActions.filter(action => action.priority === 'critical');
  const highPriorityActions = pendingActions.filter(action => action.priority === 'high');
  const aiGeneratedActions = pendingActions.filter(action => action.aiGenerated);
  
  const completionPercentage = actions.length > 0 ? (completedActions.length / actions.length) * 100 : 0;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Assignment sx={{ mr: 1 }} />
          <Typography variant="h6" component="h2">
            Required Actions
          </Typography>
          <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
            {criticalActions.length > 0 && (
              <Chip 
                label={`${criticalActions.length} critical`}
                size="small"
                color="error"
                icon={<ErrorIcon />}
              />
            )}
            {highPriorityActions.length > 0 && (
              <Chip 
                label={`${highPriorityActions.length} high priority`}
                size="small"
                color="warning"
                icon={<PriorityHigh />}
              />
            )}
            <Chip 
              label={`${pendingActions.length} pending`}
              size="small"
              color={pendingActions.length > 0 ? 'warning' : 'success'}
            />
            {aiGeneratedActions.length > 0 && (
              <Chip 
                label={`${aiGeneratedActions.length} AI-suggested`}
                size="small"
                color="primary"
                icon={<SmartToy />}
              />
            )}
          </Box>
        </Box>

        {/* Progress Bar */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Overall Progress
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {Math.round(completionPercentage)}% Complete
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={completionPercentage}
            sx={{ 
              height: 8, 
              borderRadius: 4,
              backgroundColor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4
              }
            }}
          />
        </Box>

        {pendingActions.length === 0 && (
          <Alert severity="success" sx={{ mb: 2 }}>
            All required actions have been completed!
          </Alert>
        )}

        <List>
          {/* Pending Actions */}
          {pendingActions.map((action) => {
            const isExpanded = expandedActions.has(action.id);
            const isUpdating = updatingActions.has(action.id);
            const isOverdue = action.dueDate && action.dueDate < new Date();

            const actionContent = (
              <ListItem
                key={action.id}
                sx={{
                  border: '1px solid',
                  borderColor: isOverdue ? 'error.main' : 'divider',
                  borderRadius: 1,
                  mb: 1,
                  backgroundColor: isOverdue ? 'error.light' : 'background.paper',
                  '&:hover': {
                    backgroundColor: isOverdue ? 'error.light' : 'action.hover'
                  }
                }}
              >
                <ListItemIcon>
                  <Checkbox
                    checked={action.completed}
                    onChange={(e) => handleActionToggle(action.id, e.target.checked)}
                    disabled={isUpdating}
                  />
                </ListItemIcon>
                
                <ListItemIcon>
                  {getPriorityIcon(action.priority)}
                </ListItemIcon>

                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography 
                        variant="body1"
                        sx={{ 
                          fontWeight: action.priority === 'critical' ? 'bold' : 'normal',
                          color: action.priority === 'critical' ? 'error.main' : 'text.primary'
                        }}
                      >
                        {action.description}
                      </Typography>
                      <Chip
                        label={action.priority.toUpperCase()}
                        size="small"
                        color={getPriorityColor(action.priority)}
                        variant={action.priority === 'critical' ? 'filled' : 'outlined'}
                        sx={{ 
                          fontWeight: action.priority === 'critical' ? 'bold' : 'normal',
                          animation: action.priority === 'critical' ? 'pulse 2s infinite' : 'none',
                          '@keyframes pulse': {
                            '0%': { opacity: 1 },
                            '50%': { opacity: 0.7 },
                            '100%': { opacity: 1 }
                          }
                        }}
                      />
                      {action.aiGenerated && (
                        <Tooltip title="This action was suggested by AI analysis">
                          <Chip
                            label="AI-Generated"
                            size="small"
                            color="primary"
                            variant="outlined"
                            icon={<SmartToy />}
                          />
                        </Tooltip>
                      )}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      {action.dueDate && (
                        <Typography 
                          variant="caption" 
                          color={isOverdue ? 'error' : 'text.secondary'}
                          sx={{ display: 'block' }}
                        >
                          {formatDueDate(action.dueDate)}
                        </Typography>
                      )}
                      {action.confidence && (
                        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            AI Confidence:
                          </Typography>
                          <ConfidenceIndicator
                            confidence={action.confidence}
                            size="small"
                            showTooltip={true}
                            explanation={action.explanation || `AI is ${action.confidence}% confident in this recommendation`}
                          />
                          <Typography variant="caption" color="text.secondary">
                            ({action.confidence}%)
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  }
                />

                {action.explanation && (
                  <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
                    <IconButton
                      onClick={() => handleToggleExpand(action.id)}
                      size="small"
                    >
                      {isExpanded ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </Box>
                )}
              </ListItem>
            );

            if (action.aiGenerated && action.explanation) {
              return (
                <Box key={action.id}>
                  <AIGeneratedContent
                    confidence={action.confidence}
                    explanation={action.explanation}
                    variant="outlined"
                  >
                    {actionContent}
                  </AIGeneratedContent>
                  
                  <Collapse in={isExpanded}>
                    <Box sx={{ ml: 4, mr: 2, mb: 2, p: 2, backgroundColor: 'background.default', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>AI Analysis:</strong> {action.explanation}
                      </Typography>
                    </Box>
                  </Collapse>
                </Box>
              );
            }

            return (
              <Box key={action.id}>
                {actionContent}
                {action.explanation && (
                  <Collapse in={isExpanded}>
                    <Box sx={{ ml: 4, mr: 2, mb: 2, p: 2, backgroundColor: 'background.default', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {action.explanation}
                      </Typography>
                    </Box>
                  </Collapse>
                )}
              </Box>
            );
          })}

          {/* Completed Actions */}
          {completedActions.length > 0 && (
            <>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
                Completed Actions ({completedActions.length})
              </Typography>
              {completedActions.map((action) => (
                <ListItem
                  key={action.id}
                  sx={{
                    border: '1px solid',
                    borderColor: 'success.main',
                    borderRadius: 1,
                    mb: 1,
                    backgroundColor: 'success.light',
                    opacity: 0.7
                  }}
                >
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Typography variant="body1" sx={{ textDecoration: 'line-through' }}>
                        {action.description}
                      </Typography>
                    }
                    secondary={
                      <Chip
                        label="Completed"
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    }
                  />
                </ListItem>
              ))}
            </>
          )}
        </List>
      </CardContent>
    </Card>
  );
};

export default RequiredActionsPanel;