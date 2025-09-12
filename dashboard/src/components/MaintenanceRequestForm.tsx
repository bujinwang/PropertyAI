import React, { useState, useEffect } from 'react';
import { Formik, Form, Field } from 'formik';
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
import { dashboardService, MaintenanceRequest, Tenant, UnitOption } from '../services/dashboardService';

type Values = {
  tenantId: string;
  unitId: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'closed' | 'cancelled';
};

interface MaintenanceRequestFormProps {
  open: boolean;
  onClose: () => void;
  onSubmitSuccess?: () => void;
  initialValues?: Partial<MaintenanceRequest>;
  isEdit?: boolean;
  requestId?: string;
}

const validationSchema = Yup.object<Values>({
  tenantId: Yup.string().required('Tenant is required'),
  unitId: Yup.string().required('Unit is required'),
  description: Yup.string().required('Description is required').min(10, 'Description must be at least 10 characters'),
  priority: Yup.string().required('Priority is required').oneOf(['low', 'medium', 'high']),
  status: Yup.string().required('Status is required').oneOf(['open', 'in_progress', 'closed', 'cancelled']),
});

const priorities = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const statuses = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'closed', label: 'Closed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const MaintenanceRequestForm: React.FC<MaintenanceRequestFormProps> = ({
  open,
  onClose,
  onSubmitSuccess,
  initialValues = {},
  isEdit = false,
  requestId
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

  const handleSubmit = async (values: Values) => {
    try {
      const submitValues = {
        ...values,
        propertyId: '', // Will be determined from unit
      } as Omit<MaintenanceRequest, 'id' | 'submittedAt' | 'updatedAt'>;

      let maintenanceRequest;
      if (isEdit && requestId) {
        maintenanceRequest = await dashboardService.updateMaintenanceRequest(requestId, submitValues);
        // Trigger notification for status changes
        if (values.status === 'closed') {
          try {
            await dashboardService.triggerMaintenanceNotification(requestId, 'completed');
          } catch (notificationError) {
            console.warn('Failed to trigger completion notification:', notificationError);
          }
        }
      } else {
        maintenanceRequest = await dashboardService.createMaintenanceRequest(submitValues);
        // Trigger notification for new maintenance request
        try {
          await dashboardService.triggerMaintenanceNotification(maintenanceRequest.id, 'created');
        } catch (notificationError) {
          console.warn('Failed to trigger creation notification:', notificationError);
        }
      }
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
      onClose();
    } catch (error) {
      console.error('Error saving maintenance request:', error);
      throw error; // Let Formik handle the error
    }
  };

  const initialFormValues: Values = {
    tenantId: initialValues?.tenantId || '',
    unitId: initialValues?.unitId || '',
    description: initialValues?.description || '',
    priority: initialValues?.priority || 'medium',
    status: initialValues?.status || 'open',
  };

  const selectedTenant = tenants.find(t => t.id === initialFormValues.tenantId);
  const selectedUnit = units.find(u => u.id === initialFormValues.unitId);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6">
          {isEdit ? 'Edit Maintenance Request' : 'Create New Maintenance Request'}
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

                <FormControl fullWidth error={Boolean(touched.description && errors.description)}>
                  <Field
                    as={TextField}
                    name="description"
                    label="Description"
                    multiline
                    rows={4}
                    fullWidth
                    required
                    helperText={touched.description && errors.description ? (errors.description as string) : ''}
                  />
                </FormControl>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl fullWidth error={Boolean(touched.priority && errors.priority)}>
                    <InputLabel>Priority</InputLabel>
                    <Field
                      as={Select}
                      name="priority"
                      label="Priority"
                      required
                      onChange={(e: any) => setFieldValue('priority', e.target.value)}
                    >
                      <MenuItem value="">
                        <em>Select Priority</em>
                      </MenuItem>
                      {priorities.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Field>
                    {touched.priority && errors.priority && (
                      <FormHelperText>{errors.priority as string}</FormHelperText>
                    )}
                  </FormControl>

                  <FormControl fullWidth error={Boolean(touched.status && errors.status)}>
                    <InputLabel>Status</InputLabel>
                    <Field
                      as={Select}
                      name="status"
                      label="Status"
                      required
                      onChange={(e: any) => setFieldValue('status', e.target.value)}
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
  );
};

export default MaintenanceRequestForm;