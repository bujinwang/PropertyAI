import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  CreditCard as CreditCardIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { paymentService, PaymentMethodResponse } from '../services/paymentService';
import PaymentSetup from './PaymentSetup';

interface PaymentMethodsListProps {
  tenantId: string;
}

const PaymentMethodsList: React.FC<PaymentMethodsListProps> = ({ tenantId }) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [openSetupDialog, setOpenSetupDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadPaymentMethods();
  }, [tenantId]);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await paymentService.getPaymentMethods();
      setPaymentMethods(response.paymentMethods);
    } catch (err: any) {
      console.error('Error loading payment methods:', err);
      setError(err.message || 'Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePaymentMethod = async (methodId: string) => {
    try {
      setError(null);
      await paymentService.removePaymentMethod(methodId);
      setPaymentMethods(paymentMethods.filter(method => method.id !== methodId));
      setSuccess('Payment method removed successfully');
    } catch (err: any) {
      console.error('Error removing payment method:', err);
      setError(err.message || 'Failed to remove payment method');
    }
  };

  const handleSetDefault = async (methodId: string) => {
    try {
      setError(null);
      await paymentService.setDefaultPaymentMethod(methodId);
      setPaymentMethods(paymentMethods.map(method =>
        method.id === methodId
          ? { ...method, isDefault: true }
          : { ...method, isDefault: false }
      ));
      setSuccess('Default payment method updated');
    } catch (err: any) {
      console.error('Error setting default payment method:', err);
      setError(err.message || 'Failed to update default payment method');
    }
  };

  const handlePaymentMethodAdded = () => {
    setOpenSetupDialog(false);
    setSuccess('Payment method added successfully');
    loadPaymentMethods(); // Refresh the list
  };

  const getPaymentMethodIcon = (type: string) => {
    return <CreditCardIcon />;
  };

  const formatPaymentMethod = (method: PaymentMethodResponse): string => {
    if (method.type === 'card' && method.card) {
      return `•••• •••• •••• ${method.card.last4}${method.card.brand ? ` (${method.card.brand})` : ''}`;
    } else if (method.type === 'us_bank_account' && method.bank) {
      return `Bank Account ••••${method.bank.last4}${method.bank.name ? ` (${method.bank.name})` : ''}`;
    }
    return method.displayName || 'Unknown Payment Method';
  };

  const getStatusColor = (expirationStatus: string) => {
    switch (expirationStatus) {
      case 'valid':
        return 'success';
      case 'expiring_soon':
        return 'warning';
      case 'expired':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatExpiryDate = (month?: number, year?: number): string => {
    if (!month || !year) return '';
    return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Payment Methods
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenSetupDialog(true)}
        >
          Add Payment Method
        </Button>
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

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : paymentMethods.length === 0 ? (
        <Alert severity="info">
          No payment methods found. Add your first payment method to get started with secure rent payments.
        </Alert>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {paymentMethods.map((method) => (
            <Box key={method.id} sx={{ minWidth: 300, flex: '1 1 auto', maxWidth: 400 }}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    {getPaymentMethodIcon(method.type)}
                    <Typography variant="h6">
                      {method.type === 'card' ? 'Credit Card' : 'Bank Account'}
                    </Typography>
                    {method.isDefault && (
                      <Chip
                        label="Default"
                        color="primary"
                        size="small"
                        icon={<StarIcon />}
                      />
                    )}
                  </Box>

                  <Typography variant="body1" gutterBottom>
                    {formatPaymentMethod(method)}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
                    <Chip
                      label={method.expirationStatus}
                      color={getStatusColor(method.expirationStatus) as any}
                      size="small"
                    />
                    {method.card && method.card.expMonth && method.card.expYear && (
                      <Typography variant="body2" color="text.secondary">
                        Expires: {formatExpiryDate(method.card.expMonth, method.card.expYear)}
                      </Typography>
                    )}
                  </Box>

                  <Typography variant="body2" color="text.secondary">
                    Added: {new Date(method.created).toLocaleDateString()}
                  </Typography>
                </CardContent>

                <Divider />

                <CardActions sx={{ justifyContent: 'space-between' }}>
                  <Box>
                    {!method.isDefault && !method.isExpired && (
                      <Button
                        size="small"
                        startIcon={<StarBorderIcon />}
                        onClick={() => handleSetDefault(method.id)}
                        sx={{ mr: 1 }}
                      >
                        Set Default
                      </Button>
                    )}
                    {method.isDefault && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CheckCircleIcon color="primary" fontSize="small" />
                        <Typography variant="body2" color="primary">
                          Default
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeletePaymentMethod(method.id)}
                    disabled={method.isDefault}
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>
      )}

      {/* Add Payment Method Dialog */}
      <Dialog
        open={openSetupDialog}
        onClose={() => setOpenSetupDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add Payment Method</DialogTitle>
        <DialogContent>
          <PaymentSetup
            onSuccess={handlePaymentMethodAdded}
            onCancel={() => setOpenSetupDialog(false)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSetupDialog(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentMethodsList;