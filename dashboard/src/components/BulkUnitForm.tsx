import React from 'react';
import { Formik, Form, FieldArray, Field, FormikHelpers } from 'formik';
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
  IconButton,
  Divider,
  Chip,
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import { dashboardService, Unit } from '../services/dashboardService';

type BulkUnitValues = { units: Omit<Unit, 'id' | 'propertyId' | 'createdAt' | 'updatedAt'>[] };

interface BulkUnitFormProps {
  open: boolean;
  onClose: () => void;
  propertyId: string;
  onSuccess?: () => void;
}

const unitSchema = Yup.object({
  unitNumber: Yup.string().required('Unit number is required').matches(/^\d+[A-Za-z]?$/, 'Invalid unit number format'),
  type: Yup.string().required('Unit type is required'),
  occupancyStatus: Yup.string().required('Occupancy status is required'),
  rentAmount: Yup.number().required('Rent amount is required').positive('Rent must be > 0'),
  bedrooms: Yup.number().min(0).integer(),
  bathrooms: Yup.number().min(0.5),
  squareFeet: Yup.number().min(0).integer(),
  description: Yup.string(),
});

const validationSchema = Yup.object({
  units: Yup.array().of(unitSchema).min(1, 'At least one unit is required')
});

const unitTypes = [
  { value: 'STUDIO', label: 'Studio' },
  { value: '1-BEDROOM', label: '1 Bedroom' },
  { value: '2-BEDROOM', label: '2 Bedroom' },
  { value: '3-BEDROOM', label: '3 Bedroom' },
  { value: '4-BEDROOM', label: '4+ Bedroom' },
  { value: 'COMMERCIAL', label: 'Commercial' },
  { value: 'OTHER', label: 'Other' },
];

const occupancyStatuses = [
  { value: 'vacant', label: 'Vacant' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'maintenance', label: 'Maintenance' },
];

const BulkUnitForm: React.FC<BulkUnitFormProps> = ({ open, onClose, propertyId, onSuccess }) => {
  const handleSubmit = async (values: BulkUnitValues, { setSubmitting }: FormikHelpers<BulkUnitValues>) => {
    try {
      const createPromises = values.units.map((unit) => dashboardService.createUnit(propertyId, unit));
      await Promise.all(createPromises);
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      console.error('Error creating bulk units:', error);
      // Handle error, e.g., toast
    } finally {
      setSubmitting(false);
    }
  };

  const initialValues: BulkUnitValues = { units: [{ unitNumber: '', type: '', occupancyStatus: 'vacant', rentAmount: 0, bedrooms: 0, bathrooms: 1, squareFeet: 0, description: '' }] };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Bulk Add Units</DialogTitle>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, errors, values }) => (
          <Form>
            <DialogContent>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Add multiple units at once. Each unit will be created individually.
              </Typography>
              <FieldArray name="units">
                {({ push, remove }) => (
                  <Box>
                    {values.units.map((unit, index) => (
                      <Box key={index} sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle1">Unit {index + 1}</Typography>
                          {values.units.length > 1 && (
                            <IconButton type="button" onClick={() => remove(index)} size="small" color="error">
                              <RemoveCircleIcon />
                            </IconButton>
                          )}
                        </Box>
                        <Divider sx={{ mb: 2 }} />
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <FormControl fullWidth error={Boolean((errors.units as any[])[index]?.unitNumber)}>
                            <Field
                              as={TextField}
                              name={`units.${index}.unitNumber`}
                              label="Unit Number"
                              required
                              helperText={(errors.units as any[])[index]?.unitNumber}
                            />
                          </FormControl>

                          <FormControl fullWidth error={Boolean((errors.units as any[])[index]?.type)}>
                            <InputLabel>Type</InputLabel>
                            <Field
                              as={Select}
                              name={`units.${index}.type`}
                              label="Type"
                              required
                            >
                              {unitTypes.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                  {option.label}
                                </MenuItem>
                              ))}
                            </Field>
                            <FormHelperText>{(errors.units as any[])[index]?.type}</FormHelperText>
                          </FormControl>

                          <FormControl fullWidth error={Boolean((errors.units as any[])[index]?.occupancyStatus)}>
                            <InputLabel>Status</InputLabel>
                            <Field
                              as={Select}
                              name={`units.${index}.occupancyStatus`}
                              label="Status"
                              required
                            >
                              {occupancyStatuses.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                  {option.label}
                                </MenuItem>
                              ))}
                            </Field>
                            <FormHelperText>{(errors.units as any[])[index]?.occupancyStatus}</FormHelperText>
                          </FormControl>

                          <FormControl fullWidth error={Boolean((errors.units as any[])[index]?.rentAmount)}>
                            <Field
                              as={TextField}
                              name={`units.${index}.rentAmount`}
                              label="Rent Amount ($)"
                              type="number"
                              required
                              inputProps={{ step: '0.01', min: '0.01' }}
                              helperText={(errors.units as any[])[index]?.rentAmount}
                            />
                          </FormControl>

                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <FormControl fullWidth>
                              <Field
                                as={TextField}
                                name={`units.${index}.bedrooms`}
                                label="Bedrooms"
                                type="number"
                                inputProps={{ min: '0' }}
                              />
                            </FormControl>
                            <FormControl fullWidth>
                              <Field
                                as={TextField}
                                name={`units.${index}.bathrooms`}
                                label="Bathrooms"
                                type="number"
                                inputProps={{ min: '0.5', step: '0.5' }}
                              />
                            </FormControl>
                            <FormControl fullWidth>
                              <Field
                                as={TextField}
                                name={`units.${index}.squareFeet`}
                                label="Square Feet"
                                type="number"
                                inputProps={{ min: '0' }}
                              />
                            </FormControl>
                          </Box>

                          <FormControl fullWidth>
                            <Field
                              as={TextField}
                              name={`units.${index}.description`}
                              label="Description"
                              multiline
                              rows={2}
                            />
                          </FormControl>
                        </Box>
                      </Box>
                    ))}
                    <Button
                      type="button"
                      onClick={() => push({ unitNumber: '', type: '', occupancyStatus: 'vacant', rentAmount: 0, bedrooms: 0, bathrooms: 1, squareFeet: 0, description: '' })}
                      startIcon={<AddCircleIcon />}
                      variant="outlined"
                      fullWidth
                    >
                      Add Another Unit
                    </Button>
                  </Box>
                )}
              </FieldArray>
            </DialogContent>
            <DialogActions>
              <Button onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                Create {values.units.length} Units
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default BulkUnitForm;