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
import { dashboardService, Lease, Tenant, UnitOption } from '../services/dashboardService';

type Values = {
  tenantId: string;
  unitId: string;
  startDate: Date;
  endDate: Date;
  rentAmount: number;
  paymentFrequency: 'monthly' | 'quarterly' | 'annually';
  status: 'active' | 'expired' | 'renewed';
};

interface LeaseFormProps {
  open: boolean;
  onClose: () => void;
  onSubmitSuccess?: () => void;
  initialValues?: Partial<Lease>;
  isEdit?: boolean;
  leaseId?: string;
}

const validationSchema = Yup.object<Values>({
  tenantId: Yup.string().required('Tenant is required'),
  unitId: Yup.string().required('Unit is required'),
  startDate: Yup.date().required('Start date is required'),
  endDate: Yup.date().required('End date is required').min(Yup.ref('startDate'), 'End date must be after start date'),
  rentAmount: Yup.number().required('Rent amount is required').positive('Rent amount must be positive'),
  paymentFrequency: Yup.string().required('Payment frequency is required').oneOf(['monthly', 'quarterly', 'annually']),
  status: Yup.string().required('Status is required').oneOf(['active', 'expired', 'renewed']),
});

const statuses = [
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'renewed', label: 'Renewed' },
];

const paymentFrequencies = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
];

const LeaseForm: React.FC<LeaseFormProps> = ({
  open,
  onClose,
  onSubmitSuccess,
  initialValues = {},
  isEdit = false,
  leaseId
}) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [tenantsResponse, unitsResponse] = await Promise.all([
          dashboardService.getTenants(1, 100), // Get all tenants for autocomplete
          dashboardService.getVacantUnitOptions(),
        ]);
        setTenants(tenantsResponse.data);
        setUnits(unitsResponse);
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

  const handleSubmit = async (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
    try {
      const submitValues = {
        ...values,
        startDate: values.startDate.toISOString().split('T')[0],
        endDate: values.endDate.toISOString().split('T')[0],
      } as Omit<Lease, 'id' | 'createdAt' | 'updatedAt'>;
      if (isEdit && leaseId) {
        await dashboardService.updateLease(leaseId, submitValues);
      } else {
        await dashboardService.createLease(submitValues);
      }
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
      onClose();
    } catch (error) {
      console.error('Error saving lease:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const initialFormValues: Values = {
    tenantId: initialValues?.tenantId || '',
    unitId: initialValues?.unitId || '',
    startDate: initialValues?.startDate ? new Date(initialValues.startDate) : new Date(),
    endDate: initialValues?.endDate ? new Date(initialValues.endDate) : new Date(),
    rentAmount: initialValues?.rentAmount || 0,
    paymentFrequency: initialValues?.paymentFrequency || 'monthly',
    status: initialValues?.status || 'active',
  };

  const selectedTenant = tenants.find(t => t.id === initialFormValues.tenantId);
  const selectedUnit = units.find(u => u.id === initialFormValues.unitId);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6">
            {isEdit ? 'Edit Lease' : 'Create New Lease'}
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
                      getOptionLabel={(option) => `${option.name} (${option.email})`}
                      value={selectedTenant || null}
                      onChange={(event, newValue) => {
                        setFieldValue('tenantId', newValue?.id || '');
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Tenant"
                          required
                          error={touched.tenantId && Boolean(errors.tenantId)}
                          helperText={touched.tenantId && errors.tenantId}
                        />
                      )}
                      loading={loading}
                    />
                  </FormControl>

                  <FormControl fullWidth error={Boolean(touched.unitId && errors.unitId)}>
                    <Autocomplete
                      options={units}
                      getOptionLabel={(option) => `${option.unitNumber} - ${option.address}`}
                      value={selectedUnit || null}
                      onChange={(event, newValue) => {
                        setFieldValue('unitId', newValue?.id || '');
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Unit"
                          required
                          error={touched.unitId && Boolean(errors.unitId)}
                          helperText={touched.unitId && errors.unitId}
                        />
                      )}
                      loading={loading}
                    />
                  </FormControl>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControl fullWidth error={Boolean(touched.startDate && errors.startDate)}>
                      <DatePicker
                        label="Start Date"
                        value={values.startDate}
                        onChange={(date) => setFieldValue('startDate', date)}
                        slotProps={{
                          textField: {
                            required: true,
                            error: touched.startDate && Boolean(errors.startDate),
                            helperText: touched.startDate && errors.startDate ? (errors.startDate as unknown as string) : '',
                          },
                        }}
                      />
                    </FormControl>

                    <FormControl fullWidth error={Boolean(touched.endDate && errors.endDate)}>
                      <DatePicker
                        label="End Date"
                        value={values.endDate}
                        onChange={(date) => setFieldValue('endDate', date)}
                        minDate={values.startDate}
                        slotProps={{
                          textField: {
                            required: true,
                            error: touched.endDate && Boolean(errors.endDate),
                            helperText: touched.endDate && errors.endDate ? (errors.endDate as unknown as string) : '',
                          },
                        }}
                      />
                    </FormControl>
                  </Box>

                  <FormControl fullWidth error={Boolean(touched.rentAmount && errors.rentAmount)}>
                    <Field
                      as={TextField}
                      name="rentAmount"
                      label="Rent Amount"
                      type="number"
                      fullWidth
                      required
                      helperText={touched.rentAmount && errors.rentAmount ? (errors.rentAmount as string) : ''}
                    />
                  </FormControl>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControl fullWidth error={Boolean(touched.paymentFrequency && errors.paymentFrequency)}>
                      <InputLabel>Payment Frequency</InputLabel>
                      <Field
                        as={Select}
                        name="paymentFrequency"
                        label="Payment Frequency"
                        required
                        onChange={(e: React.ChangeEvent<{ value: unknown }>) => setFieldValue('paymentFrequency', e.target.value)}
                      >
                        <MenuItem value="">
                          <em>Select Frequency</em>
                        </MenuItem>
                        {paymentFrequencies.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Field>
                      {touched.paymentFrequency && errors.paymentFrequency && (
                        <FormHelperText>{errors.paymentFrequency as string}</FormHelperText>
                      )}
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

export default LeaseForm;