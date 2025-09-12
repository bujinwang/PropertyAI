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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { dashboardService, WorkOrder, MaintenanceRequest } from '../services/dashboardService';

type Values = {
  requestId: string;
  assignedStaff: string;
  scheduledDate: Date | null;
  notes: string;
  status: 'pending' | 'in progress' | 'completed';
};

interface WorkOrderFormProps {
  open: boolean;
  onClose: () => void;
  onSubmitSuccess?: () => void;
  initialValues?: Partial<WorkOrder>;
  isEdit?: boolean;
  workOrderId?: string;
}

const validationSchema = Yup.object<Values>({
  requestId: Yup.string().required('Maintenance request is required'),
  assignedStaff: Yup.string().required('Assigned staff is required').min(2, 'Assigned staff must be at least 2 characters'),
  scheduledDate: Yup.date().required('Scheduled date is required').nullable(),
  notes: Yup.string(),
  status: Yup.string().required('Status is required').oneOf(['pending', 'in progress', 'completed']),
});

const statuses = [
  { value: 'pending', label: 'Pending' },
  { value: 'in progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

const WorkOrderForm: React.FC<WorkOrderFormProps> = ({
  open,
  onClose,
  onSubmitSuccess,
  initialValues = {},
  isEdit = false,
  workOrderId
}) => {
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await dashboardService.getMaintenanceRequests(1, 100, undefined, 'open,in_progress');
        setMaintenanceRequests(response.data);
      } catch (error) {
        console.error('Error fetching maintenance requests:', error);
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
        scheduledDate: values.scheduledDate ? values.scheduledDate.toISOString().split('T')[0] : '',
        completedDate: values.status === 'completed' ? new Date().toISOString().split('T')[0] : undefined,
      } as Omit<WorkOrder, 'id' | 'createdAt' | 'updatedAt'>;

      if (isEdit && workOrderId) {
        await dashboardService.updateWorkOrder(workOrderId, submitValues);
        // Sync maintenance request status
        if (values.status === 'completed') {
          await dashboardService.updateMaintenanceRequest(values.requestId, { status: 'closed' });
        }
      } else {
        await dashboardService.createWorkOrder(submitValues);
      }

      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
      onClose();
    } catch (error) {
      console.error('Error saving work order:', error);
      throw error;
    }
  };

  const initialFormValues: Values = {
    requestId: initialValues?.requestId || '',
    assignedStaff: initialValues?.assignedStaff || '',
    scheduledDate: initialValues?.scheduledDate ? new Date(initialValues.scheduledDate) : null,
    notes: initialValues?.notes || '',
    status: initialValues?.status || 'pending',
  };

  const selectedRequest = maintenanceRequests.find(req => req.id === initialFormValues.requestId);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6">
            {isEdit ? 'Edit Work Order' : 'Create New Work Order'}
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
                  <FormControl fullWidth error={Boolean(touched.requestId && errors.requestId)}>
                    <Autocomplete
                      options={maintenanceRequests}
                      getOptionLabel={(option) => `${option.title} - ${option.description.substring(0, 50)}...`}
                      value={selectedRequest || null}
                      onChange={(event, newValue) => {
                        setFieldValue('requestId', newValue?.id || '');
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Maintenance Request"
                          required
                          error={touched.requestId && Boolean(errors.requestId)}
                          helperText={touched.requestId && errors.requestId}
                        />
                      )}
                      loading={loading}
                    />
                  </FormControl>

                  <FormControl fullWidth error={Boolean(touched.assignedStaff && errors.assignedStaff)}>
                    <Field
                      as={TextField}
                      name="assignedStaff"
                      label="Assigned Staff"
                      fullWidth
                      required
                      helperText={touched.assignedStaff && errors.assignedStaff ? (errors.assignedStaff as string) : ''}
                    />
                  </FormControl>

                  <FormControl fullWidth error={Boolean(touched.scheduledDate && errors.scheduledDate)}>
                    <DatePicker
                      label="Scheduled Date"
                      value={values.scheduledDate}
                      onChange={(newValue) => setFieldValue('scheduledDate', newValue)}
                      slotProps={{
                        textField: {
                          required: true,
                          error: touched.scheduledDate && Boolean(errors.scheduledDate),
                          helperText: touched.scheduledDate && errors.scheduledDate ? (errors.scheduledDate as string) : '',
                        },
                      }}
                    />
                  </FormControl>

                  <FormControl fullWidth error={Boolean(touched.notes && errors.notes)}>
                    <Field
                      as={TextField}
                      name="notes"
                      label="Notes"
                      multiline
                      rows={3}
                      fullWidth
                      helperText={touched.notes && errors.notes ? (errors.notes as string) : ''}
                    />
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

export default WorkOrderForm;