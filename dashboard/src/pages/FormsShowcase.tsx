// PropertyFlow AI Forms Showcase Page
// Demonstrates the enhanced form system capabilities

import * as React from 'react';
const { useState } = React;
import {
  Box,
  Typography,
  Paper,
  Tab,
  Tabs,
  Alert,
  Chip,
  Button,
} from '@mui/material';
import {
  Code as CodeIcon,
  Visibility as PreviewIcon,
  Assessment as DemoIcon,
} from '@mui/icons-material';
import PropertyForm, { PropertyFormData } from '../components/forms/PropertyForm';
import {
  FormProvider,
  FormSection,
  FormRow,
  TextField,
  Select,
  FormWizard,
  FormActions,
  FORM_CONFIGS,
  createSelectOptions,
} from '../design-system/forms';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`showcase-tabpanel-${index}`}
    aria-labelledby={`showcase-tab-${index}`}
  >
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const FormsShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [wizardStep, setWizardStep] = useState(0);
  const [formData, setFormData] = useState<Partial<PropertyFormData>>({});

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handlePropertySubmit = async (data: PropertyFormData) => {
    console.log('Property form submitted:', data);
    setFormData(data);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
  };

  const wizardSteps = [
    {
      label: 'Basic Information',
      description: 'Enter tenant personal details',
      content: (
        <FormSection title="Personal Information">
          <FormRow>
            <TextField
              name="firstName"
              label="First Name"
              required
              validation={{ required: 'First name is required' }}
            />
            <TextField
              name="lastName"
              label="Last Name"
              required
              validation={{ required: 'Last name is required' }}
            />
          </FormRow>
          <TextField
            name="email"
            label="Email Address"
            type="email"
            required
            validation={{
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Please enter a valid email address',
              },
            }}
          />
          <TextField
            name="phone"
            label="Phone Number"
            type="tel"
            validation={{
              pattern: {
                value: /^[\+]?[(]?[\d\s\-\(\)]{10,}$/,
                message: 'Please enter a valid phone number',
              },
            }}
          />
        </FormSection>
      ),
    },
    {
      label: 'Employment',
      description: 'Employment and income information',
      content: (
        <FormSection title="Employment Information">
          <TextField
            name="employer"
            label="Employer"
            required
            validation={{ required: 'Employer is required' }}
          />
          <FormRow>
            <TextField
              name="jobTitle"
              label="Job Title"
              required
              validation={{ required: 'Job title is required' }}
            />
            <TextField
              name="monthlyIncome"
              label="Monthly Income"
              type="number"
              required
              validation={{
                required: 'Monthly income is required',
                min: { value: 1, message: 'Income must be greater than $0' },
              }}
              InputProps={{ startAdornment: '$' }}
            />
          </FormRow>
          <TextField
            name="employmentLength"
            label="Length of Employment"
            placeholder="e.g., 2 years"
            helpText="How long have you been with your current employer?"
          />
        </FormSection>
      ),
    },
    {
      label: 'Preferences',
      description: 'Housing preferences and requirements',
      content: (
        <FormSection title="Housing Preferences">
          <FormRow>
            <Select
              name="propertyType"
              label="Preferred Property Type"
              options={createSelectOptions([
                { value: 'apartment', label: 'Apartment' },
                { value: 'house', label: 'House' },
                { value: 'condo', label: 'Condo' },
                { value: 'townhouse', label: 'Townhouse' },
              ])}
              multiple
              helpText="Select all property types you're interested in"
            />
            <TextField
              name="maxRent"
              label="Maximum Monthly Rent"
              type="number"
              required
              validation={{
                required: 'Maximum rent is required',
                min: { value: 1, message: 'Rent must be greater than $0' },
              }}
              InputProps={{ startAdornment: '$' }}
            />
          </FormRow>
          <Select
            name="petPolicy"
            label="Pet Requirements"
            options={createSelectOptions([
              { value: 'none', label: 'No Pets' },
              { value: 'cats', label: 'Cat-Friendly' },
              { value: 'dogs', label: 'Dog-Friendly' },
              { value: 'both', label: 'Cat & Dog Friendly' },
            ])}
            clearable
          />
          <TextField
            name="moveInDate"
            label="Preferred Move-in Date"
            type="date"
            InputLabelProps={{ shrink: true }}
          />
        </FormSection>
      ),
    },
    {
      label: 'Review',
      description: 'Review and submit your application',
      content: (
        <FormSection title="Application Review">
          <Alert severity="info" sx={{ mb: 3 }}>
            Please review your information before submitting your application.
            You can go back to previous steps to make changes if needed.
          </Alert>
          <Typography variant="body1" color="text.secondary">
            By submitting this application, you agree to our terms and conditions
            and authorize us to perform background and credit checks.
          </Typography>
        </FormSection>
      ),
    },
  ];

  const formFeatures = [
    'Real-time validation with customizable rules',
    'Accessible form controls with ARIA support',
    'Responsive layouts that adapt to screen size',
    'Multi-step wizard forms with navigation',
    'Rich input types with enhanced UX features',
    'Form state management and error handling',
    'Property management specific components',
    'Integration with PropertyFlow AI design system',
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Enhanced Forms System
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          PropertyFlow AI's comprehensive form system with validation, accessibility, and enhanced UX features.
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
          {formFeatures.map((feature, index) => (
            <Chip key={index} label={feature} variant="outlined" size="small" />
          ))}
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="forms showcase tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            icon={<PreviewIcon />} 
            label="Property Form" 
            id="showcase-tab-0"
            aria-controls="showcase-tabpanel-0"
          />
          <Tab 
            icon={<DemoIcon />} 
            label="Wizard Form" 
            id="showcase-tab-1"
            aria-controls="showcase-tabpanel-1"
          />
          <Tab 
            icon={<CodeIcon />} 
            label="Field Examples" 
            id="showcase-tab-2"
            aria-controls="showcase-tabpanel-2"
          />
        </Tabs>

        {/* Property Form Demo */}
        <TabPanel value={activeTab} index={0}>
          <Typography variant="h6" gutterBottom>
            Property Management Form
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            A comprehensive form for adding new properties to the system with validation,
            responsive layout, and enhanced UX features.
          </Typography>
          
          <PropertyForm
            onSubmit={handlePropertySubmit}
            initialData={formData}
          />
        </TabPanel>

        {/* Wizard Form Demo */}
        <TabPanel value={activeTab} index={1}>
          <Typography variant="h6" gutterBottom>
            Multi-Step Wizard Form
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            A tenant application form demonstrating step-by-step form navigation
            with validation and progress tracking.
          </Typography>

          <FormProvider config={FORM_CONFIGS.WIZARD_FORM}>
            <Box component="form">
              <FormWizard
                steps={wizardSteps}
                activeStep={wizardStep}
                onStepChange={setWizardStep}
                orientation="horizontal"
                allowStepNavigation={true}
              />
              
              <FormActions>
                <Button
                  disabled={wizardStep === 0}
                  onClick={() => setWizardStep(wizardStep - 1)}
                  variant="outlined"
                >
                  Previous
                </Button>
                
                {wizardStep === wizardSteps.length - 1 ? (
                  <Button
                    type="submit"
                    variant="contained"
                    onClick={() => alert('Application submitted!')}
                  >
                    Submit Application
                  </Button>
                ) : (
                  <Button
                    onClick={() => setWizardStep(wizardStep + 1)}
                    variant="contained"
                  >
                    Next
                  </Button>
                )}
              </FormActions>
            </Box>
          </FormProvider>
        </TabPanel>

        {/* Field Examples */}
        <TabPanel value={activeTab} index={2}>
          <Typography variant="h6" gutterBottom>
            Form Field Examples
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Individual form field components showcasing different input types,
            validation states, and accessibility features.
          </Typography>

          <FormProvider config={FORM_CONFIGS.LIVE_VALIDATION}>
            <Box component="form" sx={{ '& > * + *': { mt: 3 } }}>
              {/* Text Field Examples */}
              <FormSection title="Text Input Fields" variant="outlined">
                <FormRow>
                  <TextField
                    name="basicText"
                    label="Basic Text Field"
                    placeholder="Enter text here..."
                    helpText="This is a basic text input with help text"
                  />
                  <TextField
                    name="requiredText"
                    label="Required Field"
                    required
                    validation={{
                      required: 'This field is required',
                      minLength: { value: 3, message: 'Minimum 3 characters' },
                    }}
                    successText="Looking good!"
                  />
                </FormRow>
                
                <FormRow>
                  <TextField
                    name="emailField"
                    label="Email Address"
                    type="email"
                    validation={{
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Please enter a valid email address',
                      },
                    }}
                    clearable
                  />
                  <TextField
                    name="passwordField"
                    label="Password"
                    type="password"
                    validation={{
                      minLength: { value: 8, message: 'Minimum 8 characters' },
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                        message: 'Must contain uppercase, lowercase, and number',
                      },
                    }}
                    helpText="Password strength will be validated"
                  />
                </FormRow>
                
                <TextField
                  name="textareaField"
                  label="Multi-line Text"
                  multiline
                  rows={4}
                  placeholder="Enter multiple lines of text..."
                  validation={{ maxLength: 500 }}
                  showCharacterCount
                  helpText="Character count is displayed below"
                />
              </FormSection>

              {/* Select Examples */}
              <FormSection title="Selection Fields" variant="card">
                <FormRow>
                  <Select
                    name="basicSelect"
                    label="Basic Select"
                    options={createSelectOptions([
                      { value: 'option1', label: 'Option 1' },
                      { value: 'option2', label: 'Option 2' },
                      { value: 'option3', label: 'Option 3' },
                    ])}
                    placeholder="Choose an option..."
                    clearable
                  />
                  
                  <Select
                    name="multiSelect"
                    label="Multi-Select"
                    options={createSelectOptions([
                      { value: 'red', label: 'Red' },
                      { value: 'green', label: 'Green' },
                      { value: 'blue', label: 'Blue' },
                      { value: 'yellow', label: 'Yellow' },
                    ])}
                    multiple
                    searchable
                    maxSelections={3}
                    helpText="Select up to 3 colors"
                  />
                </FormRow>
                
                <Select
                  name="groupedSelect"
                  label="Grouped Options"
                  options={createSelectOptions([
                    { value: 'cat', label: 'Cat', group: 'Pets' },
                    { value: 'dog', label: 'Dog', group: 'Pets' },
                    { value: 'rose', label: 'Rose', group: 'Flowers' },
                    { value: 'tulip', label: 'Tulip', group: 'Flowers' },
                    { value: 'oak', label: 'Oak', group: 'Trees' },
                    { value: 'pine', label: 'Pine', group: 'Trees' },
                  ])}
                  searchable
                  helpText="Options are grouped by category"
                />
              </FormSection>

              {/* Number and Special Fields */}
              <FormSection title="Specialized Fields" variant="default">
                <FormRow>
                  <TextField
                    name="numberField"
                    label="Number Input"
                    type="number"
                    validation={{
                      min: { value: 0, message: 'Must be non-negative' },
                      max: { value: 100, message: 'Maximum value is 100' },
                    }}
                    inputProps={{ min: 0, max: 100 }}
                  />
                  
                  <TextField
                    name="currencyField"
                    label="Currency"
                    type="number"
                    validation={{
                      min: { value: 0, message: 'Amount must be positive' },
                    }}
                    InputProps={{ startAdornment: '$' }}
                    helpText="Monetary amount"
                  />
                </FormRow>
                
                <FormRow>
                  <TextField
                    name="dateField"
                    label="Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    validation={{
                      required: 'Please select a date',
                    }}
                    required
                  />
                  
                  <TextField
                    name="phoneField"
                    label="Phone Number"
                    type="tel"
                    placeholder="(555) 123-4567"
                    validation={{
                      pattern: {
                        value: /^[\+]?[(]?[\d\s\-\(\)]{10,}$/,
                        message: 'Please enter a valid phone number',
                      },
                    }}
                    copyable
                  />
                </FormRow>
              </FormSection>
            </Box>
          </FormProvider>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default FormsShowcase;