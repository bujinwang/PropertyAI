import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  IconButton,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CloudSync as SyncIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { apiService } from '../services/api';

interface Integration {
  id: string;
  name: string;
  provider: string;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  lastSync: string;
  nextSync: string;
  syncFrequency: string;
  health: {
    uptime: number;
    responseTime: number;
    errorRate: number;
  };
  config: {
    endpoint: string;
    apiKey: string;
    enabled: boolean;
  };
}

interface SyncLog {
  id: string;
  integrationId: string;
  integrationName: string;
  status: 'success' | 'failed' | 'partial';
  recordsProcessed: number;
  errors: string[];
  duration: number;
  timestamp: string;
}

interface ErrorReport {
  id: string;
  integrationId: string;
  integrationName: string;
  errorType: string;
  message: string;
  stackTrace: string;
  timestamp: string;
  resolved: boolean;
  retryCount: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`integration-tabpanel-${index}`}
      aria-labelledby={`integration-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ExternalSystemsIntegrationDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [errorReports, setErrorReports] = useState<ErrorReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [configForm, setConfigForm] = useState({
    endpoint: '',
    apiKey: '',
    syncFrequency: 'hourly',
    enabled: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [integrationsData, logsData, errorsData] = await Promise.all([
        apiService.get('/api/integrations'),
        apiService.get('/api/integrations/sync-logs'),
        apiService.get('/api/integrations/errors'),
      ]);
      setIntegrations(integrationsData.data);
      setSyncLogs(logsData.data);
      setErrorReports(errorsData.data);
    } catch (error) {
      console.error('Error loading integration data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncNow = async (integrationId: string) => {
    try {
      await apiService.post(`/api/integrations/${integrationId}/sync`);
      loadData();
    } catch (error) {
      console.error('Error triggering sync:', error);
    }
  };

  const handleSyncAll = async () => {
    try {
      await apiService.post('/api/integrations/sync-all');
      loadData();
    } catch (error) {
      console.error('Error triggering all syncs:', error);
    }
  };

  const handleToggleIntegration = async (integrationId: string, enabled: boolean) => {
    try {
      await apiService.put(`/api/integrations/${integrationId}/toggle`, { enabled });
      loadData();
    } catch (error) {
      console.error('Error toggling integration:', error);
    }
  };

  const handleSaveConfig = async () => {
    if (!selectedIntegration) return;
    
    try {
      await apiService.put(`/api/integrations/${selectedIntegration}/config`, configForm);
      setShowConfigDialog(false);
      setSelectedIntegration(null);
      loadData();
    } catch (error) {
      console.error('Error saving config:', error);
    }
  };

  const handleResolveError = async (errorId: string) => {
    try {
      await apiService.put(`/api/integrations/errors/${errorId}/resolve`);
      loadData();
    } catch (error) {
      console.error('Error resolving error:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircleIcon color="success" />;
      case 'disconnected':
        return <CancelIcon color="error" />;
      case 'error':
        return <WarningIcon color="warning" />;
      case 'pending':
        return <ScheduleIcon color="info" />;
      default:
        return <WarningIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'success':
        return 'success';
      case 'disconnected':
      case 'failed':
        return 'error';
      case 'error':
        return 'warning';
      case 'pending':
      case 'partial':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const openConfigDialog = (integration: Integration) => {
    setSelectedIntegration(integration.id);
    setConfigForm({
      endpoint: integration.config.endpoint,
      apiKey: integration.config.apiKey,
      syncFrequency: integration.syncFrequency,
      enabled: integration.config.enabled,
    });
    setShowConfigDialog(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        External Systems Integration
      </Typography>

      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Monitor and manage third-party integrations
        </Typography>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={loadData}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="integration tabs">
          <Tab label="Integrations" />
          <Tab label="Sync Logs" />
          <Tab label="Error Reports" />
          <Tab label="Configuration" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Integration Status Overview</Typography>
                  <Button
                    variant="contained"
                    startIcon={<SyncIcon />}
                    onClick={handleSyncAll}
                  >
                    Sync All Now
                  </Button>
                </Box>

                <Grid container spacing={2}>
                  {integrations.map((integration) => (
                    <Grid item xs={12} md={6} lg={4} key={integration.id}>
                      <Paper sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          {getStatusIcon(integration.status)}
                          <Typography variant="h6">{integration.name}</Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {integration.provider}
                        </Typography>
                        
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2">
                            Health: {integration.health.uptime}% uptime
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={integration.health.uptime} 
                            sx={{ mt: 1 }}
                          />
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">
                            Response: {integration.health.responseTime}ms
                          </Typography>
                          <Typography variant="body2">
                            Errors: {integration.health.errorRate}%
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Chip 
                            label={integration.status} 
                            color={getStatusColor(integration.status) as any}
                            size="small"
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleSyncNow(integration.id)}
                          >
                            <RefreshIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => openConfigDialog(integration)}
                          >
                            <SettingsIcon />
                          </IconButton>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Integration</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Records</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Timestamp</TableCell>
                <TableCell>Errors</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {syncLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{log.integrationName}</TableCell>
                  <TableCell>
                    <Chip 
                      label={log.status} 
                      color={getStatusColor(log.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{log.recordsProcessed}</TableCell>
                  <TableCell>{formatDuration(log.duration)}</TableCell>
                  <TableCell>{formatDate(log.timestamp)}</TableCell>
                  <TableCell>
                    {log.errors.length > 0 ? (
                      <Tooltip title={log.errors.join(', ')}>
                        <Chip 
                          label={`${log.errors.length} errors`} 
                          color="error" 
                          size="small"
                        />
                      </Tooltip>
                    ) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Integration</TableCell>
                <TableCell>Error Type</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Timestamp</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {errorReports.map((error) => (
                <TableRow key={error.id}>
                  <TableCell>{error.integrationName}</TableCell>
                  <TableCell>{error.errorType}</TableCell>
                  <TableCell>
                    <Tooltip title={error.message}>
                      <Typography noWrap sx={{ maxWidth: 200 }}>
                        {error.message}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{formatDate(error.timestamp)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={error.resolved ? 'Resolved' : 'Open'} 
                      color={error.resolved ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {!error.resolved && (
                      <Button
                        size="small"
                        onClick={() => handleResolveError(error.id)}
                      >
                        Resolve
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <List>
          {integrations.map((integration) => (
            <ListItem key={integration.id} divider>
              <ListItemText
                primary={integration.name}
                secondary={`${integration.provider} • ${integration.syncFrequency}`}
              />
              <ListItemSecondaryAction>
                <FormControlLabel
                  control={
                    <Switch
                      checked={integration.config.enabled}
                      onChange={(e) => handleToggleIntegration(integration.id, e.target.checked)}
                    />
                  }
                  label="Enabled"
                />
                <IconButton
                  onClick={() => openConfigDialog(integration)}
                >
                  <SettingsIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </TabPanel>

      <Dialog open={showConfigDialog} onClose={() => setShowConfigDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Configure Integration</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Endpoint URL"
              value={configForm.endpoint}
              onChange={(e) => setConfigForm({ ...configForm, endpoint: e.target.value })}
              fullWidth
            />
            <TextField
              label="API Key"
              value={configForm.apiKey}
              onChange={(e) => setConfigForm({ ...configForm, apiKey: e.target.value })}
              fullWidth
              type="password"
            />
            <FormControl fullWidth>
              <InputLabel>Sync Frequency</InputLabel>
              <Select
                value={configForm.syncFrequency}
                onChange={(e) => setConfigForm({ ...configForm, syncFrequency: e.target.value })}
              >
                <MenuItem value="5min">Every 5 minutes</MenuItem>
                <MenuItem value="15min">Every 15 minutes</MenuItem>
                <MenuItem value="30min">Every 30 minutes</MenuItem>
                <MenuItem value="hourly">Every hour</MenuItem>
                <MenuItem value="daily">Daily</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={configForm.enabled}
                  onChange={(e) => setConfigForm({ ...configForm, enabled: e.target.checked })}
                />
              }
              label="Enable Integration"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfigDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveConfig} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExternalSystemsIntegrationDashboard;