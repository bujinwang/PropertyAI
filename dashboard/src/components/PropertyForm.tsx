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
import { dashboardService, Property } from '../services/dashboardService';

type Values = Omit<Property, 'id' | 'createdAt' | 'updatedAt'>;

interface PropertyFormProps {
  open: boolean;
  onClose: () => void;
  onSubmitSuccess?: () => void;
  initialValues?: Partial<Values>;
  isEdit?: boolean;
  propertyId?: string;
}

const validationSchema = Yup.object<Values>({
  title: Yup.string().required('Title is required'),
  address: Yup.string().required('Address is required'),
  city: Yup.string().required('City is required'),
  state: Yup.string().required('State is required'),
  zipCode: Yup.string().required('Zip Code is required'),
  propertyType: Yup.string().required('Property type is required'),
  description: Yup.string(),
  totalUnits: Yup.number().required('Total Units is required').positive('Must be positive').integer('Must be integer'),
  status: Yup.string().required('Status is required'),
});

const propertyTypes = [
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'HOUSE', label: 'House' },
  { value: 'CONDO', label: 'Condo' },
  { value: 'TOWNHOUSE', label: 'Townhouse' },
  { value: 'COMMERCIAL', label: 'Commercial' },
  { value: 'INDUSTRIAL', label: 'Industrial' },
  { value: 'OTHER', label: 'Other' },
];

const statuses = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ARCHIVED', label: 'Archived' },
];

const PropertyForm: React.FC<PropertyFormProps> = ({ 
  open, 
  onClose, 
  onSubmitSuccess, 
  initialValues = {}, 
  isEdit = false, 
  propertyId 
}) => {
  const handleSubmit = async (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
    try {
      if (isEdit && propertyId) {
        await dashboardService.updateProperty(propertyId, values);
      } else {
        await dashboardService.createProperty(values);
      }
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
      onClose();
    } catch (error) {
      console.error('Error saving property:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const initialFormValues: Values = {
    title: initialValues.title || '',
    address: initialValues.address || '',
    city: initialValues.city || '',
    state: initialValues.state || '',
    zipCode: initialValues.zipCode || '',
    propertyType: initialValues.propertyType || '',
    description: initialValues.description || '',
    totalUnits: initialValues.totalUnits || 1,
    status: initialValues.status || 'DRAFT',
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6">
          {isEdit ? 'Edit Property' : 'Create New Property'}
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
                <FormControl fullWidth error={Boolean(touched.title && errors.title)}>
                  <Field
                    as={TextField}
                    name="title"
                    label="Title"
                    fullWidth
                    required
                    helperText={touched.title && errors.title ? (errors.title as string) : ''}
                  />
                </FormControl>

                <FormControl fullWidth error={Boolean(touched.address && errors.address)}>
                  <Field
                    as={TextField}
                    name="address"
                    label="Address"
                    fullWidth
                    required
                    helperText={touched.address && errors.address ? (errors.address as string) : ''}
                  />
                </FormControl>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl fullWidth error={Boolean(touched.city && errors.city)}>
                    <Field
                      as={TextField}
                      name="city"
                      label="City"
                      fullWidth
                      required
                      helperText={touched.city && errors.city ? (errors.city as string) : ''}
                    />
                  </FormControl>

                  <FormControl fullWidth error={Boolean(touched.state && errors.state)}>
                    <Field
                      as={TextField}
                      name="state"
                      label="State"
                      fullWidth
                      required
                      helperText={touched.state && errors.state ? (errors.state as string) : ''}
                    />
                  </FormControl>

                  <FormControl fullWidth error={Boolean(touched.zipCode && errors.zipCode)}>
                    <Field
                      as={TextField}
                      name="zipCode"
                      label="Zip Code"
                      fullWidth
                      required
                      helperText={touched.zipCode && errors.zipCode ? (errors.zipCode as string) : ''}
                    />
                  </FormControl>
                </Box>

                <FormControl fullWidth error={Boolean(touched.propertyType && errors.propertyType)}>
                  <InputLabel>Property Type</InputLabel>
                  <Field
                    as={Select}
                    name="propertyType"
                    label="Property Type"
                    required
                    onChange={(e: React.ChangeEvent<{ value: unknown }>) => setFieldValue('propertyType', e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Select Type</em>
                    </MenuItem>
                    {propertyTypes.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Field>
                  {touched.propertyType && errors.propertyType && (
                    <FormHelperText>{errors.propertyType as string}</FormHelperText>
                  )}
                </FormControl>

                <FormControl fullWidth>
                  <Field
                    as={TextField}
                    name="description"
                    label="Description"
                    multiline
                    rows={4}
                    fullWidth
                    helperText={touched.description && errors.description ? (errors.description as string) : ''}
                  />
                </FormControl>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'end' }}>
                  <FormControl fullWidth error={Boolean(touched.totalUnits && errors.totalUnits)}>
                    <Field
                      as={TextField}
                      name="totalUnits"
                      label="Total Units"
                      type="number"
                      fullWidth
                      required
                      inputProps={{ min: 1 }}
                      helperText={touched.totalUnits && errors.totalUnits ? (errors.totalUnits as string) : ''}
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

export default PropertyForm;