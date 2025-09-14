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
  CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { dashboardService, PaymentRecord, Tenant, Lease } from '../services/dashboardService';

type Values = {
  tenantId: string;
  leaseId: string;
  amount: number;
  paymentMethod: 'cash' | 'check' | 'bank_transfer' | 'credit_card';
  paymentDate: Date;
  status: 'pending' | 'completed' | 'failed';
  notes?: string;
};

interface PaymentFormProps {
  open: boolean;
  onClose: () => void;
  onSubmitSuccess?: (payment: PaymentRecord) => void;
  initialValues?: Partial<PaymentRecord>;
  isEdit?: boolean;
  paymentId?: string;
}

const validationSchema = Yup.object<Values>({
  tenantId: Yup.string().required('Tenant is required'),
  leaseId: Yup.string().required('Lease is required'),
  amount: Yup.number().required('Amount is required').positive('Amount must be positive'),
  paymentMethod: Yup.string().required('Payment method is required').oneOf(['cash', 'check', 'bank_transfer', 'credit_card']),
  paymentDate: Yup.date().required('Payment date is required'),
  status: Yup.string().required('Status is required').oneOf(['pending', 'completed', 'failed']),
  notes: Yup.string(),
});

const paymentMethods = [
  { value: 'cash', label: 'Cash' },
  { value: 'check', label: 'Check' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'credit_card', label: 'Credit Card' },
];

const statuses = [
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
];

const PaymentForm: React.FC<PaymentFormProps> = ({
  open,
  onClose,
  onSubmitSuccess,
  initialValues = {},
  isEdit = false,
  paymentId,
}) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadTenantsAndLeases();
    }
  }, [open]);

  const loadTenantsAndLeases = async () => {
    try {
      setLoading(true);
      const [tenantsData, leasesData] = await Promise.all([
        dashboardService.getTenants(),
        dashboardService.getLeases(),
      ]);
      setTenants(tenantsData.data);
      setLeases(leasesData.data);
    } catch (error) {
      console.error('Error loading tenants and leases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
    try {
      const submitValues = {
        ...values,
        paymentDate: values.paymentDate.toISOString().split('T')[0],
      };

      let result: PaymentRecord;
      if (isEdit && paymentId) {
        result = await dashboardService.updatePaymentRecord(paymentId, submitValues);
      } else {
        result = await dashboardService.createPaymentRecord(submitValues);
      }

      if (onSubmitSuccess) {
        onSubmitSuccess(result);
      }
      onClose();
    } catch (error) {
      console.error('Error saving payment record:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const initialFormValues: Values = {
    tenantId: initialValues.tenantId || '',
    leaseId: initialValues.leaseId || '',
    amount: initialValues.amount || 0,
    paymentMethod: initialValues.paymentMethod || 'cash',
    paymentDate: initialValues.paymentDate ? new Date(initialValues.paymentDate) : new Date(),
    status: initialValues.status || 'pending',
    notes: initialValues.notes || '',
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6">
            {isEdit ? 'Edit Payment Record' : 'Create New Payment Record'}
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
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <>
                      <FormControl fullWidth error={Boolean(touched.tenantId && errors.tenantId)}>
                        <InputLabel>Tenant</InputLabel>
                        <Field
                          as={Select}
                          name="tenantId"
                          label="Tenant"
                          required
                          onChange={(e: React.ChangeEvent<{ value: unknown }>) => setFieldValue('tenantId', e.target.value)}
                        >
                          <MenuItem value="">
                            <em>Select Tenant</em>
                          </MenuItem>
                          {tenants.map((tenant) => (
                            <MenuItem key={tenant.id} value={tenant.id}>
                              {tenant.name}
                            </MenuItem>
                          ))}
                        </Field>
                        {touched.tenantId && errors.tenantId && (
                          <FormHelperText>{errors.tenantId as string}</FormHelperText>
                        )}
                      </FormControl>

                      <FormControl fullWidth error={Boolean(touched.leaseId && errors.leaseId)}>
                        <InputLabel>Lease</InputLabel>
                        <Field
                          as={Select}
                          name="leaseId"
                          label="Lease"
                          required
                          onChange={(e: React.ChangeEvent<{ value: unknown }>) => setFieldValue('leaseId', e.target.value)}
                        >
                          <MenuItem value="">
                            <em>Select Lease</em>
                          </MenuItem>
                          {leases.map((lease) => (
                            <MenuItem key={lease.id} value={lease.id}>
                              {lease.tenantName} - {lease.unitAddress}
                            </MenuItem>
                          ))}
                        </Field>
                        {touched.leaseId && errors.leaseId && (
                          <FormHelperText>{errors.leaseId as string}</FormHelperText>
                        )}
                      </FormControl>

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

                      <FormControl fullWidth error={Boolean(touched.paymentMethod && errors.paymentMethod)}>
                        <InputLabel>Payment Method</InputLabel>
                        <Field
                          as={Select}
                          name="paymentMethod"
                          label="Payment Method"
                          required
                          onChange={(e: React.ChangeEvent<{ value: unknown }>) => setFieldValue('paymentMethod', e.target.value)}
                        >
                          {paymentMethods.map((method) => (
                            <MenuItem key={method.value} value={method.value}>
                              {method.label}
                            </MenuItem>
                          ))}
                        </Field>
                        {touched.paymentMethod && errors.paymentMethod && (
                          <FormHelperText>{errors.paymentMethod as string}</FormHelperText>
                        )}
                      </FormControl>

                      <FormControl fullWidth error={Boolean(touched.paymentDate && errors.paymentDate)}>
                        <DatePicker
                          label="Payment Date"
                          value={values.paymentDate}
                          onChange={(date) => setFieldValue('paymentDate', date)}
                          slotProps={{
                            textField: {
                              required: true,
                              error: touched.paymentDate && Boolean(errors.paymentDate),
                              helperText: touched.paymentDate && errors.paymentDate ? (errors.paymentDate as unknown as string) : '',
                            },
                          }}
                        />
                      </FormControl>

                      <FormControl fullWidth error={Boolean(touched.status && errors.status)}>
                        <InputLabel>Status</InputLabel>
                        <Field
                          as={Select}
                          name="status"
                          label="Status"
                          required
                          onChange={(e: React.ChangeEvent<{ value: unknown }>) => setFieldValue('status', e.target.value)}
                        >
                          {statuses.map((status) => (
                            <MenuItem key={status.value} value={status.value}>
                              {status.label}
                            </MenuItem>
                          ))}
                        </Field>
                        {touched.status && errors.status && (
                          <FormHelperText>{errors.status as string}</FormHelperText>
                        )}
                      </FormControl>

                      <FormControl fullWidth>
                        <Field
                          as={TextField}
                          name="notes"
                          label="Notes"
                          fullWidth
                          multiline
                          rows={3}
                          helperText={touched.notes && errors.notes ? (errors.notes as string) : ''}
                        />
                      </FormControl>
                    </>
                  )}
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" variant="contained" disabled={isSubmitting}>
                  {isEdit ? 'Update' : 'Create'}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </LocalizationProvider>
  );
};

export default PaymentForm;
