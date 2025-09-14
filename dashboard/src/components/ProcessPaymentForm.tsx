import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { dashboardService, PaymentMethod, ProcessPaymentData } from '../services/dashboardService';
import { paymentUtils } from '../utils/paymentUtils';

// Initialize Stripe (this should be done with your actual publishable key)
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '');

type Values = {
  amount: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';
  paymentMethodId: string;
  description?: string;
  tenantId: string;
  leaseId: string;
};

interface ProcessPaymentFormProps {
  open: boolean;
  onClose: () => void;
  onSubmitSuccess?: (transaction: any) => void;
  tenantId: string;
  leaseId: string;
  initialAmount?: number;
  initialDescription?: string;
}

const validationSchema = Yup.object<Values>({
  amount: Yup.number()
    .required('Amount is required')
    .positive('Amount must be positive')
    .max(1000000, 'Amount cannot exceed $1,000,000'),
  currency: Yup.string()
    .required('Currency is required')
    .oneOf(['USD', 'EUR', 'GBP', 'CAD', 'AUD'], 'Invalid currency'),
  paymentMethodId: Yup.string().required('Payment method is required'),
  description: Yup.string().max(500, 'Description cannot exceed 500 characters'),
  tenantId: Yup.string().required('Tenant ID is required'),
  leaseId: Yup.string().required('Lease ID is required'),
});

const currencies = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'CAD', label: 'CAD (C$)' },
  { value: 'AUD', label: 'AUD (A$)' },
];

const ProcessPaymentForm: React.FC<ProcessPaymentFormProps> = ({
  open,
  onClose,
  onSubmitSuccess,
  tenantId,
  leaseId,
  initialAmount = 0,
  initialDescription = '',
}) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && tenantId) {
      loadPaymentMethods();
    }
  }, [open, tenantId]);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      const methods = await dashboardService.getPaymentMethods(tenantId);
      setPaymentMethods(methods.filter(method => method.status === 'active'));
    } catch (err) {
      console.error('Error loading payment methods:', err);
      setError('Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
    try {
      setProcessing(true);
      setError(null);

      const paymentData: ProcessPaymentData = {
        tenantId: values.tenantId,
        leaseId: values.leaseId,
        amount: values.amount,
        currency: values.currency,
        paymentMethodId: values.paymentMethodId,
        description: values.description,
      };

      const transaction = await dashboardService.processPayment(paymentData);

      if (onSubmitSuccess) {
        onSubmitSuccess(transaction);
      }
      onClose();
    } catch (err: any) {
      console.error('Error processing payment:', err);
      setError(err.message || 'Payment processing failed');
    } finally {
      setProcessing(false);
      setSubmitting(false);
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

  const getPaymentMethodIcon = (method: PaymentMethod): string => {
    if (method.type === 'card') {
      return '💳';
    } else if (method.type === 'bank_account') {
      return '🏦';
    } else if (method.type === 'paypal') {
      return '🅿️';
    }
    return '💰';
  };

  const initialFormValues: Values = {
    amount: initialAmount,
    currency: 'USD',
    paymentMethodId: '',
    description: initialDescription,
    tenantId,
    leaseId,
  };

  return (
    <Elements stripe={stripePromise}>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6">
            Process Payment
          </Typography>
        </DialogTitle>
        <Formik
          initialValues={initialFormValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ isSubmitting, errors, touched, setFieldValue, values }) => (
            <Form>
              <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                  {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {error}
                    </Alert>
                  )}

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <FormControl fullWidth error={Boolean(touched.amount && errors.amount)}>
                      <Field
                        as={TextField}
                        name="amount"
                        label="Amount"
                        type="number"
                        fullWidth
                        required
                        inputProps={{ min: 0, step: 0.01 }}
                        helperText={touched.amount && errors.amount ? (errors.amount as string) : ''}
                      />
                    </FormControl>

                    <FormControl fullWidth error={Boolean(touched.currency && errors.currency)}>
                      <InputLabel>Currency</InputLabel>
                      <Field
                        as={Select}
                        name="currency"
                        label="Currency"
                        required
                        onChange={(e: React.ChangeEvent<{ value: unknown }>) => setFieldValue('currency', e.target.value)}
                      >
                        {currencies.map((currency) => (
                          <MenuItem key={currency.value} value={currency.value}>
                            {currency.label}
                          </MenuItem>
                        ))}
                      </Field>
                      {touched.currency && errors.currency && (
                        <FormHelperText>{errors.currency as string}</FormHelperText>
                      )}
                    </FormControl>
                  </Box>

                  <FormControl fullWidth>
                    <Field
                      as={TextField}
                      name="description"
                      label="Description (Optional)"
                      fullWidth
                      multiline
                      rows={2}
                      helperText={touched.description && errors.description ? (errors.description as string) : ''}
                    />
                  </FormControl>

                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Payment Method
                    </Typography>

                    {loading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                        <CircularProgress size={24} />
                      </Box>
                    ) : paymentMethods.length === 0 ? (
                      <Alert severity="info">
                        No payment methods available. Please add a payment method first.
                      </Alert>
                    ) : (
                      <FormControl fullWidth error={Boolean(touched.paymentMethodId && errors.paymentMethodId)}>
                        <InputLabel>Select Payment Method</InputLabel>
                        <Field
                          as={Select}
                          name="paymentMethodId"
                          label="Select Payment Method"
                          required
                          onChange={(e: React.ChangeEvent<{ value: unknown }>) => setFieldValue('paymentMethodId', e.target.value)}
                        >
                          {paymentMethods.map((method) => (
                            <MenuItem key={method.id} value={method.id}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography>{getPaymentMethodIcon(method)}</Typography>
                                <Box>
                                  <Typography variant="body2">
                                    {formatPaymentMethod(method)}
                                  </Typography>
                                  {method.isDefault && (
                                    <Chip label="Default" size="small" color="primary" />
                                  )}
                                </Box>
                              </Box>
                            </MenuItem>
                          ))}
                        </Field>
                        {touched.paymentMethodId && errors.paymentMethodId && (
                          <FormHelperText>{errors.paymentMethodId as string}</FormHelperText>
                        )}
                      </FormControl>
                    )}
                  </Box>

                  {values.amount > 0 && values.currency && (
                    <Card sx={{ bgcolor: 'grey.50' }}>
                      <CardContent>
                        <Typography variant="h6" color="primary">
                          Payment Summary
                        </Typography>
                        <Typography variant="body1">
                          Amount: {paymentUtils.formatCurrency(values.amount, values.currency)}
                        </Typography>
                        {values.description && (
                          <Typography variant="body2" color="text.secondary">
                            Description: {values.description}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={onClose} disabled={isSubmitting || processing}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting || processing || paymentMethods.length === 0}
                  startIcon={processing ? <CircularProgress size={16} /> : null}
                >
                  {processing ? 'Processing...' : 'Process Payment'}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </Elements>
  );
};

export default ProcessPaymentForm;