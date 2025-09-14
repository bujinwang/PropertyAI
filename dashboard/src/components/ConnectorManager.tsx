import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Settings as SettingsIcon,
  Sync as SyncIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { Formik, Form, Field, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import {
  connectorRegistry,
  ConnectorType,
  ConnectorStatus,
  SyncFrequency,
  ConnectorConfig,
  SyncResult,
  createConnectorConfig,
} from '../utils/connectorFramework';
import { createBackgroundCheckConnector } from '../utils/connectors/BackgroundCheckConnector';

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
      id={`connector-tabpanel-${index}`}
      aria-labelledby={`connector-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const connectorTypes: { value: ConnectorType; label: string; icon: string }[] = [
  { value: 'background_check', label: 'Background Check', icon: '🔍' },
  { value: 'maintenance_vendor', label: 'Maintenance Vendor', icon: '🔧' },
  { value: 'document_storage', label: 'Document Storage', icon: '📄' },
  { value: 'property_listing', label: 'Property Listing', icon: '🏠' },
  { value: 'accounting', label: 'Accounting', icon: '💰' },
  { value: 'iot_device', label: 'IoT Device', icon: '📡' },
  { value: 'email_sms', label: 'Email & SMS', icon: '📧' },
  { value: 'webhook', label: 'Webhook', icon: '🔗' },
];

const providers: Record<ConnectorType, string[]> = {
  background_check: ['transunion', 'experian', 'equifax'],
  maintenance_vendor: ['servicetin', 'housecall', 'jobber'],
  document_storage: ['dropbox', 'google_drive', 'onedrive'],
  property_listing: ['zillow', 'apartments_com', 'realtor_com'],
  accounting: ['quickbooks', 'xero', 'freshbooks'],
  iot_device: ['smartthings', 'nest', 'ring'],
  email_sms: ['twilio', 'sendgrid', 'mailgun'],
  webhook: ['generic'],
};

const ConnectorManager: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [connectors, setConnectors] = useState<ConnectorConfig[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedConnector, setSelectedConnector] = useState<ConnectorConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadConnectors();
  }, []);

  const loadConnectors = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would fetch from your backend
      // For now, we'll get from the registry
      const allConnectors = connectorRegistry.getAll();
      const configs = allConnectors.map(connector => connector.getConfig());
      setConnectors(configs);
    } catch (err) {
      console.error('Error loading connectors:', err);
      setError('Failed to load connectors');
    } finally {
      setLoading(false);
    }
  };

  const handleAddConnector = async (values: any, { setSubmitting }: FormikHelpers<any>) => {
    try {
      setError(null);

      const config = createConnectorConfig(
        values.type,
        values.provider,
        values.config || {},
        {
          apiKey: values.apiKey,
          apiSecret: values.apiSecret,
          username: values.username,
          password: values.password,
          token: values.token,
          webhookUrl: values.webhookUrl,
        }
      );

      // Create the appropriate connector instance
      let connector;
      switch (values.type) {
        case 'background_check':
          connector = createBackgroundCheckConnector(values.provider, config);
          break;
        // Add other connector types here
        default:
          throw new Error(`Unsupported connector type: ${values.type}`);
      }

      // Register and initialize
      connectorRegistry.register(connector);
      await connector.initialize(config);

      setConnectors([...connectors, config]);
      setSuccess('Connector added successfully');
      setOpenDialog(false);
    } catch (err: any) {
      console.error('Error adding connector:', err);
      setError(err.message || 'Failed to add connector');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleConnector = async (connectorId: string, isActive: boolean) => {
    try {
      const connector = connectorRegistry.getAll().find(c => c.getConfig().id === connectorId);
      if (!connector) return;

      if (isActive) {
        const connected = await connector.connect();
        if (!connected) {
          throw new Error('Failed to connect to service');
        }
      } else {
        await connector.disconnect();
      }

      // Update local state
      setConnectors(connectors.map(c =>
        c.id === connectorId
          ? { ...c, isActive, status: isActive ? 'connected' : 'disconnected' }
          : c
      ));

      setSuccess(`Connector ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (err: any) {
      console.error('Error toggling connector:', err);
      setError(err.message || 'Failed to toggle connector');
    }
  };

  const handleSyncConnector = async (connectorId: string) => {
    try {
      const connector = connectorRegistry.getAll().find(c => c.getConfig().id === connectorId);
      if (!connector) return;

      const result = await connector.sync();
      setSyncLogs(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 logs

      setSuccess(`Sync completed: ${result.recordsProcessed} records processed`);
    } catch (err: any) {
      console.error('Error syncing connector:', err);
      setError(err.message || 'Sync failed');
    }
  };

  const handleSyncAll = async () => {
    try {
      const results = await connectorRegistry.syncAll();
      setSyncLogs(prev => [...results, ...prev.slice(0, 10 - results.length)]);

      const successCount = results.filter(r => r.success).length;
      setSuccess(`Sync completed: ${successCount}/${results.length} connectors synced successfully`);
    } catch (err: any) {
      console.error('Error syncing all connectors:', err);
      setError('Failed to sync connectors');
    }
  };

  const handleDeleteConnector = async (connectorId: string) => {
    try {
      // In a real implementation, this would call your backend
      setConnectors(connectors.filter(c => c.id !== connectorId));
      setSuccess('Connector deleted successfully');
    } catch (err: any) {
      console.error('Error deleting connector:', err);
      setError(err.message || 'Failed to delete connector');
    }
  };

  const getStatusIcon = (status: ConnectorStatus) => {
    switch (status) {
      case 'connected':
        return <CheckCircleIcon color="success" />;
      case 'disconnected':
        return <CancelIcon color="error" />;
      case 'error':
        return <WarningIcon color="warning" />;
      case 'pending':
      case 'syncing':
        return <ScheduleIcon color="info" />;
      default:
        return <WarningIcon />;
    }
  };

  const getStatusColor = (status: ConnectorStatus) => {
    switch (status) {
      case 'connected':
        return 'success';
      case 'disconnected':
        return 'error';
      case 'error':
        return 'warning';
      case 'pending':
      case 'syncing':
        return 'info';
      default:
        return 'default';
    }
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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Connector Manager
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadConnectors}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<SyncIcon />}
            onClick={handleSyncAll}
          >
            Sync All
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            Add Connector
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="connector tabs">
          <Tab label="Connectors" />
          <Tab label="Sync Logs" />
          <Tab label="Settings" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : connectors.length === 0 ? (
          <Alert severity="info">
            No connectors configured. Add your first connector to get started.
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {connectors.map((connector) => (
              <Box key={connector.id} sx={{ minWidth: 300, flex: '1 1 auto', maxWidth: 400 }}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Typography variant="h6">{connector.name}</Typography>
                      {getStatusIcon(connector.status)}
                    </Box>

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {connector.provider} • {connector.type.replace('_', ' ')}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
                      <Chip
                        label={connector.status}
                        color={getStatusColor(connector.status) as any}
                        size="small"
                      />
                      <Chip
                        label={connector.syncFrequency}
                        variant="outlined"
                        size="small"
                      />
                    </Box>

                    {connector.lastSync && (
                      <Typography variant="body2" color="text.secondary">
                        Last sync: {formatDate(connector.lastSync)}
                      </Typography>
                    )}

                    {connector.errorMessage && (
                      <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                        Error: {connector.errorMessage}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={connector.isActive}
                          onChange={(e) => handleToggleConnector(connector.id, e.target.checked)}
                        />
                      }
                      label="Active"
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleSyncConnector(connector.id)}
                      disabled={!connector.isActive}
                    >
                      <SyncIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteConnector(connector.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Box>
            ))}
          </Box>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Records</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Errors</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {syncLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No sync logs available
                  </TableCell>
                </TableRow>
              ) : (
                syncLogs.map((log, index) => (
                  <TableRow key={index}>
                    <TableCell>{formatDate(log.timestamp)}</TableCell>
                    <TableCell>
                      <Chip
                        label={log.success ? 'Success' : 'Failed'}
                        color={log.success ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{log.recordsProcessed}</TableCell>
                    <TableCell>{log.duration}ms</TableCell>
                    <TableCell>
                      {log.errors.length > 0 ? (
                        <Typography variant="body2" color="error">
                          {log.errors.length} error(s)
                        </Typography>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Alert severity="info">
          Connector settings and configuration options will be available here.
        </Alert>
      </TabPanel>

      {/* Add Connector Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Connector</DialogTitle>
        <Formik
          initialValues={{
            type: 'background_check' as ConnectorType,
            provider: '',
            apiKey: '',
            apiSecret: '',
            username: '',
            password: '',
            token: '',
            webhookUrl: '',
            syncFrequency: 'hourly' as SyncFrequency,
          }}
          validationSchema={Yup.object({
            type: Yup.string().required('Connector type is required'),
            provider: Yup.string().required('Provider is required'),
            apiKey: Yup.string().when(['type', 'provider'], {
              is: (type: ConnectorType, provider: string) =>
                ['background_check', 'maintenance_vendor', 'document_storage'].includes(type) ||
                ['transunion', 'experian'].includes(provider),
              then: (schema) => schema.required('API key is required'),
            }),
          })}
          onSubmit={handleAddConnector}
        >
          {({ isSubmitting, errors, touched, setFieldValue, values }) => (
            <Form>
              <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                  <FormControl fullWidth error={Boolean(touched.type && errors.type)}>
                    <InputLabel>Connector Type</InputLabel>
                    <Field
                      as={Select}
                      name="type"
                      label="Connector Type"
                      onChange={(e: React.ChangeEvent<{ value: unknown }>) => {
                        setFieldValue('type', e.target.value);
                        setFieldValue('provider', ''); // Reset provider when type changes
                      }}
                    >
                      {connectorTypes.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography>{type.icon}</Typography>
                            <Typography>{type.label}</Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Field>
                    {touched.type && errors.type && (
                      <FormHelperText>{errors.type as string}</FormHelperText>
                    )}
                  </FormControl>

                  <FormControl fullWidth error={Boolean(touched.provider && errors.provider)}>
                    <InputLabel>Provider</InputLabel>
                    <Field
                      as={Select}
                      name="provider"
                      label="Provider"
                      disabled={!values.type}
                      onChange={(e: React.ChangeEvent<{ value: unknown }>) => setFieldValue('provider', e.target.value)}
                    >
                      {values.type && providers[values.type]?.map((provider) => (
                        <MenuItem key={provider} value={provider}>
                          {provider.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </MenuItem>
                      ))}
                    </Field>
                    {touched.provider && errors.provider && (
                      <FormHelperText>{errors.provider as string}</FormHelperText>
                    )}
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>Sync Frequency</InputLabel>
                    <Field
                      as={Select}
                      name="syncFrequency"
                      label="Sync Frequency"
                      onChange={(e: React.ChangeEvent<{ value: unknown }>) => setFieldValue('syncFrequency', e.target.value)}
                    >
                      <MenuItem value="realtime">Real-time</MenuItem>
                      <MenuItem value="5min">Every 5 minutes</MenuItem>
                      <MenuItem value="15min">Every 15 minutes</MenuItem>
                      <MenuItem value="30min">Every 30 minutes</MenuItem>
                      <MenuItem value="hourly">Hourly</MenuItem>
                      <MenuItem value="daily">Daily</MenuItem>
                      <MenuItem value="weekly">Weekly</MenuItem>
                    </Field>
                  </FormControl>

                  {/* API Credentials */}
                  <Typography variant="h6" gutterBottom>
                    API Credentials
                  </Typography>

                  <Field
                    as={TextField}
                    name="apiKey"
                    label="API Key"
                    fullWidth
                    type="password"
                    error={Boolean(touched.apiKey && errors.apiKey)}
                    helperText={touched.apiKey && errors.apiKey ? (errors.apiKey as string) : ''}
                  />

                  <Field
                    as={TextField}
                    name="apiSecret"
                    label="API Secret"
                    fullWidth
                    type="password"
                    error={Boolean(touched.apiSecret && errors.apiSecret)}
                    helperText={touched.apiSecret && errors.apiSecret ? (errors.apiSecret as string) : ''}
                  />

                  <Field
                    as={TextField}
                    name="username"
                    label="Username"
                    fullWidth
                    error={Boolean(touched.username && errors.username)}
                    helperText={touched.username && errors.username ? (errors.username as string) : ''}
                  />

                  <Field
                    as={TextField}
                    name="password"
                    label="Password"
                    fullWidth
                    type="password"
                    error={Boolean(touched.password && errors.password)}
                    helperText={touched.password && errors.password ? (errors.password as string) : ''}
                  />

                  <Field
                    as={TextField}
                    name="token"
                    label="Access Token"
                    fullWidth
                    type="password"
                    error={Boolean(touched.token && errors.token)}
                    helperText={touched.token && errors.token ? (errors.token as string) : ''}
                  />

                  <Field
                    as={TextField}
                    name="webhookUrl"
                    label="Webhook URL"
                    fullWidth
                    error={Boolean(touched.webhookUrl && errors.webhookUrl)}
                    helperText={touched.webhookUrl && errors.webhookUrl ? (errors.webhookUrl as string) : ''}
                  />

                  <Alert severity="info">
                    Your credentials are encrypted and securely stored. Make sure to use the appropriate authentication method for your provider.
                  </Alert>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenDialog(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" variant="contained" disabled={isSubmitting}>
                  Add Connector
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </Box>
  );
};

export default ConnectorManager;