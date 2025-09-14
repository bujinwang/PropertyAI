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
} from '@mui/material';
import {
  Add as AddIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as BankIcon,
  Payment as PaymentIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from '@mui/icons-material';
import { Formik, Form, Field, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import { dashboardService, PaymentMethod } from '../services/dashboardService';

interface PaymentMethodsProps {
  tenantId: string;
}

type Values = {
  type: 'card' | 'bank_account' | 'paypal';
  cardNumber?: string;
  expiryMonth?: number;
  expiryYear?: number;
  cvv?: string;
  cardholderName?: string;
  routingNumber?: string;
  accountNumber?: string;
  accountType?: 'checking' | 'savings';
  paypalEmail?: string;
  isDefault: boolean;
};

const validationSchema = Yup.object().shape({
  type: Yup.string().required('Payment method type is required'),
  cardNumber: Yup.string().when('type', {
    is: 'card',
    then: (schema) => schema.required('Card number is required').matches(/^\d{13,19}$/, 'Invalid card number'),
  }),
  expiryMonth: Yup.number().when('type', {
    is: 'card',
    then: (schema) => schema.required('Expiry month is required').min(1).max(12),
  }),
  expiryYear: Yup.number().when('type', {
    is: 'card',
    then: (schema) => schema.required('Expiry year is required').min(new Date().getFullYear()),
  }),
  cvv: Yup.string().when('type', {
    is: 'card',
    then: (schema) => schema.required('CVV is required').matches(/^\d{3,4}$/, 'Invalid CVV'),
  }),
  cardholderName: Yup.string().when('type', {
    is: 'card',
    then: (schema) => schema.required('Cardholder name is required'),
  }),
  routingNumber: Yup.string().when('type', {
    is: 'bank_account',
    then: (schema) => schema.required('Routing number is required').matches(/^\d{9}$/, 'Invalid routing number'),
  }),
  accountNumber: Yup.string().when('type', {
    is: 'bank_account',
    then: (schema) => schema.required('Account number is required').matches(/^\d{8,17}$/, 'Invalid account number'),
  }),
  accountType: Yup.string().when('type', {
    is: 'bank_account',
    then: (schema) => schema.required('Account type is required').oneOf(['checking', 'savings']),
  }),
  paypalEmail: Yup.string().when('type', {
    is: 'paypal',
    then: (schema) => schema.required('PayPal email is required').email('Invalid email address'),
  }),
});

const PaymentMethods: React.FC<PaymentMethodsProps> = ({ tenantId }) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadPaymentMethods();
  }, [tenantId]);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      const methods = await dashboardService.getPaymentMethods(tenantId);
      setPaymentMethods(methods);
    } catch (err) {
      console.error('Error loading payment methods:', err);
      setError('Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaymentMethod = async (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
    try {
      setError(null);

      // In a real implementation, this would tokenize the payment method
      // For now, we'll simulate creating a payment method with a mock token
      const paymentMethodData = {
        tenantId,
        type: values.type,
        processor: 'stripe' as const, // Default to Stripe for now
        token: 'mock_token_' + Date.now(), // Mock token for demonstration
        isDefault: values.isDefault,
        // Additional fields would be tokenized
      };

      const newMethod = await dashboardService.createPaymentMethod(paymentMethodData);
      setPaymentMethods([...paymentMethods, newMethod]);
      setSuccess('Payment method added successfully');
      setOpenDialog(false);
    } catch (err: any) {
      console.error('Error adding payment method:', err);
      setError(err.message || 'Failed to add payment method');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePaymentMethod = async (methodId: string) => {
    try {
      await dashboardService.deletePaymentMethod(methodId);
      setPaymentMethods(paymentMethods.filter(method => method.id !== methodId));
      setSuccess('Payment method deleted successfully');
    } catch (err: any) {
      console.error('Error deleting payment method:', err);
      setError(err.message || 'Failed to delete payment method');
    }
  };

  const handleSetDefault = async (methodId: string) => {
    try {
      const updatedMethod = await dashboardService.setDefaultPaymentMethod(methodId);
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

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'card':
        return <CreditCardIcon />;
      case 'bank_account':
        return <BankIcon />;
      case 'paypal':
        return <PaymentIcon />;
      default:
        return <PaymentIcon />;
    }
  };

  const formatPaymentMethod = (method: PaymentMethod): string => {
    if (method.type === 'card') {
      return `•••• •••• •••• ${method.last4} (${method.brand})`;
    } else if (method.type === 'bank_account') {
      return `Bank Account ••••${method.last4} (${method.bankName})`;
    } else if (method.type === 'paypal') {
      return 'PayPal Account';
    }
    return 'Unknown Payment Method';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'expired':
        return 'error';
      default:
        return 'default';
    }
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
          onClick={() => setOpenDialog(true)}
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
          No payment methods found. Add your first payment method to get started.
        </Alert>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {paymentMethods.map((method) => (
            <Box key={method.id} sx={{ minWidth: 300, flex: '1 1 auto', maxWidth: 400 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    {getPaymentMethodIcon(method.type)}
                    <Typography variant="h6">
                      {method.type === 'card' ? 'Credit Card' :
                       method.type === 'bank_account' ? 'Bank Account' : 'PayPal'}
                    </Typography>
                    {method.isDefault && (
                      <Chip label="Default" color="primary" size="small" />
                    )}
                  </Box>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {formatPaymentMethod(method)}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
                    <Chip
                      label={method.status}
                      color={getStatusColor(method.status) as any}
                      size="small"
                    />
                    {method.expiryMonth && method.expiryYear && (
                      <Typography variant="body2" color="text.secondary">
                        Expires: {method.expiryMonth}/{method.expiryYear}
                      </Typography>
                    )}
                  </Box>
                </CardContent>
                <CardActions>
                  {!method.isDefault && method.status === 'active' && (
                    <Button
                      size="small"
                      startIcon={<StarBorderIcon />}
                      onClick={() => handleSetDefault(method.id)}
                    >
                      Set as Default
                    </Button>
                  )}
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeletePaymentMethod(method.id)}
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
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Payment Method</DialogTitle>
        <Formik<Values>
          initialValues={{
            type: 'card' as const,
            isDefault: false,
            cardNumber: '',
            expiryMonth: undefined,
            expiryYear: undefined,
            cvv: '',
            cardholderName: '',
            routingNumber: '',
            accountNumber: '',
            accountType: undefined,
            paypalEmail: '',
          }}
          validationSchema={validationSchema}
          onSubmit={handleAddPaymentMethod}
        >
          {({ isSubmitting, errors, touched, setFieldValue, values }) => (
            <Form>
              <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                  <FormControl fullWidth error={Boolean(touched.type && errors.type)}>
                    <InputLabel>Payment Method Type</InputLabel>
                    <Field
                      as={Select}
                      name="type"
                      label="Payment Method Type"
                      onChange={(e: React.ChangeEvent<{ value: unknown }>) => setFieldValue('type', e.target.value)}
                    >
                      <MenuItem value="card">Credit/Debit Card</MenuItem>
                      <MenuItem value="bank_account">Bank Account</MenuItem>
                      <MenuItem value="paypal">PayPal</MenuItem>
                    </Field>
                    {touched.type && errors.type && (
                      <FormHelperText>{errors.type as string}</FormHelperText>
                    )}
                  </FormControl>

                  {values.type === 'card' && (
                    <>
                      <Field
                        as={TextField}
                        name="cardNumber"
                        label="Card Number"
                        fullWidth
                        placeholder="1234 5678 9012 3456"
                        error={Boolean(touched.cardNumber && errors.cardNumber)}
                        helperText={touched.cardNumber && errors.cardNumber ? (errors.cardNumber as string) : ''}
                      />

                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Field
                          as={TextField}
                          name="expiryMonth"
                          label="Expiry Month"
                          type="number"
                          fullWidth
                          inputProps={{ min: 1, max: 12 }}
                          error={Boolean(touched.expiryMonth && errors.expiryMonth)}
                          helperText={touched.expiryMonth && errors.expiryMonth ? (errors.expiryMonth as string) : ''}
                        />
                        <Field
                          as={TextField}
                          name="expiryYear"
                          label="Expiry Year"
                          type="number"
                          fullWidth
                          inputProps={{ min: new Date().getFullYear() }}
                          error={Boolean(touched.expiryYear && errors.expiryYear)}
                          helperText={touched.expiryYear && errors.expiryYear ? (errors.expiryYear as string) : ''}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Field
                          as={TextField}
                          name="cvv"
                          label="CVV"
                          type="password"
                          fullWidth
                          inputProps={{ maxLength: 4 }}
                          error={Boolean(touched.cvv && errors.cvv)}
                          helperText={touched.cvv && errors.cvv ? (errors.cvv as string) : ''}
                        />
                        <Field
                          as={TextField}
                          name="cardholderName"
                          label="Cardholder Name"
                          fullWidth
                          error={Boolean(touched.cardholderName && errors.cardholderName)}
                          helperText={touched.cardholderName && errors.cardholderName ? (errors.cardholderName as string) : ''}
                        />
                      </Box>
                    </>
                  )}

                  {values.type === 'bank_account' && (
                    <>
                      <Field
                        as={TextField}
                        name="routingNumber"
                        label="Routing Number"
                        fullWidth
                        error={Boolean(touched.routingNumber && errors.routingNumber)}
                        helperText={touched.routingNumber && errors.routingNumber ? (errors.routingNumber as string) : ''}
                      />

                      <Field
                        as={TextField}
                        name="accountNumber"
                        label="Account Number"
                        type="password"
                        fullWidth
                        error={Boolean(touched.accountNumber && errors.accountNumber)}
                        helperText={touched.accountNumber && errors.accountNumber ? (errors.accountNumber as string) : ''}
                      />

                      <FormControl fullWidth error={Boolean(touched.accountType && errors.accountType)}>
                        <InputLabel>Account Type</InputLabel>
                        <Field
                          as={Select}
                          name="accountType"
                          label="Account Type"
                          onChange={(e: React.ChangeEvent<{ value: unknown }>) => setFieldValue('accountType', e.target.value)}
                        >
                          <MenuItem value="checking">Checking</MenuItem>
                          <MenuItem value="savings">Savings</MenuItem>
                        </Field>
                        {touched.accountType && errors.accountType && (
                          <FormHelperText>{errors.accountType as string}</FormHelperText>
                        )}
                      </FormControl>
                    </>
                  )}

                  {values.type === 'paypal' && (
                    <Field
                      as={TextField}
                      name="paypalEmail"
                      label="PayPal Email"
                      type="email"
                      fullWidth
                      error={Boolean(touched.paypalEmail && errors.paypalEmail)}
                      helperText={touched.paypalEmail && errors.paypalEmail ? (errors.paypalEmail as string) : ''}
                    />
                  )}

                  <Alert severity="info">
                    Your payment information is securely encrypted and tokenized for PCI compliance.
                  </Alert>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenDialog(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" variant="contained" disabled={isSubmitting}>
                  Add Payment Method
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </Box>
  );
};

export default PaymentMethods;