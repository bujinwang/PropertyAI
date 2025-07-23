import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Chip,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  LinearProgress,
  Divider,
  Stack,
  Alert,
  IconButton,
  Tooltip,
  Card,
  CardContent
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { EmergencyAlert, ResponseProtocol, ResponseStep } from '../../types/emergency-response';
import { emergencyResponseService } from '../../services/emergencyResponseService';
import { formatDistanceToNow } from 'date-fns';

interface AlertDetailViewProps {
  alert: EmergencyAlert | null;
  open: boolean;
  onClose: () => void;
  onStatusUpdate?: (alertId: string, status: EmergencyAlert['status']) => void;
}

const PRIORITY_COLORS = {
  critical: '#d32f2f',
  high: '#f57c00',
  medium: '#fbc02d',
  low: '#388e3c'
};

const STATUS_COLORS = {
  active: '#d32f2f',
  acknowledged: '#f57c00',
  in_progress: '#1976d2',
  resolved: '#388e3c'
};

export const AlertDetailView: React.FC<AlertDetailViewProps> = ({
  alert,
  open,
  onClose,
  onStatusUpdate
}) => {
  const [protocol, setProtocol] = useState<ResponseProtocol | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (alert?.responseProtocol) {
      setProtocol(alert.responseProtocol);
    }
  }, [alert]);

  const handleStepToggle = async (stepId: string, completed: boolean) => {
    if (!protocol || !alert) return;

    try {
      await emergencyResponseService.updateResponseStep(protocol.id, stepId, completed);
      
      // Update local state
      setProtocol(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          steps: prev.steps.map(step =>
            step.id === stepId
              ? {
                  ...step,
                  completed,
                  completedBy: completed ? {
                    id: 'current-user', // This would come from auth context
                    name: 'Current User',
                    timestamp: new Date()
                  } : undefined
                }
              : step
          )
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update step');
    }
  };

  const handleStatusChange = async (newStatus: EmergencyAlert['status']) => {
    if (!alert) return;

    try {
      setLoading(true);
      await emergencyResponseService.updateAlertStatus(alert.id, newStatus);
      onStatusUpdate?.(alert.id, newStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const getCompletedSteps = () => {
    if (!protocol) return 0;
    return protocol.steps.filter(step => step.completed).length;
  };

  const getProgressPercentage = () => {
    if (!protocol || protocol.steps.length === 0) return 0;
    return (getCompletedSteps() / protocol.steps.length) * 100;
  };

  const canCompleteStep = (step: ResponseStep) => {
    if (!protocol) return false;
    
    // Check if all dependencies are completed
    if (step.dependencies && step.dependencies.length > 0) {
      return step.dependencies.every(depId =>
        protocol.steps.find(s => s.id === depId)?.completed
      );
    }
    
    return true;
  };

  if (!alert) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h6">
              {alert.title}
            </Typography>
            <Chip
              label={alert.priority.toUpperCase()}
              size="small"
              sx={{
                backgroundColor: PRIORITY_COLORS[alert.priority],
                color: 'white',
                fontWeight: 'bold'
              }}
            />
            <Chip
              label={alert.status.replace('_', ' ').toUpperCase()}
              size="small"
              variant="outlined"
              sx={{
                borderColor: STATUS_COLORS[alert.status],
                color: STATUS_COLORS[alert.status],
                fontWeight: 'bold'
              }}
            />
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Alert Details */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Alert Details
            </Typography>
            
            <Typography variant="body1" paragraph>
              {alert.description}
            </Typography>

            <Stack spacing={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <LocationIcon color="action" />
                <Typography variant="body2">
                  {alert.location.propertyName}
                  {alert.location.unitNumber && ` - Unit ${alert.location.unitNumber}`}
                </Typography>
              </Box>

              <Box display="flex" alignItems="center" gap={1}>
                <TimeIcon color="action" />
                <Typography variant="body2">
                  Reported {formatDistanceToNow(alert.timestamp, { addSuffix: true })}
                </Typography>
              </Box>

              <Box display="flex" alignItems="center" gap={1}>
                <PersonIcon color="action" />
                <Typography variant="body2">
                  Reported by: {alert.reportedBy.name} ({alert.reportedBy.role})
                </Typography>
              </Box>

              {alert.assignedTo && (
                <Box display="flex" alignItems="center" gap={1}>
                  <PersonIcon color="action" />
                  <Typography variant="body2">
                    Assigned to: {alert.assignedTo.name} ({alert.assignedTo.role})
                  </Typography>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* Response Protocol */}
        {protocol && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Response Protocol: {protocol.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {getCompletedSteps()} of {protocol.steps.length} steps completed
                </Typography>
              </Box>

              <LinearProgress
                variant="determinate"
                value={getProgressPercentage()}
                sx={{ mb: 2, height: 8, borderRadius: 4 }}
              />

              <List>
                {protocol.steps
                  .sort((a, b) => a.order - b.order)
                  .map((step, index) => (
                    <React.Fragment key={step.id}>
                      <ListItem
                        sx={{
                          opacity: canCompleteStep(step) ? 1 : 0.6,
                          backgroundColor: step.completed ? 'action.selected' : 'transparent'
                        }}
                      >
                        <ListItemIcon>
                          <Tooltip title={canCompleteStep(step) ? 'Click to toggle completion' : 'Complete dependencies first'}>
                            <Checkbox
                              checked={step.completed}
                              onChange={(e) => handleStepToggle(step.id, e.target.checked)}
                              disabled={!canCompleteStep(step)}
                              icon={<UncheckedIcon />}
                              checkedIcon={<CheckCircleIcon />}
                            />
                          </Tooltip>
                        </ListItemIcon>
                        
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  textDecoration: step.completed ? 'line-through' : 'none'
                                }}
                              >
                                {step.title}
                              </Typography>
                              {step.required && (
                                <Chip
                                  label="Required"
                                  size="small"
                                  color="warning"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {step.description}
                              </Typography>
                              {step.completedBy && (
                                <Typography variant="caption" color="success.main">
                                  Completed by {step.completedBy.name} at{' '}
                                  {step.completedBy.timestamp.toLocaleString()}
                                </Typography>
                              )}
                              <Typography variant="caption" color="text.secondary" display="block">
                                Estimated duration: {step.estimatedDuration} minutes
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < protocol.steps.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
              </List>
            </CardContent>
          </Card>
        )}

        {/* Recent Updates */}
        {alert.updates.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Updates
              </Typography>
              
              <List>
                {alert.updates
                  .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                  .slice(0, 5)
                  .map((update, index) => (
                    <React.Fragment key={update.id}>
                      <ListItem>
                        <ListItemText
                          primary={update.message}
                          secondary={
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                {formatDistanceToNow(update.timestamp, { addSuffix: true })} by{' '}
                                {update.updatedBy.name}
                              </Typography>
                              {update.status && (
                                <Chip
                                  label={update.status.replace('_', ' ').toUpperCase()}
                                  size="small"
                                  variant="outlined"
                                  sx={{ ml: 1 }}
                                />
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < Math.min(alert.updates.length, 5) - 1 && <Divider />}
                    </React.Fragment>
                  ))}
              </List>
            </CardContent>
          </Card>
        )}
      </DialogContent>

      <DialogActions>
        <Stack direction="row" spacing={1}>
          {alert.status === 'active' && (
            <Button
              variant="outlined"
              onClick={() => handleStatusChange('acknowledged')}
              disabled={loading}
            >
              Acknowledge
            </Button>
          )}
          
          {['active', 'acknowledged'].includes(alert.status) && (
            <Button
              variant="contained"
              onClick={() => handleStatusChange('in_progress')}
              disabled={loading}
            >
              Start Response
            </Button>
          )}
          
          {alert.status === 'in_progress' && (
            <Button
              variant="contained"
              color="success"
              onClick={() => handleStatusChange('resolved')}
              disabled={loading}
            >
              Mark Resolved
            </Button>
          )}
          
          <Button onClick={onClose}>
            Close
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default AlertDetailView;