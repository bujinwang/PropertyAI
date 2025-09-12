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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { dashboardService, Tenant, UnitOption, Lease } from '../services/dashboardService';

interface AssociationModalProps {
  open: boolean;
  onClose: () => void;
  leaseId: string;
  mode: 'associate' | 'renew';
  propertyId?: string;
  onSubmit: (data: any) => void;
}

const AssociationModal: React.FC<AssociationModalProps> = ({
  open,
  onClose,
  leaseId,
  mode,
  propertyId,
  onSubmit,
}) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmRenewOpen, setConfirmRenewOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!open) return;

      setLoading(true);
      try {
        if (mode === 'associate') {
          let tenantsData: Tenant[];
          if (propertyId) {
            tenantsData = await dashboardService.getAvailableTenants(propertyId);
          } else {
            const tenantsResponse = await dashboardService.getTenants(1, 100);
            tenantsData = tenantsResponse.data;
          }
          const unitsResponse = await dashboardService.getVacantUnitOptions(propertyId);
          setTenants(tenantsData);
          setUnits(unitsResponse);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [open, mode, propertyId]);

  const validationSchema = Yup.object({
    tenantId: mode === 'associate' ? Yup.string().required('Tenant is required') : Yup.string(),
    unitId: mode === 'associate' ? Yup.string().required('Unit is required') : Yup.string(),
    newEndDate: mode === 'renew' ? Yup.date().required('New end date is required') : Yup.date(),
  });

  const formik = useFormik({
    initialValues: {
      tenantId: '',
      unitId: '',
      newEndDate: null as Date | null,
    },
    validationSchema,
    onSubmit: (values) => {
      if (mode === 'renew') {
        setConfirmRenewOpen(true);
      } else {
        handleAssociation(values);
      }
    },
  });

  const handleAssociation = async (values: any) => {
    try {
      if (mode === 'associate') {
        await dashboardService.associateLeaseToTenantUnit(leaseId, values.tenantId, values.unitId);
        onSubmit({ mode: 'associate', ...values });
      } else if (mode === 'renew') {
        const newEndDate = values.newEndDate?.toISOString().split('T')[0];
        await dashboardService.renewLease(leaseId, newEndDate);
        onSubmit({ mode: 'renew', newEndDate });
      }
      onClose();
    } catch (error) {
      console.error('Error:', error);
      // Error handling will be done by parent component
    }
  };

  const handleConfirmRenew = () => {
    setConfirmRenewOpen(false);
    handleAssociation(formik.values);
  };

  const selectedTenant = tenants.find(t => t.id === formik.values.tenantId);
  const selectedUnit = units.find(u => u.id === formik.values.unitId);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {mode === 'associate' ? 'Associate Lease to Tenant & Unit' : 'Renew Lease'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {mode === 'associate' && (
              <>
                <FormControl fullWidth error={formik.touched.tenantId && Boolean(formik.errors.tenantId)}>
                  <Autocomplete
                    options={tenants}
                    getOptionLabel={(option) => `${option.name} (${option.email})`}
                    value={selectedTenant || null}
                    onChange={(_, newValue) => {
                      formik.setFieldValue('tenantId', newValue?.id || '');
                    }}
                    loading={loading}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Available Tenant"
                        required
                        error={formik.touched.tenantId && Boolean(formik.errors.tenantId)}
                        helperText={formik.touched.tenantId && formik.errors.tenantId}
                      />
                    )}
                  />
                </FormControl>

                <FormControl fullWidth error={formik.touched.unitId && Boolean(formik.errors.unitId)}>
                  <Autocomplete
                    options={units}
                    getOptionLabel={(option) => `${option.unitNumber} - ${option.address}`}
                    value={selectedUnit || null}
                    onChange={(_, newValue) => {
                      formik.setFieldValue('unitId', newValue?.id || '');
                    }}
                    loading={loading}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Vacant Unit"
                        required
                        error={formik.touched.unitId && Boolean(formik.errors.unitId)}
                        helperText={formik.touched.unitId && formik.errors.unitId}
                      />
                    )}
                  />
                </FormControl>
              </>
            )}

            {mode === 'renew' && (
              <Box>
                <Typography variant="body1" gutterBottom>
                  Extend the lease end date:
                </Typography>
                <FormControl fullWidth error={formik.touched.newEndDate && Boolean(formik.errors.newEndDate)}>
                  <DatePicker
                    label="New End Date"
                    value={formik.values.newEndDate}
                    onChange={(value) => formik.setFieldValue('newEndDate', value)}
                    slotProps={{
                      textField: {
                        required: true,
                        error: formik.touched.newEndDate && Boolean(formik.errors.newEndDate),
                        helperText: formik.touched.newEndDate && formik.errors.newEndDate,
                      },
                    }}
                  />
                </FormControl>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => formik.handleSubmit()}
            variant="contained"
            disabled={!formik.isValid || formik.isSubmitting}
          >
            {mode === 'associate' ? 'Associate' : 'Renew'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog for Renewal */}
      <Dialog open={confirmRenewOpen} onClose={() => setConfirmRenewOpen(false)}>
        <DialogTitle>Confirm Lease Renewal</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to renew this lease? The end date will be extended to{' '}
            {formik.values.newEndDate?.toLocaleDateString()}.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmRenewOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmRenew} variant="contained" color="primary">
            Confirm Renewal
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default AssociationModal;