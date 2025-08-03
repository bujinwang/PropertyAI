import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
  IconButton
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { getRental, createRental, updateRental, CreateRentalDto } from '../services/rentalService';

const RentalForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  
  const [formData, setFormData] = useState<CreateRentalDto>({
    title: '',
    description: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
    propertyType: 'APARTMENT',
    totalUnits: 1,
    rent: 0,
    isAvailable: true,
    isActive: true,
    status: 'DRAFT',
    managerId: '', // This should be set from user context
    ownerId: '', // This should be set from user context
    createdById: '' // This should be set from user context
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isEdit && id) {
      const fetchRental = async () => {
        try {
          setLoading(true);
          const rental = await getRental(id);
          setFormData({
            title: rental.title,
            description: rental.description || '',
            address: rental.address,
            city: rental.city,
            state: rental.state,
            zipCode: rental.zipCode,
            country: rental.country,
            latitude: rental.latitude,
            longitude: rental.longitude,
            propertyType: rental.propertyType as any,
            yearBuilt: rental.yearBuilt,
            totalUnits: rental.totalUnits,
            amenities: rental.amenities,
            unitNumber: rental.unitNumber,
            floorNumber: rental.floorNumber,
            size: rental.size,
            bedrooms: rental.bedrooms,
            bathrooms: rental.bathrooms,
            rent: rental.rent,
            deposit: rental.deposit,
            availableDate: rental.availableDate ? rental.availableDate.split('T')[0] : undefined,
            isAvailable: rental.isAvailable,
            leaseTerms: rental.leaseTerms,
            slug: rental.slug,
            isActive: rental.isActive,
            status: rental.status as any,
            managerId: rental.managerId,
            ownerId: rental.ownerId,
            createdById: rental.createdById,
            whiteLabelConfigId: rental.whiteLabelConfigId
          });
        } catch (err: any) {
          setError(err.message || 'Failed to fetch rental details');
        } finally {
          setLoading(false);
        }
      };
      
      fetchRental();
    }
  }, [isEdit, id]);

  const handleChange = (field: keyof CreateRentalDto, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    try {
      setLoading(true);
      
      if (isEdit && id) {
        await updateRental(id, formData);
        setSuccess('Rental updated successfully');
      } else {
        await createRental(formData);
        setSuccess('Rental created successfully');
        navigate('/rentals');
      }
    } catch (err: any) {
      setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} rental`);
    } finally {
      setLoading(false);
    }
  };

  const propertyTypes = [
    'APARTMENT',
    'HOUSE',
    'CONDO',
    'TOWNHOUSE',
    'COMMERCIAL',
    'INDUSTRIAL',
    'OTHER'
  ];

  const statuses = [
    'ACTIVE',
    'PENDING',
    'DRAFT',
    'ARCHIVED'
  ];

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <IconButton onClick={() => navigate('/rentals')}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          {isEdit ? 'Edit Rental' : 'Create New Rental'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Basic Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Title *"
                      value={formData.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      multiline
                      rows={4}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Property Type</InputLabel>
                      <Select
                        value={formData.propertyType}
                        onChange={(e) => handleChange('propertyType', e.target.value)}
                        label="Property Type"
                      >
                        {propertyTypes.map((type) => (
                          <MenuItem key={type} value={type}>
                            {type.replace('_', ' ')}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={formData.status}
                        onChange={(e) => handleChange('status', e.target.value)}
                        label="Status"
                      >
                        {statuses.map((status) => (
                          <MenuItem key={status} value={status}>
                            {status}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Address Information */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Address Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Address *"
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="City *"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="State *"
                      value={formData.state}
                      onChange={(e) => handleChange('state', e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="ZIP Code *"
                      value={formData.zipCode}
                      onChange={(e) => handleChange('zipCode', e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Country"
                      value={formData.country}
                      onChange={(e) => handleChange('country', e.target.value)}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Property Details */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Property Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="Bedrooms"
                      type="number"
                      value={formData.bedrooms || ''}
                      onChange={(e) => handleChange('bedrooms', e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="Bathrooms"
                      type="number"
                      step="0.5"
                      value={formData.bathrooms || ''}
                      onChange={(e) => handleChange('bathrooms', e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="Square Footage"
                      type="number"
                      value={formData.size || ''}
                      onChange={(e) => handleChange('size', e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="Year Built"
                      type="number"
                      value={formData.yearBuilt || ''}
                      onChange={(e) => handleChange('yearBuilt', e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="Unit Number"
                      value={formData.unitNumber || ''}
                      onChange={(e) => handleChange('unitNumber', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="Floor Number"
                      type="number"
                      value={formData.floorNumber || ''}
                      onChange={(e) => handleChange('floorNumber', e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="Total Units"
                      type="number"
                      value={formData.totalUnits}
                      onChange={(e) => handleChange('totalUnits', Number(e.target.value))}
                      required
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Financial Information */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Financial Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Monthly Rent *"
                      type="number"
                      value={formData.rent}
                      onChange={(e) => handleChange('rent', Number(e.target.value))}
                      required
                      InputProps={{
                        startAdornment: '$'
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Security Deposit"
                      type="number"
                      value={formData.deposit || ''}
                      onChange={(e) => handleChange('deposit', e.target.value ? Number(e.target.value) : undefined)}
                      InputProps={{
                        startAdornment: '$'
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Available Date"
                      type="date"
                      value={formData.availableDate || ''}
                      onChange={(e) => handleChange('availableDate', e.target.value)}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Additional Information */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Additional Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Lease Terms"
                      value={formData.leaseTerms || ''}
                      onChange={(e) => handleChange('leaseTerms', e.target.value)}
                      multiline
                      rows={3}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.isAvailable}
                          onChange={(e) => handleChange('isAvailable', e.target.checked)}
                        />
                      }
                      label="Available for Rent"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.isActive}
                          onChange={(e) => handleChange('isActive', e.target.checked)}
                        />
                      }
                      label="Active Listing"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Submit Button */}
          <Grid item xs={12}>
            <Box display="flex" justifyContent="flex-end" gap={2}>
              <Button
                variant="outlined"
                onClick={() => navigate('/rentals')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={loading}
              >
                {loading ? 'Saving...' : (isEdit ? 'Update Rental' : 'Create Rental')}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default RentalForm;