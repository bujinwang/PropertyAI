import React from 'react';
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
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { dashboardService, Tenant } from '../services/dashboardService';

type Values = {
  name: string;
  email: string;
  phone?: string;
  leaseStart: Date;
  leaseEnd?: Date;
  status: 'active' | 'pending' | 'evicted';
};

interface TenantFormProps {
  open: boolean;
  onClose: () => void;
  onSubmitSuccess?: () => void;
  initialValues?: Partial<Omit<Tenant, 'id' | 'createdAt' | 'updatedAt' | 'unitId'>>;
  isEdit?: boolean;
  tenantId?: string;
}

const validationSchema = Yup.object<Values>({
  name: Yup.string().required('Name is required'),
  email: Yup.string().required('Email is required').email('Invalid email format'),
  phone: Yup.string(),
  leaseStart: Yup.date().required('Lease start is required').min(new Date(), 'Lease start must be today or later'),
  leaseEnd: Yup.date().when('leaseStart', {
    is: (leaseStart: Date) => !!leaseStart,
    then: (schema) => schema.min(Yup.ref('leaseStart'), 'Lease end must be after start date'),
  }),
  status: Yup.string().required('Status is required').oneOf(['active', 'pending', 'evicted']),
});

const statuses = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'evicted', label: 'Evicted' },
];

const TenantForm: React.FC<TenantFormProps> = ({ 
  open, 
  onClose, 
  onSubmitSuccess, 
  initialValues = {}, 
  isEdit = false, 
  tenantId 
}) => {
  const handleSubmit = async (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
    try {
      const submitValues = {
        ...values,
        leaseStart: values.leaseStart.toISOString().split('T')[0],
        leaseEnd: values.leaseEnd ? values.leaseEnd.toISOString().split('T')[0] : undefined,
      } as Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>;
      if (isEdit && tenantId) {
        await dashboardService.updateTenant(tenantId, submitValues);
      } else {
        await dashboardService.createTenant(submitValues);
      }
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
      onClose();
    } catch (error) {
      console.error('Error saving tenant:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const initialFormValues: Values = {
    name: initialValues?.name || '',
    email: initialValues?.email || '',
    phone: initialValues?.phone || '',
    leaseStart: initialValues?.leaseStart ? new Date(initialValues.leaseStart as string) : new Date(),
    leaseEnd: initialValues?.leaseEnd ? new Date(initialValues.leaseEnd as string) : undefined,
    status: initialValues?.status || 'pending',
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6">
            {isEdit ? 'Edit Tenant' : 'Create New Tenant'}
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
                  <FormControl fullWidth error={Boolean(touched.name && errors.name)}>
                    <Field
                      as={TextField}
                      name="name"
                      label="Name"
                      fullWidth
                      required
                      helperText={touched.name && errors.name ? (errors.name as string) : ''}
                    />
                  </FormControl>

                  <FormControl fullWidth error={Boolean(touched.email && errors.email)}>
                    <Field
                      as={TextField}
                      name="email"
                      label="Email"
                      type="email"
                      fullWidth
                      required
                      helperText={touched.email && errors.email ? (errors.email as string) : ''}
                    />
                  </FormControl>

                  <FormControl fullWidth>
                    <Field
                      as={TextField}
                      name="phone"
                      label="Phone"
                      fullWidth
                      helperText={touched.phone && errors.phone ? (errors.phone as string) : ''}
                    />
                  </FormControl>

                  <FormControl fullWidth error={Boolean(touched.leaseStart && errors.leaseStart)}>
                    <DatePicker
                      label="Lease Start"
                      value={values.leaseStart}
                      onChange={(date) => setFieldValue('leaseStart', date)}
                      minDate={new Date()}
                      slotProps={{
                        textField: {
                          required: true,
                          error: touched.leaseStart && Boolean(errors.leaseStart),
                          helperText: touched.leaseStart && errors.leaseStart ? (errors.leaseStart as unknown as string) : '',
                        },
                      }}
                    />
                  </FormControl>

                  <FormControl fullWidth error={Boolean(touched.leaseEnd && errors.leaseEnd)}>
                    <DatePicker
                      label="Lease End"
                      value={values.leaseEnd}
                      onChange={(date) => setFieldValue('leaseEnd', date)}
                      minDate={values.leaseStart}
                      slotProps={{
                        textField: {
                          error: touched.leaseEnd && Boolean(errors.leaseEnd),
                          helperText: touched.leaseEnd && errors.leaseEnd ? (errors.leaseEnd as unknown as string) : '',
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

export default TenantForm;