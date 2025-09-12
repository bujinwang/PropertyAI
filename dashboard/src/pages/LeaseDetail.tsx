import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Card,
  CardContent,
  Button,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Snackbar,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService, Lease, Payment } from '../services/dashboardService';
import AssociationModal from '../components/AssociationModal';

const LeaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [lease, setLease] = useState<Lease | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const queryClient = useQueryClient();

  const [openAssociationModal, setOpenAssociationModal] = useState(false);
  const [associationMode, setAssociationMode] = useState<'associate' | 'renew'>('associate');

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // For now, we'll get lease from the list - in a real app, you'd have a getLease endpoint
        const leasesResponse = await dashboardService.getLeases(1, 100);
        const foundLease = leasesResponse.data.find((l: Lease) => l.id === id);
        if (foundLease) {
          setLease(foundLease);
          // Fetch payments for this lease
          const paymentsData = await dashboardService.getPayments(id);
          setPayments(paymentsData);
        } else {
          setError('Lease not found');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch lease details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const markPaymentPaidMutation = useMutation({
    mutationFn: (paymentId: string) => dashboardService.markPaymentPaid(paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', id] });
      setSnackbar({ open: true, message: 'Payment marked as paid', severity: 'success' });
      // Refresh payments
      if (id) {
        dashboardService.getPayments(id).then(setPayments);
      }
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to mark payment as paid', severity: 'error' });
    },
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenAssociationModal = (mode: 'associate' | 'renew') => {
    setAssociationMode(mode);
    setOpenAssociationModal(true);
  };

  const handleCloseAssociationModal = () => {
    setOpenAssociationModal(false);
  };

  const handleAssociationSubmit = (data: any) => {
    queryClient.invalidateQueries({ queryKey: ['leases'] });
    const message = data.mode === 'associate'
      ? 'Lease associated successfully'
      : 'Lease renewed successfully';
    setSnackbar({ open: true, message, severity: 'success' });
    // Refresh lease data
    if (id) {
      dashboardService.getLeases(1, 100).then(response => {
        const updatedLease = response.data.find((l: Lease) => l.id === id);
        if (updatedLease) setLease(updatedLease);
      });
    }
  };

  const handleMarkPaid = (paymentId: string) => {
    markPaymentPaidMutation.mutate(paymentId);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'overdue': return 'error';
      default: return 'warning';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !lease) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error">{error || 'Lease not found'}</Alert>
        <Button component={Link} to="/leases" variant="contained" sx={{ mt: 2 }}>
          Back to Leases
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Lease Details
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={() => handleOpenAssociationModal('associate')}>
            Associate Tenant/Unit
          </Button>
          <Button variant="outlined" onClick={() => handleOpenAssociationModal('renew')}>
            Renew Lease
          </Button>
          <Button component={Link} to="/leases" variant="outlined">
            Back to Leases
          </Button>
        </Box>
      </Box>

      <Tabs value={tabValue} onChange={handleTabChange} aria-label="lease detail tabs">
        <Tab label="Overview" id="overview-tab" aria-controls="overview-panel" />
        <Tab label={`Payments (${payments.length})`} id="payments-tab" aria-controls="payments-panel" />
      </Tabs>

      {tabValue === 0 && (
        <Card sx={{ mt: 3 }} aria-labelledby="overview-tab">
          <CardContent>
            <Typography variant="h6" gutterBottom id="overview-panel">
              Lease Overview
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Tenant</Typography>
                <Typography>{lease.tenantName || 'Not assigned'}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Unit</Typography>
                <Typography>{lease.unitAddress || 'Not assigned'}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Start Date</Typography>
                <Typography>{new Date(lease.startDate).toLocaleDateString()}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">End Date</Typography>
                <Typography>{new Date(lease.endDate).toLocaleDateString()}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Rent Amount</Typography>
                <Typography>${lease.rentAmount.toLocaleString()}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Payment Frequency</Typography>
                <Typography>{lease.paymentFrequency}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Chip label={lease.status} color={lease.status === 'active' ? 'success' : 'default'} />
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {tabValue === 1 && (
        <Box sx={{ mt: 3 }} aria-labelledby="payments-tab">
          <Typography variant="h6" id="payments-panel" gutterBottom>
            Payment History
          </Typography>
          <TableContainer component={Paper}>
            <Table aria-label="payments table">
              <TableHead>
                <TableRow>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Paid Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{new Date(payment.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell>${payment.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={payment.status}
                        color={getPaymentStatusColor(payment.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {payment.paidDate ? new Date(payment.paidDate).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {payment.status !== 'paid' && (
                        <IconButton
                          onClick={() => handleMarkPaid(payment.id)}
                          color="success"
                          size="small"
                          aria-label="Mark as paid"
                          disabled={markPaymentPaidMutation.isPending}
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {payments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No payments found for this lease
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Association Modal */}
      <AssociationModal
        open={openAssociationModal}
        onClose={handleCloseAssociationModal}
        leaseId={id!}
        mode={associationMode}
        onSubmit={handleAssociationSubmit}
      />

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default LeaseDetail;