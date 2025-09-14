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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Badge,
  Tabs,
  Tab,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Schedule,
  Error,
  Assignment,
  History,
  Add,
  Refresh
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Types
interface ApprovalInstance {
  id: string;
  workflowId: string;
  requestId: string;
  requestType: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ESCALATED' | 'EXPIRED' | 'CANCELLED';
  currentStep: number;
  initiatedBy: string;
  initiatedAt: string;
  completedAt?: string;
  metadata: any;
  workflow: {
    name: string;
    steps: any[];
  };
}

interface ApprovalAction {
  id: string;
  instanceId: string;
  stepNumber: number;
  approverId: string;
  action: 'APPROVE' | 'REJECT' | 'ESCALATE' | 'DELEGATE' | 'COMMENT';
  comments?: string;
  approvedAt: string;
  metadata?: any;
}

// Styled components
const StatusChip = styled(Chip)<{ status: string }>(({ theme, status }) => {
  const statusConfig = {
    PENDING: { color: theme.palette.warning.main, backgroundColor: theme.palette.warning.light },
    APPROVED: { color: theme.palette.success.main, backgroundColor: theme.palette.success.light },
    REJECTED: { color: theme.palette.error.main, backgroundColor: theme.palette.error.light },
    ESCALATED: { color: theme.palette.info.main, backgroundColor: theme.palette.info.light },
    EXPIRED: { color: theme.palette.grey[500], backgroundColor: theme.palette.grey[100] },
    CANCELLED: { color: theme.palette.grey[700], backgroundColor: theme.palette.grey[200] },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;

  return {
    color: config.color,
    backgroundColor: config.backgroundColor,
    fontWeight: 'bold',
  };
});

const ActionButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(0.5),
}));

// Approval Card Component
const ApprovalCard: React.FC<{
  approval: ApprovalInstance;
  onAction: (instanceId: string, action: string, comments?: string) => void;
}> = ({ approval, onAction }) => {
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState('');
  const [comments, setComments] = useState('');

  const handleActionClick = (action: string) => {
    setSelectedAction(action);
    setActionDialogOpen(true);
  };

  const handleActionSubmit = () => {
    onAction(approval.id, selectedAction, comments);
    setActionDialogOpen(false);
    setComments('');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Schedule color="warning" />;
      case 'APPROVED': return <CheckCircle color="success" />;
      case 'REJECTED': return <Cancel color="error" />;
      case 'ESCALATED': return <Error color="info" />;
      default: return <Assignment />;
    }
  };

  const canTakeAction = approval.status === 'PENDING';

  return (
    <>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
            <Typography variant="h6" component="div">
              {approval.metadata?.title || `Approval Request ${approval.id.slice(-8)}`}
            </Typography>
            <StatusChip
              label={approval.status}
              status={approval.status}
              icon={getStatusIcon(approval.status)}
            />
          </Box>

          <Typography variant="body2" color="text.secondary" gutterBottom>
            Workflow: {approval.workflow.name}
          </Typography>

          <Typography variant="body2" color="text.secondary" gutterBottom>
            Type: {approval.requestType.replace('_', ' ')}
          </Typography>

          <Typography variant="body2" color="text.secondary" gutterBottom>
            Initiated: {new Date(approval.initiatedAt).toLocaleDateString()}
          </Typography>

          {approval.metadata?.description && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              {approval.metadata.description}
            </Typography>
          )}

          {canTakeAction && (
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <ActionButton
                variant="contained"
                color="success"
                size="small"
                onClick={() => handleActionClick('APPROVE')}
              >
                Approve
              </ActionButton>
              <ActionButton
                variant="contained"
                color="error"
                size="small"
                onClick={() => handleActionClick('REJECT')}
              >
                Reject
              </ActionButton>
              <ActionButton
                variant="outlined"
                size="small"
                onClick={() => handleActionClick('ESCALATE')}
              >
                Escalate
              </ActionButton>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onClose={() => setActionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedAction === 'APPROVE' && 'Approve Request'}
          {selectedAction === 'REJECT' && 'Reject Request'}
          {selectedAction === 'ESCALATE' && 'Escalate Request'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Comments (Optional)"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleActionSubmit}
            variant="contained"
            color={selectedAction === 'APPROVE' ? 'success' : selectedAction === 'REJECT' ? 'error' : 'primary'}
          >
            {selectedAction === 'APPROVE' && 'Approve'}
            {selectedAction === 'REJECT' && 'Reject'}
            {selectedAction === 'ESCALATE' && 'Escalate'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// Main ApprovalDashboard component
const ApprovalDashboard: React.FC = () => {
  const [approvals, setApprovals] = useState<ApprovalInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Mock data - replace with actual API calls
  const mockApprovals: ApprovalInstance[] = [
    {
      id: '1',
      workflowId: 'wf1',
      requestId: 'req1',
      requestType: 'MAINTENANCE_REQUEST',
      status: 'PENDING',
      currentStep: 1,
      initiatedBy: 'user1',
      initiatedAt: new Date().toISOString(),
      metadata: {
        title: 'Emergency Plumbing Repair',
        description: 'Urgent leak in unit 3B requiring immediate attention',
        amount: 2500
      },
      workflow: {
        name: 'Maintenance Approval Workflow',
        steps: []
      }
    },
    {
      id: '2',
      workflowId: 'wf2',
      requestId: 'req2',
      requestType: 'LEASE_APPLICATION',
      status: 'APPROVED',
      currentStep: 2,
      initiatedBy: 'user2',
      initiatedAt: new Date(Date.now() - 86400000).toISOString(),
      completedAt: new Date().toISOString(),
      metadata: {
        title: 'Lease Application - John Smith',
        description: 'New tenant application for unit 5A'
      },
      workflow: {
        name: 'Lease Approval Workflow',
        steps: []
      }
    }
  ];

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      // Replace with actual API call
      // const response = await api.get('/api/approvals/pending');
      // setApprovals(response.data);

      // Mock data for now
      setApprovals(mockApprovals);
      setError(null);
    } catch (err) {
      setError('Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadApprovals();
    setRefreshing(false);
  };

  const handleApprovalAction = async (instanceId: string, action: string, comments?: string) => {
    try {
      // Replace with actual API call
      // await api.post(`/api/approvals/${instanceId}/approve`, {
      //   action,
      //   comments
      // });

      // Update local state
      setApprovals(prev =>
        prev.map(approval =>
          approval.id === instanceId
            ? {
                ...approval,
                status: action === 'APPROVE' ? 'APPROVED' : action === 'REJECT' ? 'REJECTED' : 'ESCALATED',
                completedAt: new Date().toISOString()
              }
            : approval
        )
      );
    } catch (err) {
      setError('Failed to process approval action');
    }
  };

  const getApprovalsByStatus = (status: string) => {
    return approvals.filter(approval => approval.status === status);
  };

  const getPendingCount = () => approvals.filter(a => a.status === 'PENDING').length;

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
        <Button onClick={loadApprovals} sx={{ ml: 2 }}>Retry</Button>
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Approval Dashboard
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

      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="warning.main">
                Pending Approvals
              </Typography>
              <Typography variant="h3">
                <Badge badgeContent={getPendingCount()} color="warning">
                  {getPendingCount()}
                </Badge>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main">
                Approved Today
              </Typography>
              <Typography variant="h3">
                {getApprovalsByStatus('APPROVED').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="error.main">
                Rejected Today
              </Typography>
              <Typography variant="h3">
                {getApprovalsByStatus('REJECTED').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="info.main">
                Escalated
              </Typography>
              <Typography variant="h3">
                {getApprovalsByStatus('ESCALATED').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mt: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label={`Pending (${getPendingCount()})`} />
          <Tab label={`All Approvals (${approvals.length})`} />
          <Tab label="History" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tabValue === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Pending Approvals
              </Typography>
              {getApprovalsByStatus('PENDING').length === 0 ? (
                <Typography color="text.secondary">No pending approvals</Typography>
              ) : (
                getApprovalsByStatus('PENDING').map(approval => (
                  <ApprovalCard
                    key={approval.id}
                    approval={approval}
                    onAction={handleApprovalAction}
                  />
                ))
              )}
            </Box>
          )}

          {tabValue === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                All Approvals
              </Typography>
              {approvals.map(approval => (
                <ApprovalCard
                  key={approval.id}
                  approval={approval}
                  onAction={handleApprovalAction}
                />
              ))}
            </Box>
          )}

          {tabValue === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Approval History
              </Typography>
              <Typography color="text.secondary">
                Historical approval data will be displayed here
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default ApprovalDashboard;