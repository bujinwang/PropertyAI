import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Autocomplete,
  TextField,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { dashboardService, UnitOption } from '../services/dashboardService';

interface AssignmentModalProps {
  open: boolean;
  onClose: () => void;
  tenantId?: string;
  tenantIds?: string[]; // For bulk mode
  unitId?: string;
  mode: 'assign' | 'unassign' | 'bulk';
  propertyId?: string; // For filtering units
  onSubmit: (data: any) => void;
}

interface TenantOption {
  id: string;
  name: string;
}

const AssignmentModal: React.FC<AssignmentModalProps> = ({
  open,
  onClose,
  tenantId,
  tenantIds = [],
  unitId,
  mode,
  propertyId,
  onSubmit,
}) => {
  const [availableUnits, setAvailableUnits] = useState<UnitOption[]>([]);
  const [selectedUnits, setSelectedUnits] = useState<UnitOption[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (open && propertyId) {
      // Fetch vacant unit options
      dashboardService.getVacantUnitOptions(propertyId).then(setAvailableUnits);
    }
  }, [open, propertyId]);

  const validationSchema = Yup.object({
    unitId: mode === 'assign' ? Yup.string().required('Unit is required') : Yup.string(),
    unitIds: mode === 'bulk' ? Yup.array().min(1, 'At least one unit required').required('Units are required') : Yup.array(),
    leaseStart: (mode === 'assign' || mode === 'bulk') ? Yup.date().required('Lease start is required') : Yup.date(),
    leaseEnd: (mode === 'assign' || mode === 'bulk') ? Yup.date().required('Lease end is required').min(Yup.ref('leaseStart'), 'End date must be after start') : Yup.date(),
  });

  const formik = useFormik({
    initialValues: {
      unitId: unitId || '',
      unitIds: [],
      leaseStart: null,
      leaseEnd: null,
    },
    validationSchema,
    onSubmit: (values) => {
      onSubmit({
        ...values,
        tenantId,
        tenantIds: mode === 'bulk' ? tenantIds : undefined,
        mode,
      });
      onClose();
    },
  });

  const isAssignMode = mode === 'assign';

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isAssignMode ? 'Assign Tenant to Unit' : mode === 'unassign' ? 'Unassign Tenant' : 'Bulk Assignment'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {isAssignMode && (
              <>
                <Autocomplete
                  id="unit-select"
                  options={availableUnits}
                  getOptionLabel={(option) => `${option.unitNumber} - ${option.address}`}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  value={availableUnits.find(u => u.id === formik.values.unitId) || null}
                  onChange={(_, value) => formik.setFieldValue('unitId', value?.id || '')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Vacant Unit"
                      fullWidth
                      error={formik.touched.unitId && Boolean(formik.errors.unitId)}
                      helperText={formik.touched.unitId && formik.errors.unitId}
                    />
                  )}
                  // Units are already filtered to vacant in service
                />
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <DatePicker
                    label="Lease Start"
                    value={formik.values.leaseStart}
                    onChange={(value) => formik.setFieldValue('leaseStart', value)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: formik.touched.leaseStart && Boolean(formik.errors.leaseStart),
                        helperText: formik.touched.leaseStart && formik.errors.leaseStart,
                      },
                    }}
                  />
                  <DatePicker
                    label="Lease End"
                    value={formik.values.leaseEnd}
                    onChange={(value) => formik.setFieldValue('leaseEnd', value)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: formik.touched.leaseEnd && Boolean(formik.errors.leaseEnd),
                        helperText: formik.touched.leaseEnd && formik.errors.leaseEnd,
                      },
                    }}
                  />
                </Box>
              </>
            )}
            {mode === 'unassign' && (
              <Box>
                <Typography>Confirm unassigning tenant from unit?</Typography>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => setConfirmOpen(true)}
                  sx={{ mt: 2 }}
                >
                  Confirm Unassign
                </Button>
              </Box>
            )}
            {mode === 'bulk' && (
              <>
                <Typography variant="subtitle1" gutterBottom>
                  Assigning {tenantIds.length} selected tenants
                </Typography>
                <Box sx={{ mb: 2 }}>
                  {tenantIds.map(id => (
                    <Chip key={id} label={`Tenant ${id}`} sx={{ mr: 1, mb: 1 }} />
                  ))}
                </Box>
                <Autocomplete
                  multiple
                  id="units-multi-select"
                  options={availableUnits}
                  getOptionLabel={(option) => `${option.unitNumber} - ${option.address}`}
                  value={selectedUnits}
                  onChange={(_, value) => {
                    setSelectedUnits(value);
                    formik.setFieldValue('unitIds', value.map(u => u.id));
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Units"
                      fullWidth
                      error={formik.touched.unitIds && Boolean(formik.errors.unitIds)}
                      helperText={formik.touched.unitIds && formik.errors.unitIds}
                    />
                  )}
                />
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <DatePicker
                    label="Lease Start"
                    value={formik.values.leaseStart}
                    onChange={(value) => formik.setFieldValue('leaseStart', value)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: formik.touched.leaseStart && Boolean(formik.errors.leaseStart),
                        helperText: formik.touched.leaseStart && formik.errors.leaseStart,
                      },
                    }}
                  />
                  <DatePicker
                    label="Lease End"
                    value={formik.values.leaseEnd}
                    onChange={(value) => formik.setFieldValue('leaseEnd', value)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: formik.touched.leaseEnd && Boolean(formik.errors.leaseEnd),
                        helperText: formik.touched.leaseEnd && formik.errors.leaseEnd,
                      },
                    }}
                  />
                </Box>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => formik.handleSubmit()}
            color="primary"
            variant="contained"
            disabled={!formik.isValid || formik.isSubmitting}
          >
            {isAssignMode ? 'Assign' : mode === 'unassign' ? 'Unassign' : 'Assign Bulk'}
          </Button>
        </DialogActions>

        {/* Confirmation Dialog for Unassign */}
        <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
          <DialogTitle>Confirm Unassign</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to unassign this tenant from the unit? This action cannot be undone.</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                setConfirmOpen(false);
                formik.handleSubmit();
              }}
              color="error"
              variant="contained"
            >
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      </Dialog>
    </LocalizationProvider>
  );
};

export default AssignmentModal;