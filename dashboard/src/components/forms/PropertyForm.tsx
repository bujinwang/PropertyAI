// PropertyFlow AI Property Management Form
// Example form showcasing the enhanced form system

import * as React from 'react';
const { useState } = React;
import { Button, Alert, Box } from '@mui/material';
import {
  FormProvider,
  FormSection,
  FormRow,
  FormGrid,
  FormActions,
  TextField,
  Select,
  FORM_CONFIGS,
  PROPERTY_FORM_CONSTANTS,
  VALIDATION_FUNCTIONS,
  createSelectOptions,
} from '../../design-system/forms';

export interface PropertyFormData {
  // Basic Information
  propertyName: string;
  propertyType: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  
  // Financial Information
  purchasePrice?: number;
  marketValue?: number;
  monthlyRent: number;
  securityDeposit?: number;
  
  // Property Details
  bedrooms: number;
  bathrooms: number;
  squareFootage?: number;
  yearBuilt?: number;
  
  // Features
  amenities: string[];
  petPolicy: string;
  parkingSpaces?: number;
  
  // Management
  propertyManager?: string;
  managementCompany?: string;
  notes?: string;
}

export interface PropertyFormProps {
  initialData?: Partial<PropertyFormData>;
  onSubmit: (data: PropertyFormData) => Promise<void>;
  onCancel?: () => void;
  isEditing?: boolean;
  loading?: boolean;
}

const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  // Add more states as needed...
];

const AMENITIES_OPTIONS = [
  { value: 'pool', label: 'Swimming Pool' },
  { value: 'gym', label: 'Fitness Center' },
  { value: 'laundry', label: 'Laundry Facilities' },
  { value: 'parking', label: 'Parking Garage' },
  { value: 'balcony', label: 'Balcony/Patio' },
  { value: 'ac', label: 'Air Conditioning' },
  { value: 'heating', label: 'Central Heating' },
  { value: 'dishwasher', label: 'Dishwasher' },
  { value: 'elevator', label: 'Elevator' },
  { value: 'security', label: 'Security System' },
];

const PET_POLICY_OPTIONS = [
  { value: 'none', label: 'No Pets Allowed' },
  { value: 'cats', label: 'Cats Only' },
  { value: 'dogs', label: 'Dogs Only' },
  { value: 'both', label: 'Cats and Dogs' },
  { value: 'all', label: 'All Pets Welcome' },
];

export const PropertyForm: React.FC<PropertyFormProps> = ({
  initialData = {},
  onSubmit,
  onCancel,
  isEditing = false,
  loading = false,
}) => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = async (data: PropertyFormData) => {
    try {
      setSubmitError(null);
      setSubmitSuccess(false);
      
      await onSubmit(data);
      
      setSubmitSuccess(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An error occurred while saving the property');
    }
  };

  const handleError = (errors: Record<string, any>) => {
    console.error('Form validation errors:', errors);
    setSubmitError('Please correct the errors above and try again');
  };

  return (
    <FormProvider 
      config={FORM_CONFIGS.LIVE_VALIDATION}
      defaultValues={initialData}
      onSubmit={handleSubmit}
      onError={handleError}
    >
      <Box component="form" noValidate>
        {/* Success/Error Messages */}
        {submitSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Property {isEditing ? 'updated' : 'created'} successfully!
          </Alert>
        )}
        
        {submitError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {submitError}
          </Alert>
        )}

        {/* Basic Information Section */}
        <FormSection
          title="Basic Information"
          description="Enter the fundamental details about this property"
          variant="card"
          required
        >
          <FormGrid columns={2}>
            <TextField
              name="propertyName"
              label="Property Name"
              placeholder="e.g., Sunset Apartments"
              required
              validation={{
                required: 'Property name is required',
                minLength: 2,
                maxLength: 100,
              }}
              helpText="A descriptive name for this property"
            />
            
            <Select
              name="propertyType"
              label="Property Type"
              options={createSelectOptions(PROPERTY_FORM_CONSTANTS.PROPERTY_TYPES)}
              required
              validation={{
                required: 'Please select a property type',
              }}
              helpText="Select the type of property"
            />
          </FormGrid>

          <TextField
            name="address"
            label="Street Address"
            placeholder="e.g., 123 Main Street"
            required
            validation={{
              required: 'Street address is required',
              minLength: 10,
            }}
            helpText="The full street address of the property"
            fullWidth
          />

          <FormRow>
            <TextField
              name="city"
              label="City"
              placeholder="e.g., San Francisco"
              required
              validation={{
                required: 'City is required',
                minLength: 2,
              }}
              sx={{ flex: 2 }}
            />
            
            <Select
              name="state"
              label="State"
              options={createSelectOptions(US_STATES)}
              required
              validation={{
                required: 'Please select a state',
              }}
              sx={{ flex: 1 }}
            />
            
            <TextField
              name="zipCode"
              label="ZIP Code"
              placeholder="e.g., 94102"
              required
              validation={{
                required: 'ZIP code is required',
                pattern: {
                  value: /^[0-9]{5}(-[0-9]{4})?$/,
                  message: 'Please enter a valid ZIP code',
                },
              }}
              sx={{ flex: 1 }}
            />
          </FormRow>
        </FormSection>

        {/* Financial Information Section */}
        <FormSection
          title="Financial Information"
          description="Set pricing and financial details for this property"
          variant="outlined"
        >
          <FormGrid columns={2}>
            <TextField
              name="purchasePrice"
              label="Purchase Price"
              type="number"
              placeholder="0"
              validation={{
                min: 0,
              }}
              helpText="Original purchase price (optional)"
              InputProps={{
                startAdornment: '$',
              }}
            />
            
            <TextField
              name="marketValue"
              label="Current Market Value"
              type="number"
              placeholder="0"
              validation={{
                min: 0,
              }}
              helpText="Current estimated market value"
              InputProps={{
                startAdornment: '$',
              }}
            />
            
            <TextField
              name="monthlyRent"
              label="Monthly Rent"
              type="number"
              placeholder="0"
              required
              validation={{
                required: 'Monthly rent is required',
                min: {
                  value: 1,
                  message: 'Monthly rent must be greater than $0',
                },
              }}
              helpText="Current monthly rental amount"
              InputProps={{
                startAdornment: '$',
              }}
            />
            
            <TextField
              name="securityDeposit"
              label="Security Deposit"
              type="number"
              placeholder="0"
              validation={{
                min: 0,
              }}
              helpText="Required security deposit amount"
              InputProps={{
                startAdornment: '$',
              }}
            />
          </FormGrid>
        </FormSection>

        {/* Property Details Section */}
        <FormSection
          title="Property Details"
          description="Physical characteristics and specifications"
          variant="default"
        >
          <FormRow>
            <TextField
              name="bedrooms"
              label="Bedrooms"
              type="number"
              placeholder="0"
              required
              validation={{
                required: 'Number of bedrooms is required',
                min: 0,
                max: 20,
              }}
              inputProps={{ min: 0, max: 20 }}
            />
            
            <TextField
              name="bathrooms"
              label="Bathrooms"
              type="number"
              step="0.5"
              placeholder="0"
              required
              validation={{
                required: 'Number of bathrooms is required',
                min: 0,
                max: 20,
              }}
              inputProps={{ min: 0, max: 20, step: 0.5 }}
            />
            
            <TextField
              name="squareFootage"
              label="Square Footage"
              type="number"
              placeholder="0"
              validation={{
                min: 1,
              }}
              helpText="Total living space in square feet"
            />
            
            <TextField
              name="yearBuilt"
              label="Year Built"
              type="number"
              placeholder="e.g., 2020"
              validation={{
                min: 1800,
                max: new Date().getFullYear() + 1,
              }}
              inputProps={{ 
                min: 1800, 
                max: new Date().getFullYear() + 1 
              }}
            />
          </FormRow>
        </FormSection>

        {/* Features Section */}
        <FormSection
          title="Features & Amenities"
          description="Select available amenities and set pet policy"
          variant="card"
          collapsible
        >
          <Select
            name="amenities"
            label="Amenities"
            options={createSelectOptions(AMENITIES_OPTIONS)}
            multiple
            searchable
            clearable
            helpText="Select all available amenities (hold Ctrl/Cmd to select multiple)"
            maxSelections={10}
          />
          
          <FormRow>
            <Select
              name="petPolicy"
              label="Pet Policy"
              options={createSelectOptions(PET_POLICY_OPTIONS)}
              placeholder="Select pet policy"
              helpText="What pets are allowed?"
              sx={{ flex: 2 }}
            />
            
            <TextField
              name="parkingSpaces"
              label="Parking Spaces"
              type="number"
              placeholder="0"
              validation={{
                min: 0,
                max: 50,
              }}
              helpText="Number of assigned parking spaces"
              inputProps={{ min: 0, max: 50 }}
              sx={{ flex: 1 }}
            />
          </FormRow>
        </FormSection>

        {/* Management Information Section */}
        <FormSection
          title="Management Information"
          description="Property management details and notes"
          variant="outlined"
          collapsible
          defaultExpanded={false}
        >
          <FormRow>
            <TextField
              name="propertyManager"
              label="Property Manager"
              placeholder="e.g., John Smith"
              helpText="Name of the assigned property manager"
            />
            
            <TextField
              name="managementCompany"
              label="Management Company"
              placeholder="e.g., ABC Property Management"
              helpText="Name of the management company"
            />
          </FormRow>
          
          <TextField
            name="notes"
            label="Additional Notes"
            multiline
            rows={4}
            placeholder="Enter any additional notes or comments about this property..."
            validation={{
              maxLength: 1000,
            }}
            showCharacterCount
            helpText="Optional notes about the property"
            fullWidth
          />
        </FormSection>

        {/* Form Actions */}
        <FormActions>
          {onCancel && (
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          )}
          
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{ minWidth: 120 }}
          >
            {loading ? 'Saving...' : (isEditing ? 'Update Property' : 'Create Property')}
          </Button>
        </FormActions>
      </Box>
    </FormProvider>
  );
};

export default PropertyForm;