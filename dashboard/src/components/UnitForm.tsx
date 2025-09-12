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
  TextareaAutosize,
} from '@mui/material';
import { dashboardService, Unit } from '../services/dashboardService';

type Values = Omit<Unit, 'id' | 'propertyId' | 'createdAt' | 'updatedAt'>;

interface UnitFormProps {
  open: boolean;
  onClose: () => void;
  propertyId: string;
  unitId?: string;
  initialValues?: Partial<Values>;
  onSuccess?: () => void;
}

const validationSchema = Yup.object<Values>({
  unitNumber: Yup.string().required('Unit number is required').matches(/^\d+[A-Za-z]?$/, 'Invalid unit number format (e.g., 101 or 101A)'),
  type: Yup.string().required('Unit type is required'),
  occupancyStatus: Yup.string().required('Occupancy status is required'),
  rentAmount: Yup.number().required('Rent amount is required').positive('Rent must be greater than 0').min(0.01, 'Rent must be at least $0.01'),
  bedrooms: Yup.number().min(0, 'Bedrooms must be 0 or more').integer('Must be an integer'),
  bathrooms: Yup.number().min(0, 'Bathrooms must be 0 or more').min(0.5, 'Must be at least 0.5'),
  squareFeet: Yup.number().min(0, 'Square feet must be 0 or more').integer('Must be an integer'),
  description: Yup.string(),
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

const UnitForm: React.FC<UnitFormProps> = ({
  open,
  onClose,
  propertyId,
  unitId,
  initialValues = {},
  onSuccess,
}) => {
  const isEdit = !!unitId;

  const handleSubmit = async (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
    try {
      if (isEdit && unitId) {
        await dashboardService.updateUnit(unitId, values);
      } else {
        await dashboardService.createUnit(propertyId, values);
      }
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      console.error('Error saving unit:', error);
      // In production, handle errors with toast notifications
    } finally {
      setSubmitting(false);
    }
  };

  const initialFormValues: Values = {
    unitNumber: initialValues.unitNumber || '',
    type: initialValues.type || '',
    occupancyStatus: initialValues.occupancyStatus || 'vacant',
    rentAmount: initialValues.rentAmount || 0,
    bedrooms: initialValues.bedrooms || 0,
    bathrooms: initialValues.bathrooms || 1,
    squareFeet: initialValues.squareFeet || 0,
    description: initialValues.description || '',
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6">
          {isEdit ? 'Edit Unit' : 'Add New Unit'}
        </Typography>
      </DialogTitle>
      <Formik
        initialValues={initialFormValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, errors, touched, setFieldValue }) => (
          <Form>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                <FormControl fullWidth error={Boolean(touched.unitNumber && errors.unitNumber)}>
                  <Field
                    as={TextField}
                    name="unitNumber"
                    label="Unit Number"
                    fullWidth
                    required
                    helperText={touched.unitNumber && errors.unitNumber ? errors.unitNumber as string : ''}
                  />
                </FormControl>

                <FormControl fullWidth error={Boolean(touched.type && errors.type)}>
                  <InputLabel>Unit Type</InputLabel>
                  <Field
                    as={Select}
                    name="type"
                    label="Unit Type"
                    required
                    onChange={(e: React.ChangeEvent<{ value: unknown }>) => setFieldValue('type', e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Select Type</em>
                    </MenuItem>
                    {unitTypes.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Field>
                  {touched.type && errors.type && (
                    <FormHelperText>{errors.type as string}</FormHelperText>
                  )}
                </FormControl>

                <FormControl fullWidth error={Boolean(touched.occupancyStatus && errors.occupancyStatus)}>
                  <InputLabel>Occupancy Status</InputLabel>
                  <Field
                    as={Select}
                    name="occupancyStatus"
                    label="Occupancy Status"
                    required
                    onChange={(e: React.ChangeEvent<{ value: unknown }>) => setFieldValue('occupancyStatus', e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Select Status</em>
                    </MenuItem>
                    {occupancyStatuses.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Field>
                  {touched.occupancyStatus && errors.occupancyStatus && (
                    <FormHelperText>{errors.occupancyStatus as string}</FormHelperText>
                  )}
                </FormControl>

                <FormControl fullWidth error={Boolean(touched.rentAmount && errors.rentAmount)}>
                  <Field
                    as={TextField}
                    name="rentAmount"
                    label="Rent Amount ($)"
                    type="number"
                    fullWidth
                    required
                    inputProps={{ step: '0.01', min: '0.01' }}
                    helperText={touched.rentAmount && errors.rentAmount ? errors.rentAmount as string : ''}
                  />
                </FormControl>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl fullWidth error={Boolean(touched.bedrooms && errors.bedrooms)}>
                    <Field
                      as={TextField}
                      name="bedrooms"
                      label="Bedrooms"
                      type="number"
                      fullWidth
                      inputProps={{ min: '0', step: '1' }}
                      helperText={touched.bedrooms && errors.bedrooms ? errors.bedrooms as string : ''}
                    />
                  </FormControl>

                  <FormControl fullWidth error={Boolean(touched.bathrooms && errors.bathrooms)}>
                    <Field
                      as={TextField}
                      name="bathrooms"
                      label="Bathrooms"
                      type="number"
                      fullWidth
                      inputProps={{ min: '0.5', step: '0.5' }}
                      helperText={touched.bathrooms && errors.bathrooms ? errors.bathrooms as string : ''}
                    />
                  </FormControl>

                  <FormControl fullWidth error={Boolean(touched.squareFeet && errors.squareFeet)}>
                    <Field
                      as={TextField}
                      name="squareFeet"
                      label="Square Feet"
                      type="number"
                      fullWidth
                      inputProps={{ min: '0', step: '1' }}
                      helperText={touched.squareFeet && errors.squareFeet ? errors.squareFeet as string : ''}
                    />
                  </FormControl>
                </Box>

                <FormControl fullWidth>
                  <Field
                    as={TextareaAutosize}
                    name="description"
                    label="Description"
                    minRows={3}
                    style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    placeholder="Unit description..."
                  />
                  {touched.description && errors.description && (
                    <FormHelperText error>{errors.description as string}</FormHelperText>
                  )}
                </FormControl>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {isEdit ? 'Update Unit' : 'Create Unit'}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default UnitForm;