import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
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
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  Grid,
  Paper,
  Avatar,
  Badge,
  Divider,
} from '@mui/material';
import {
  Warning,
  Error,
  Info,
  CheckCircle,
  Notifications,
  NotificationsOff,
  Settings,
  Delete,
  MarkAsRead,
  Snooze,
  PriorityHigh,
} from '@mui/icons-material';
import { apiService } from '../services/apiService';

interface Alert {
  id: string;
  type: 'maintenance' | 'financial' | 'tenant' | 'anomaly' | 'system';
  title: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  status: 'new' | 'read' | 'dismissed' | 'snoozed';
  timestamp: string;
  source: string;
  metadata?: any;
  actions?: AlertAction[];
}

interface AlertAction {
  id: string;
  label: string;
  action: string;
  primary?: boolean;
}

interface AlertSettings {
  maintenanceAlerts: boolean;
  financialAlerts: boolean;
  tenantAlerts: boolean;
  anomalyAlerts: boolean;
  systemAlerts: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
}

const AutomatedAlertsSystem: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [settings, setSettings] = useState<AlertSettings>({
    maintenanceAlerts: true,
    financialAlerts: true,
    tenantAlerts: true,
    anomalyAlerts: true,
    systemAlerts: true,
    emailNotifications: true,
    pushNotifications: false,
    smsNotifications: false,
  });
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    loadAlerts();
    loadSettings();
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/ai/alerts');
      if (response.data && response.data.data) {
        setAlerts(response.data.data);
      }
    } catch (err: any) {
      console.error('Error loading alerts:', err);
      showSnackbar('Failed to load alerts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await apiService.get('/ai/alerts/settings');
      if (response.data) {
        setSettings(response.data);
      }
    } catch (err: any) {
      console.error('Error loading settings:', err);
    }
  };

  const handleAlertAction = async (alertId: string, action: string) => {
    try {
      await apiService.post(`/ai/alerts/${alertId}/action`, { action });

      // Update local state
      setAlerts(prev =>
        prev.map(alert =>
          alert.id === alertId
            ? { ...alert, status: action === 'dismiss' ? 'dismissed' : 'read' }
            : alert
        )
      );

      showSnackbar('Alert action completed', 'success');
    } catch (err: any) {
      console.error('Error handling alert action:', err);
      showSnackbar('Failed to process alert action', 'error');
    }
  };

  const handleSettingsUpdate = async (newSettings: AlertSettings) => {
    try {
      await apiService.put('/ai/alerts/settings', newSettings);
      setSettings(newSettings);
      setSettingsOpen(false);
      showSnackbar('Settings updated successfully', 'success');
    } catch (err: any) {
      console.error('Error updating settings:', err);
      showSnackbar('Failed to update settings', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      case 'info': return 'default';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <Error color="error" />;
      case 'high': return <Warning color="warning" />;
      case 'medium': return <Info color="info" />;
      case 'low': return <CheckCircle color="success" />;
      case 'info': return <Info color="action" />;
      default: return <Info />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'maintenance': return '🔧';
      case 'financial': return '💰';
      case 'tenant': return '👥';
      case 'anomaly': return '📊';
      case 'system': return '⚙️';
      default: return '🔔';
    }
  };

  const getUnreadCount = () => {
    return alerts.filter(alert => alert.status === 'new').length;
  };

  const getAlertsByType = (type: string) => {
    return alerts.filter(alert => alert.type === type && alert.status !== 'dismissed');
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4">
            AI Alerts
          </Typography>
          <Badge badgeContent={getUnreadCount()} color="error">
            <Notifications />
          </Badge>
        </Box>
        <Button
          onClick={() => setSettingsOpen(true)}
          startIcon={<Settings />}
          variant="outlined"
        >
          Settings
        </Button>
      </Box>

      {/* Alert Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Alerts
              </Typography>
              <Typography variant="h4">
                {alerts.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Unread
              </Typography>
              <Typography variant="h4" color="error.main">
                {getUnreadCount()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Critical
              </Typography>
              <Typography variant="h4" color="error.main">
                {alerts.filter(a => a.severity === 'critical').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                This Week
              </Typography>
              <Typography variant="h4">
                {alerts.filter(a => {
                  const alertDate = new Date(a.timestamp);
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return alertDate >= weekAgo;
                }).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alerts by Category */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Alerts
            </Typography>
            <List>
              {alerts
                .filter(alert => alert.status !== 'dismissed')
                .slice(0, 10)
                .map((alert, index) => (
                <React.Fragment key={alert.id}>
                  <ListItem
                    sx={{
                      borderRadius: 1,
                      mb: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      backgroundColor: alert.status === 'new' ? 'action.hover' : 'inherit',
                      '&:hover': { backgroundColor: 'action.selected' }
                    }}
                  >
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: getSeverityColor(alert.severity) + '.main' }}>
                        {getSeverityIcon(alert.severity)}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1">
                            {alert.title}
                          </Typography>
                          <Chip
                            label={alert.severity}
                            color={getSeverityColor(alert.severity) as any}
                            size="small"
                          />
                          <Chip
                            label={alert.type}
                            variant="outlined"
                            size="small"
                            icon={<span>{getTypeIcon(alert.type)}</span>}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            {alert.message}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {formatTimestamp(alert.timestamp)} • {alert.source}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {alert.status === 'new' && (
                          <IconButton
                            size="small"
                            onClick={() => handleAlertAction(alert.id, 'mark_read')}
                            color="primary"
                          >
                            <MarkAsRead />
                          </IconButton>
                        )}
                        <IconButton
                          size="small"
                          onClick={() => handleAlertAction(alert.id, 'snooze')}
                          color="warning"
                        >
                          <Snooze />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleAlertAction(alert.id, 'dismiss')}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < alerts.filter(a => a.status !== 'dismissed').length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Alert Categories
            </Typography>
            <List>
              {['maintenance', 'financial', 'tenant', 'anomaly', 'system'].map((type) => (
                <ListItem key={type}>
                  <ListItemIcon>
                    <span style={{ fontSize: '1.5rem' }}>{getTypeIcon(type)}</span>
                  </ListItemIcon>
                  <ListItemText
                    primary={type.charAt(0).toUpperCase() + type.slice(1)}
                    secondary={`${getAlertsByType(type).length} alerts`}
                  />
                  <Chip
                    label={getAlertsByType(type).filter(a => a.status === 'new').length}
                    color="primary"
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Settings Dialog */}
      <Dialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Alert Settings</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            Alert Types
          </Typography>
          <Box sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.maintenanceAlerts}
                  onChange={(e) => setSettings(prev => ({ ...prev, maintenanceAlerts: e.target.checked }))}
                />
              }
              label="Maintenance Alerts"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.financialAlerts}
                  onChange={(e) => setSettings(prev => ({ ...prev, financialAlerts: e.target.checked }))}
                />
              }
              label="Financial Alerts"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.tenantAlerts}
                  onChange={(e) => setSettings(prev => ({ ...prev, tenantAlerts: e.target.checked }))}
                />
              }
              label="Tenant Alerts"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.anomalyAlerts}
                  onChange={(e) => setSettings(prev => ({ ...prev, anomalyAlerts: e.target.checked }))}
                />
              }
              label="Anomaly Detection Alerts"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.systemAlerts}
                  onChange={(e) => setSettings(prev => ({ ...prev, systemAlerts: e.target.checked }))}
                />
              }
              label="System Alerts"
            />
          </Box>

          <Typography variant="h6" gutterBottom>
            Notification Methods
          </Typography>
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.emailNotifications}
                  onChange={(e) => setSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                />
              }
              label="Email Notifications"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.pushNotifications}
                  onChange={(e) => setSettings(prev => ({ ...prev, pushNotifications: e.target.checked }))}
                />
              }
              label="Push Notifications"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.smsNotifications}
                  onChange={(e) => setSettings(prev => ({ ...prev, smsNotifications: e.target.checked }))}
                />
              }
              label="SMS Notifications"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => handleSettingsUpdate(settings)} variant="contained">
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AutomatedAlertsSystem;