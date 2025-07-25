import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Button, Chip, Alert, CircularProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import api from '../../services/api';

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
  lease: {
    unit: {
      unitNumber: string;
      property: {
        name: string;
      };
    };
    tenant: {
      firstName: string;
      lastName: string;
    };
  };
}

interface VendorPayment {
  id: string;
  amount: number;
  notes: string;
  createdAt: string;
  vendor: {
    name: string;
  };
  workOrder: {
    maintenanceRequest: {
      property: {
        name: string;
      };
    };
  };
}

const PaymentApproval: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [vendorPayments, setVendorPayments] = useState<VendorPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPendingPayments = async () => {
      try {
        setLoading(true);
        const [transactionsRes, vendorPaymentsRes] = await Promise.all([
          api.get('/api/payments/transactions/pending'),
          api.get('/api/payments/vendor-payments/pending'),
        ]);
        setTransactions(transactionsRes.data);
        setVendorPayments(vendorPaymentsRes.data);
      } catch (error) {
        console.error('Error fetching pending payments:', error);
        setError('Failed to load pending payments');
      } finally {
        setLoading(false);
      }
    };

    fetchPendingPayments();
  }, []);

  const handleApproveTransaction = async (id: string) => {
    try {
      await api.post(`/api/payments/transactions/${id}/approve`);
      setTransactions(transactions.filter((t) => t.id !== id));
    } catch (error) {
      console.error('Error approving transaction:', error);
      setError('Failed to approve transaction');
    }
  };

  const handleRejectTransaction = async (id: string) => {
    try {
      await api.post(`/api/payments/transactions/${id}/reject`);
      setTransactions(transactions.filter((t) => t.id !== id));
    } catch (error) {
      console.error('Error rejecting transaction:', error);
      setError('Failed to reject transaction');
    }
  };

  const handleApproveVendorPayment = async (id: string) => {
    try {
      await api.post(`/api/payments/vendor-payments/${id}/approve`);
      setVendorPayments(vendorPayments.filter((p) => p.id !== id));
    } catch (error) {
      console.error('Error approving vendor payment:', error);
      setError('Failed to approve vendor payment');
    }
  };

  const handleRejectVendorPayment = async (id: string) => {
    try {
      await api.post(`/api/payments/vendor-payments/${id}/reject`);
      setVendorPayments(vendorPayments.filter((p) => p.id !== id));
    } catch (error) {
      console.error('Error rejecting vendor payment:', error);
      setError('Failed to reject vendor payment');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Payment Approvals
      </Typography>
      
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Pending Transactions ({transactions.length})
        </Typography>
        {transactions.length === 0 ? (
          <Typography color="text.secondary">No pending transactions</Typography>
        ) : (
          transactions.map((transaction) => (
            <Card key={transaction.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start">
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {transaction.description}
                    </Typography>
                    <Typography color="text.secondary" gutterBottom>
                      {transaction.lease.unit.property.name} • Unit {transaction.lease.unit.unitNumber}
                    </Typography>
                    <Typography color="text.secondary">
                      Tenant: {transaction.lease.tenant.firstName} {transaction.lease.tenant.lastName}
                    </Typography>
                    <Typography color="text.secondary">
                      Date: {formatDate(transaction.createdAt)}
                    </Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="h5" color="primary">
                      {formatCurrency(transaction.amount)}
                    </Typography>
                    <Chip label={transaction.type} size="small" />
                  </Box>
                </Box>
                <Box display="flex" gap={1} sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => handleApproveTransaction(transaction.id)}
                    size="small"
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={() => handleRejectTransaction(transaction.id)}
                    size="small"
                  >
                    Reject
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))
        )}
      </Box>

      <Box>
        <Typography variant="h5" gutterBottom>
          Pending Vendor Payments ({vendorPayments.length})
        </Typography>
        {vendorPayments.length === 0 ? (
          <Typography color="text.secondary">No pending vendor payments</Typography>
        ) : (
          vendorPayments.map((payment) => (
            <Card key={payment.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start">
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {payment.notes}
                    </Typography>
                    <Typography color="text.secondary" gutterBottom>
                      {payment.vendor.name}
                    </Typography>
                    <Typography color="text.secondary">
                      Property: {payment.workOrder.maintenanceRequest.property.name}
                    </Typography>
                    <Typography color="text.secondary">
                      Date: {formatDate(payment.createdAt)}
                    </Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="h5" color="primary">
                      {formatCurrency(payment.amount)}
                    </Typography>
                  </Box>
                </Box>
                <Box display="flex" gap={1} sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => handleApproveVendorPayment(payment.id)}
                    size="small"
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={() => handleRejectVendorPayment(payment.id)}
                    size="small"
                  >
                    Reject
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))
        )}
      </Box>
    </Box>
  );
};

export default PaymentApproval;