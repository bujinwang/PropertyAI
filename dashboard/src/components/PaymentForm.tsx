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
  Autocomplete,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { dashboardService, PaymentRecord, Tenant, Lease } from '../services/dashboardService';

type Values = Omit<PaymentRecord, 'id' | 'createdAt' | 'updatedAt' | 'tenantName' | 'leaseDetails'>;

interface PaymentFormProps {
  open: boolean;
  onClose: () => void;
  onSubmitSuccess?: () => void;
  initialValues?: Partial<Values>;
  isEdit?: boolean;
  paymentId?: string;
}

const validationSchema = Yup.object<Values>({
  tenantId: Yup.string().required('Tenant is required'),
  leaseId: Yup.string().required('Lease is required'),
  amount: Yup.number().required('Amount is required').positive('Must be positive'),
  paymentMethod: Yup.string().required('Payment method is required'),
  paymentDate: Yup.date().required('Payment date is required'),
  status: Yup.string().required('Status is required'),
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
  paymentId
}) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [tenantsData, leasesData] = await Promise.all([
          dashboardService.getTenants(1, 100), // Get all tenants for autocomplete
          dashboardService.getLeases(1, 100), // Get all leases for autocomplete
        ]);
        setTenants(tenantsData.data);
        setLeases(leasesData.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchData();
    }
  }, [open]);

  const handleSubmit = async (values: any, { setSubmitting }: FormikHelpers<any>) => {
    try {
      const submitValues = {
        ...values,
        paymentDate: values.paymentDate instanceof Date ? values.paymentDate.toISOString().split('T')[0] : values.paymentDate,
      };

      if (isEdit && paymentId) {
        await dashboardService.updatePaymentRecord(paymentId, submitValues);
      } else {
        await dashboardService.createPaymentRecord(submitValues);
      }
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
      onClose();
    } catch (error) {
      console.error('Error saving payment record:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const initialFormValues: any = {
    tenantId: initialValues.tenantId || '',
    leaseId: initialValues.leaseId || '',
    amount: initialValues.amount || 0,
    paymentMethod: initialValues.paymentMethod || 'cash',
    paymentDate: initialValues.paymentDate ? (typeof initialValues.paymentDate === 'string' ? new Date(initialValues.paymentDate) : initialValues.paymentDate) : new Date(),
    status: initialValues.status || 'pending',
    notes: initialValues.notes || '',
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
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
                  <FormControl fullWidth error={Boolean(touched.tenantId && errors.tenantId)}>
                    <Autocomplete
                      options={tenants}
                      getOptionLabel={(option) => option.name}
                      value={tenants.find(t => t.id === values.tenantId) || null}
                      onChange={(event, newValue) => {
                        setFieldValue('tenantId', newValue?.id || '');
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Tenant"
                          required
                          error={Boolean(touched.tenantId && errors.tenantId)}
                          helperText={touched.tenantId && errors.tenantId ? (errors.tenantId as string) : ''}
                        />
                      )}
                      loading={loading}
                    />
                  </FormControl>

                  <FormControl fullWidth error={Boolean(touched.leaseId && errors.leaseId)}>
                    <Autocomplete
                      options={leases}
                      getOptionLabel={(option) => `${option.tenantName} - ${option.unitAddress} (${option.startDate} to ${option.endDate})`}
                      value={leases.find(l => l.id === values.leaseId) || null}
                      onChange={(event, newValue) => {
                        setFieldValue('leaseId', newValue?.id || '');
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Lease"
                          required
                          error={Boolean(touched.leaseId && errors.leaseId)}
                          helperText={touched.leaseId && errors.leaseId ? (errors.leaseId as string) : ''}
                        />
                      )}
                      loading={loading}
                    />
                  </FormControl>

                  <Box sx={{ display: 'flex', gap: 2 }}>
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
                        <MenuItem value="">
                          <em>Select Method</em>
                        </MenuItem>
                        {paymentMethods.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Field>
                      {touched.paymentMethod && errors.paymentMethod && (
                        <FormHelperText>{errors.paymentMethod as string}</FormHelperText>
                      )}
                    </FormControl>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControl fullWidth>
                      <DatePicker
                        label="Payment Date"
                        value={values.paymentDate}
                        onChange={(newValue) => {
                          setFieldValue('paymentDate', newValue);
                        }}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            required: true,
                            error: Boolean(touched.paymentDate && errors.paymentDate),
                            helperText: touched.paymentDate && errors.paymentDate ? (errors.paymentDate as string) : '',
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
                        <MenuItem value="">
                          <em>Select Status</em>
                        </MenuItem>
                        {statuses.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Field>
                      {touched.status && errors.status && (
                        <FormHelperText>{errors.status as string}</FormHelperText>
                      )}
                    </FormControl>
                  </Box>

                  <FormControl fullWidth>
                    <Field
                      as={TextField}
                      name="notes"
                      label="Notes"
                      multiline
                      rows={4}
                      fullWidth
                      helperText={touched.notes && errors.notes ? (errors.notes as string) : ''}
                    />
                  </FormControl>
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
