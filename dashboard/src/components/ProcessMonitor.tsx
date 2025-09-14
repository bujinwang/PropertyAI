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
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Badge
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  Timeline,
  Assessment,
  Error,
  CheckCircle,
  Schedule,
  Refresh
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Types
interface WorkflowInstance {
  id: string;
  definitionId: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PAUSED' | 'CANCELLED';
  currentStep?: string;
  variables: Record<string, any>;
  context: any;
  initiatedBy: string;
  initiatedAt: string;
  completedAt?: string;
  duration?: number;
  definition: {
    name: string;
    category: string;
  };
}

interface WorkflowAnalytics {
  totalInstances: number;
  completedInstances: number;
  failedInstances: number;
  runningInstances: number;
  completionRate: number;
  avgExecutionTime: number;
  instances: WorkflowInstance[];
}

// Styled components
const StatusChip = styled(Chip)<{ status: string }>(({ theme, status }) => {
  const statusConfig = {
    RUNNING: { color: theme.palette.info.main, backgroundColor: theme.palette.info.light },
    COMPLETED: { color: theme.palette.success.main, backgroundColor: theme.palette.success.light },
    FAILED: { color: theme.palette.error.main, backgroundColor: theme.palette.error.light },
    PAUSED: { color: theme.palette.warning.main, backgroundColor: theme.palette.warning.light },
    CANCELLED: { color: theme.palette.grey[500], backgroundColor: theme.palette.grey[100] },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.RUNNING;

  return {
    color: config.color,
    backgroundColor: config.backgroundColor,
    fontWeight: 'bold',
  };
});

const MetricCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

// Workflow Instance Row Component
const WorkflowInstanceRow: React.FC<{
  instance: WorkflowInstance;
  onAction: (instanceId: string, action: string) => void;
}> = ({ instance, onAction }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RUNNING': return <PlayArrow color="info" />;
      case 'COMPLETED': return <CheckCircle color="success" />;
      case 'FAILED': return <Error color="error" />;
      case 'PAUSED': return <Pause color="warning" />;
      case 'CANCELLED': return <Stop color="disabled" />;
      default: return <Schedule />;
    }
  };

  const canControl = ['RUNNING', 'PAUSED'].includes(instance.status);

  return (
    <TableRow>
      <TableCell>
        <Box display="flex" alignItems="center" gap={1}>
          {getStatusIcon(instance.status)}
          <Box>
            <Typography variant="body2" fontWeight="bold">
              {instance.definition.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {instance.id.slice(-8)}
            </Typography>
          </Box>
        </Box>
      </TableCell>
      <TableCell>
        <StatusChip label={instance.status} status={instance.status} size="small" />
      </TableCell>
      <TableCell>
        <Typography variant="body2">{instance.definition.category}</Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2">{instance.currentStep || 'N/A'}</Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2">
          {new Date(instance.initiatedAt).toLocaleString()}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2">
          {instance.duration ? `${Math.round(instance.duration / 1000)}s` : 'N/A'}
        </Typography>
      </TableCell>
      <TableCell>
        {canControl && (
          <Box display="flex" gap={0.5}>
            {instance.status === 'RUNNING' && (
              <Button
                size="small"
                variant="outlined"
                onClick={() => onAction(instance.id, 'pause')}
              >
                Pause
              </Button>
            )}
            {instance.status === 'PAUSED' && (
              <Button
                size="small"
                variant="outlined"
                onClick={() => onAction(instance.id, 'resume')}
              >
                Resume
              </Button>
            )}
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={() => onAction(instance.id, 'cancel')}
            >
              Cancel
            </Button>
          </Box>
        )}
      </TableCell>
    </TableRow>
  );
};

// Analytics Chart Component (simplified)
const AnalyticsChart: React.FC<{
  data: WorkflowAnalytics;
}> = ({ data }) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Workflow Performance
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Typography variant="body2" color="text.secondary">
            Completion Rate
          </Typography>
          <LinearProgress
            variant="determinate"
            value={data.completionRate}
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {data.completionRate.toFixed(1)}%
          </Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="body2" color="text.secondary">
            Average Execution Time
          </Typography>
          <Typography variant="h6">
            {Math.round(data.avgExecutionTime)}s
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
};

// Main ProcessMonitor component
const ProcessMonitor: React.FC = () => {
  const [instances, setInstances] = useState<WorkflowInstance[]>([]);
  const [analytics, setAnalytics] = useState<WorkflowAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<WorkflowInstance | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Mock data - replace with actual API calls
  const mockInstances: WorkflowInstance[] = [
    {
      id: 'inst_1',
      definitionId: 'def_1',
      status: 'RUNNING',
      currentStep: 'process_payment',
      variables: { amount: 2500, tenantId: 'tenant_123' },
      context: { priority: 'high' },
      initiatedBy: 'user1',
      initiatedAt: new Date().toISOString(),
      definition: {
        name: 'Maintenance Approval Workflow',
        category: 'Approvals'
      }
    },
    {
      id: 'inst_2',
      definitionId: 'def_2',
      status: 'COMPLETED',
      variables: { documentId: 'doc_456', approved: true },
      context: {},
      initiatedBy: 'user2',
      initiatedAt: new Date(Date.now() - 3600000).toISOString(),
      completedAt: new Date().toISOString(),
      duration: 45000,
      definition: {
        name: 'Document Processing Workflow',
        category: 'Documents'
      }
    },
    {
      id: 'inst_3',
      definitionId: 'def_3',
      status: 'FAILED',
      variables: { error: 'Integration timeout' },
      context: {},
      initiatedBy: 'user3',
      initiatedAt: new Date(Date.now() - 7200000).toISOString(),
      completedAt: new Date(Date.now() - 3600000).toISOString(),
      duration: 1800000,
      definition: {
        name: 'External API Integration',
        category: 'Integrations'
      }
    }
  ];

  const mockAnalytics: WorkflowAnalytics = {
    totalInstances: 150,
    completedInstances: 135,
    failedInstances: 8,
    runningInstances: 7,
    completionRate: 90.0,
    avgExecutionTime: 45,
    instances: mockInstances
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Replace with actual API calls
      // const [instancesRes, analyticsRes] = await Promise.all([
      //   api.get('/api/workflows/instances'),
      //   api.get('/api/workflows/analytics')
      // ]);
      // setInstances(instancesRes.data);
      // setAnalytics(analyticsRes.data);

      // Mock data for now
      setInstances(mockInstances);
      setAnalytics(mockAnalytics);
      setError(null);
    } catch (err) {
      setError('Failed to load workflow data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleInstanceAction = async (instanceId: string, action: string) => {
    try {
      // Replace with actual API calls
      // await api.post(`/api/workflows/instances/${instanceId}/${action}`);

      // Update local state
      setInstances(prev =>
        prev.map(instance =>
          instance.id === instanceId
            ? {
                ...instance,
                status: action === 'pause' ? 'PAUSED' :
                       action === 'resume' ? 'RUNNING' :
                       action === 'cancel' ? 'CANCELLED' : instance.status
              }
            : instance
        )
      );
    } catch (err) {
      setError(`Failed to ${action} workflow instance`);
    }
  };

  const handleViewDetails = (instance: WorkflowInstance) => {
    setSelectedInstance(instance);
    setDetailsDialogOpen(true);
  };

  const getInstancesByStatus = (status: string) => {
    return instances.filter(instance => instance.status === status);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
        <Button onClick={loadData} sx={{ ml: 2 }}>Retry</Button>
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Process Monitor
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      {/* Analytics Cards */}
      {analytics && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <MetricCard>
              <CardContent>
                <Typography variant="h6" color="info.main">
                  Running
                </Typography>
                <Typography variant="h3">
                  <Badge badgeContent={analytics.runningInstances} color="info">
                    {analytics.runningInstances}
                  </Badge>
                </Typography>
              </CardContent>
            </MetricCard>
          </Grid>
          <Grid item xs={12} md={3}>
            <MetricCard>
              <CardContent>
                <Typography variant="h6" color="success.main">
                  Completed
                </Typography>
                <Typography variant="h3">
                  {analytics.completedInstances}
                </Typography>
              </CardContent>
            </MetricCard>
          </Grid>
          <Grid item xs={12} md={3}>
            <MetricCard>
              <CardContent>
                <Typography variant="h6" color="error.main">
                  Failed
                </Typography>
                <Typography variant="h3">
                  {analytics.failedInstances}
                </Typography>
              </CardContent>
            </MetricCard>
          </Grid>
          <Grid item xs={12} md={3}>
            <MetricCard>
              <CardContent>
                <Typography variant="h6" color="primary.main">
                  Success Rate
                </Typography>
                <Typography variant="h3">
                  {analytics.completionRate.toFixed(1)}%
                </Typography>
              </CardContent>
            </MetricCard>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Paper>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label={`Active Processes (${getInstancesByStatus('RUNNING').length + getInstancesByStatus('PAUSED').length})`} />
          <Tab label={`All Processes (${instances.length})`} />
          <Tab label="Analytics" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {(tabValue === 0 || tabValue === 1) && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Workflow</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Current Step</TableCell>
                    <TableCell>Started</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(tabValue === 0
                    ? instances.filter(i => ['RUNNING', 'PAUSED'].includes(i.status))
                    : instances
                  ).map(instance => (
                    <WorkflowInstanceRow
                      key={instance.id}
                      instance={instance}
                      onAction={handleInstanceAction}
                    />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {tabValue === 2 && analytics && (
            <AnalyticsChart data={analytics} />
          )}
        </Box>
      </Paper>

      {/* Instance Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Workflow Instance Details
        </DialogTitle>
        <DialogContent>
          {selectedInstance && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedInstance.definition.name}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <StatusChip
                    label={selectedInstance.status}
                    status={selectedInstance.status}
                    sx={{ mt: 0.5 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Current Step
                  </Typography>
                  <Typography variant="body1">
                    {selectedInstance.currentStep || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Initiated By
                  </Typography>
                  <Typography variant="body1">
                    {selectedInstance.initiatedBy}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Duration
                  </Typography>
                  <Typography variant="body1">
                    {selectedInstance.duration ? `${Math.round(selectedInstance.duration / 1000)}s` : 'N/A'}
                  </Typography>
                </Grid>
              </Grid>

              <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
                Variables
              </Typography>
              <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                <pre style={{ fontSize: '12px', margin: 0 }}>
                  {JSON.stringify(selectedInstance.variables, null, 2)}
                </pre>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProcessMonitor;