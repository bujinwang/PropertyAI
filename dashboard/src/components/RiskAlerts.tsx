import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  AlertTitle,
  Collapse,
  Divider,
  Badge
} from '@mui/material';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  NotificationsActive as NotificationsActiveIcon,
  NotificationsOff as NotificationsOffIcon
} from '@mui/icons-material';

interface RiskAlert {
  id: string;
  entityType: 'property' | 'tenant';
  entityId: string;
  entityName: string;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  riskScore: number;
  alertType: string;
  message: string;
  description: string;
  mitigationSteps: string[];
  priority: 'immediate' | 'urgent' | 'high' | 'medium';
  status: 'active' | 'acknowledged' | 'resolved';
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  assignedTo?: string;
  dueDate?: string;
}

interface PortfolioRisk {
  overallScore: number;
  riskLevel: string;
  confidence: number;
  criticalCount: number;
  highCount: number;
  riskFactors: any;
  mitigationStrategies: any[];
  dataQuality: number;
}

interface RiskAlertsProps {
  portfolioRisk: PortfolioRisk | null;
  onRefresh: () => void;
}

export const RiskAlerts: React.FC<RiskAlertsProps> = ({
  portfolioRisk,
  onRefresh
}) => {
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<RiskAlert | null>(null);
  const [alertDialog, setAlertDialog] = useState(false);
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'active'>('active');

  // Generate mock alerts based on portfolio risk
  const generateMockAlerts = (): RiskAlert[] => {
    const mockAlerts: RiskAlert[] = [];

    if (portfolioRisk) {
      // Critical alerts
      if (portfolioRisk.criticalCount > 0) {
        for (let i = 0; i < Math.min(portfolioRisk.criticalCount, 3); i++) {
          mockAlerts.push({
            id: `critical-${i + 1}`,
            entityType: Math.random() > 0.5 ? 'property' : 'tenant',
            entityId: `entity-${i + 1}`,
            entityName: `Property/Tenant ${i + 1}`,
            riskLevel: 'critical',
            riskScore: 4.5 + Math.random() * 0.4,
            alertType: 'maintenance_critical',
            message: 'Critical maintenance issue requires immediate attention',
            description: 'Equipment failure detected that could lead to significant property damage or safety hazard.',
            mitigationSteps: [
              'Schedule emergency maintenance inspection within 24 hours',
              'Implement temporary safety measures',
              'Contact specialized repair service',
              'Monitor situation continuously until resolved'
            ],
            priority: 'immediate',
            status: 'active',
            createdAt: new Date(Date.now() - Math.random() * 86400000).toISOString(),
            dueDate: new Date(Date.now() + 86400000).toISOString() // 24 hours from now
          });
        }
      }

      // High alerts
      if (portfolioRisk.highCount > 0) {
        for (let i = 0; i < Math.min(portfolioRisk.highCount, 5); i++) {
          mockAlerts.push({
            id: `high-${i + 1}`,
            entityType: Math.random() > 0.5 ? 'property' : 'tenant',
            entityId: `entity-high-${i + 1}`,
            entityName: `Property/Tenant High-${i + 1}`,
            riskLevel: 'high',
            riskScore: 3.5 + Math.random() * 0.4,
            alertType: 'churn_high',
            message: 'High churn risk detected',
            description: 'Tenant showing multiple indicators of potential lease termination.',
            mitigationSteps: [
              'Schedule tenant meeting to discuss concerns',
              'Review lease terms and incentives',
              'Implement retention program',
              'Monitor situation weekly'
            ],
            priority: 'urgent',
            status: 'active',
            createdAt: new Date(Date.now() - Math.random() * 172800000).toISOString(),
            dueDate: new Date(Date.now() + 172800000).toISOString() // 2 days from now
          });
        }
      }
    }

    // Add some resolved alerts for history
    for (let i = 0; i < 3; i++) {
      mockAlerts.push({
        id: `resolved-${i + 1}`,
        entityType: Math.random() > 0.5 ? 'property' : 'tenant',
        entityId: `entity-resolved-${i + 1}`,
        entityName: `Property/Tenant Resolved-${i + 1}`,
        riskLevel: Math.random() > 0.5 ? 'high' : 'medium',
        riskScore: 2.5 + Math.random() * 1.5,
        alertType: 'maintenance_resolved',
        message: 'Maintenance issue resolved',
        description: 'Previously critical maintenance issue has been successfully resolved.',
        mitigationSteps: [
          'Issue was resolved through scheduled maintenance',
          'Implemented preventive maintenance schedule',
          'Added monitoring for similar issues'
        ],
        priority: 'high',
        status: 'resolved',
        createdAt: new Date(Date.now() - Math.random() * 604800000).toISOString(),
        resolvedAt: new Date(Date.now() - Math.random() * 86400000).toISOString()
      });
    }

    return mockAlerts.sort((a, b) => {
      // Sort by priority and creation date
      const priorityOrder = { immediate: 0, urgent: 1, high: 2, medium: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  // Load alerts
  useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const mockAlerts = generateMockAlerts();
      setAlerts(mockAlerts);
      setLoading(false);
    }, 1000);
  }, [portfolioRisk]);

  // Filter alerts
  const filteredAlerts = alerts.filter(alert => {
    switch (filter) {
      case 'critical':
        return alert.riskLevel === 'critical';
      case 'high':
        return alert.riskLevel === 'high';
      case 'active':
        return alert.status === 'active';
      default:
        return true;
    }
  });

  // Get alert icon
  const getAlertIcon = (level: string) => {
    switch (level) {
      case 'critical':
        return <ErrorIcon sx={{ color: '#d32f2f' }} />;
      case 'high':
        return <WarningIcon sx={{ color: '#f57c00' }} />;
      case 'medium':
        return <WarningIcon sx={{ color: '#fbc02d' }} />;
      case 'low':
        return <InfoIcon sx={{ color: '#388e3c' }} />;
      default:
        return <InfoIcon />;
    }
  };

  // Get entity icon
  const getEntityIcon = (type: string) => {
    return type === 'property' ? <BusinessIcon /> : <PersonIcon />;
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'immediate':
        return '#d32f2f';
      case 'urgent':
        return '#f57c00';
      case 'high':
        return '#fbc02d';
      case 'medium':
        return '#388e3c';
      default:
        return '#757575';
    }
  };

  // Handle alert expansion
  const handleAlertExpansion = (alertId: string) => {
    const newExpanded = new Set(expandedAlerts);
    if (newExpanded.has(alertId)) {
      newExpanded.delete(alertId);
    } else {
      newExpanded.add(alertId);
    }
    setExpandedAlerts(newExpanded);
  };

  // Handle alert acknowledgment
  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts(prevAlerts =>
      prevAlerts.map(alert =>
        alert.id === alertId
          ? { ...alert, status: 'acknowledged', acknowledgedAt: new Date().toISOString() }
          : alert
      )
    );
  };

  // Handle alert resolution
  const handleResolveAlert = (alertId: string) => {
    setAlerts(prevAlerts =>
      prevAlerts.map(alert =>
        alert.id === alertId
          ? { ...alert, status: 'resolved', resolvedAt: new Date().toISOString() }
          : alert
      )
    );
  };

  // Handle alert dialog
  const handleAlertDialog = (alert: RiskAlert | null) => {
    setSelectedAlert(alert);
    setAlertDialog(!!alert);
  };

  // Alert statistics
  const alertStats = {
    total: alerts.length,
    active: alerts.filter(a => a.status === 'active').length,
    critical: alerts.filter(a => a.riskLevel === 'critical').length,
    high: alerts.filter(a => a.riskLevel === 'high').length,
    resolved: alerts.filter(a => a.status === 'resolved').length
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography variant="body1">Loading risk alerts...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Alert Statistics */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error">
                {alertStats.critical}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Critical
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: '#f57c00' }}>
                {alertStats.high}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                High Priority
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: '#1976d2' }}>
                {alertStats.active}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: '#388e3c' }}>
                {alertStats.resolved}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Resolved
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" gap={1} flexWrap="wrap">
          <Chip
            label={`All (${alerts.length})`}
            onClick={() => setFilter('all')}
            variant={filter === 'all' ? 'filled' : 'outlined'}
          />
          <Chip
            label={`Active (${alertStats.active})`}
            onClick={() => setFilter('active')}
            variant={filter === 'active' ? 'filled' : 'outlined'}
            color="primary"
          />
          <Chip
            label={`Critical (${alertStats.critical})`}
            onClick={() => setFilter('critical')}
            variant={filter === 'critical' ? 'filled' : 'outlined'}
            color="error"
          />
          <Chip
            label={`High (${alertStats.high})`}
            onClick={() => setFilter('high')}
            variant={filter === 'high' ? 'filled' : 'outlined'}
            sx={{ backgroundColor: filter === 'high' ? '#f57c00' : 'transparent' }}
          />
        </Box>
      </Paper>

      {/* Alerts List */}
      <Paper sx={{ mb: 3 }}>
        <List>
          {filteredAlerts.map((alert, index) => (
            <React.Fragment key={alert.id}>
              <ListItem
                sx={{
                  backgroundColor: alert.status === 'resolved' ? '#f5f5f5' : 'transparent',
                  opacity: alert.status === 'resolved' ? 0.7 : 1
                }}
              >
                <ListItemIcon>
                  <Badge
                    color={alert.status === 'active' ? 'error' : 'default'}
                    variant="dot"
                    invisible={alert.status !== 'active'}
                  >
                    {getAlertIcon(alert.riskLevel)}
                  </Badge>
                </ListItemIcon>

                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="subtitle1">
                        {alert.message}
                      </Typography>
                      <Chip
                        label={alert.priority.toUpperCase()}
                        size="small"
                        sx={{
                          backgroundColor: getPriorityColor(alert.priority),
                          color: 'white',
                          fontSize: '0.7rem'
                        }}
                      />
                      {alert.status !== 'active' && (
                        <Chip
                          label={alert.status.toUpperCase()}
                          size="small"
                          color={alert.status === 'resolved' ? 'success' : 'warning'}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {getEntityIcon(alert.entityType)} {alert.entityName} •
                        Risk Score: {alert.riskScore.toFixed(1)} •
                        Created: {new Date(alert.createdAt).toLocaleDateString()}
                        {alert.dueDate && ` • Due: ${new Date(alert.dueDate).toLocaleDateString()}`}
                      </Typography>
                    </Box>
                  }
                />

                <ListItemSecondaryAction>
                  <Box display="flex" gap={1}>
                    {alert.status === 'active' && (
                      <>
                        <IconButton
                          size="small"
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                          title="Acknowledge Alert"
                        >
                          <CheckCircleIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleResolveAlert(alert.id)}
                          title="Mark as Resolved"
                        >
                          <NotificationsOffIcon />
                        </IconButton>
                      </>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => handleAlertExpansion(alert.id)}
                      title="View Details"
                    >
                      {expandedAlerts.has(alert.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>

              <Collapse in={expandedAlerts.has(alert.id)}>
                <Box sx={{ px: 3, pb: 2 }}>
                  <Typography variant="body2" paragraph>
                    {alert.description}
                  </Typography>

                  <Typography variant="subtitle2" gutterBottom>
                    Recommended Actions:
                  </Typography>
                  <List dense>
                    {alert.mitigationSteps.map((step, stepIndex) => (
                      <ListItem key={stepIndex}>
                        <ListItemText primary={`${stepIndex + 1}. ${step}`} />
                      </ListItem>
                    ))}
                  </List>

                  <Box display="flex" gap={1} mt={2}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleAlertDialog(alert)}
                    >
                      View Full Details
                    </Button>
                    {alert.status === 'active' && (
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        onClick={() => handleResolveAlert(alert.id)}
                      >
                        Mark Resolved
                      </Button>
                    )}
                  </Box>
                </Box>
              </Collapse>

              {index < filteredAlerts.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>

        {filteredAlerts.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <NotificationsActiveIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No alerts found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {filter === 'all' ? 'No risk alerts have been generated yet.' : `No ${filter} alerts found.`}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Alert Detail Dialog */}
      <Dialog
        open={alertDialog}
        onClose={() => handleAlertDialog(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedAlert && (
            <Box display="flex" alignItems="center" gap={1}>
              {getAlertIcon(selectedAlert.riskLevel)}
              <Typography variant="h6">
                {selectedAlert.message}
              </Typography>
            </Box>
          )}
        </DialogTitle>
        <DialogContent>
          {selectedAlert && (
            <Box>
              <Grid container spacing={2} mb={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Entity</Typography>
                  <Typography variant="body2">
                    {getEntityIcon(selectedAlert.entityType)} {selectedAlert.entityName}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Risk Level</Typography>
                  <Chip
                    label={selectedAlert.riskLevel.toUpperCase()}
                    size="small"
                    sx={{
                      backgroundColor: getPriorityColor(selectedAlert.priority),
                      color: 'white'
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Risk Score</Typography>
                  <Typography variant="body2">{selectedAlert.riskScore.toFixed(1)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Created</Typography>
                  <Typography variant="body2">
                    {new Date(selectedAlert.createdAt).toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>

              <Typography variant="body1" paragraph>
                {selectedAlert.description}
              </Typography>

              <Typography variant="h6" gutterBottom>
                Mitigation Steps
              </Typography>
              <List>
                {selectedAlert.mitigationSteps.map((step, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={`${index + 1}. ${step}`} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleAlertDialog(null)}>Close</Button>
          {selectedAlert?.status === 'active' && (
            <Button
              variant="contained"
              onClick={() => {
                handleResolveAlert(selectedAlert.id);
                handleAlertDialog(null);
              }}
            >
              Mark as Resolved
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};