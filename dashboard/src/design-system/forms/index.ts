// PropertyFlow AI Enhanced Forms - Main Export
// Central access point for all form components, hooks, and utilities

// Core form system
export { FormProvider, useForm } from './FormProvider';
export type { 
  FormContextType,
  FormState,
  FormConfig,
  FieldState,
  FieldError,
  RegisterOptions,
  RegisterReturn,
  SetValueOptions,
  ResetOptions,
  SubmitHandler,
  SubmitErrorHandler,
  ValidationTrigger,
  ValidationMode
} from './FormProvider';

// Form components
export { TextField } from './components/TextField';
export { Select } from './components/Select';
export {
  FormSection,
  FormRow,
  FormColumn,
  FormGrid,
  FormWizard,
  FormDivider,
  FormCard,
  FormActions,
} from './components/FormLayout';

// Component prop types
export type { EnhancedTextFieldProps } from './components/TextField';
export type { 
  EnhancedSelectProps, 
  SelectOption 
} from './components/Select';
export type {
  FormSectionProps,
  FormRowProps,
  FormColumnProps,
  FormGridProps,
  FormWizardProps,
  WizardStep,
} from './components/FormLayout';

// Form validation utilities (to be implemented)
// export * from './validation';

// Form hooks (to be implemented)  
// export * from './hooks';

// Commonly used form configurations
export const FORM_CONFIGS = {
  // Validation modes
  VALIDATION_MODES: {
    ON_CHANGE: 'onChange' as ValidationMode,
    ON_BLUR: 'onBlur' as ValidationMode,
    ON_SUBMIT: 'onSubmit' as ValidationMode,
    MANUAL: 'manual' as ValidationMode,
  },
  
  // Default configurations for different form types
  QUICK_FORM: {
    mode: 'onSubmit' as ValidationMode,
    reValidateMode: 'onChange' as ValidationMode,
    shouldFocusError: true,
    shouldUnregister: false,
    delayError: 0,
  },
  
  LIVE_VALIDATION: {
    mode: 'onChange' as ValidationMode,
    reValidateMode: 'onChange' as ValidationMode,
    shouldFocusError: true,
    shouldUnregister: true,
    delayError: 300,
  },
  
  WIZARD_FORM: {
    mode: 'onBlur' as ValidationMode,
    reValidateMode: 'onChange' as ValidationMode,
    shouldFocusError: true,
    shouldUnregister: false,
    delayError: 0,
  },
  
  SEARCH_FORM: {
    mode: 'manual' as ValidationMode,
    reValidateMode: 'manual' as ValidationMode,
    shouldFocusError: false,
    shouldUnregister: true,
    delayError: 500,
  },
} as const;

// Common validation patterns for PropertyFlow AI
export const VALIDATION_PATTERNS = {
  // Contact information
  EMAIL: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  PHONE: /^[\+]?[(]?[\d\s\-\(\)]{10,}$/,
  US_PHONE: /^(\+1-?)?(\([0-9]{3}\)|[0-9]{3})[\s\-]?[0-9]{3}[\s\-]?[0-9]{4}$/,
  
  // Property related
  ZIP_CODE: /^[0-9]{5}(-[0-9]{4})?$/,
  POSTAL_CODE: /^[A-Z0-9]{3,10}$/i,
  
  // Financial
  CURRENCY: /^\$?(\d{1,3}(,\d{3})*|\d+)(\.\d{2})?$/,
  PERCENTAGE: /^(100|[0-9]{1,2})(\.[0-9]{1,2})?%?$/,
  SSN: /^\d{3}-?\d{2}-?\d{4}$/,
  
  // Property identifiers
  UNIT_NUMBER: /^[A-Z0-9\-#]{1,10}$/i,
  PROPERTY_ID: /^[A-Z0-9]{3,20}$/i,
  
  // Common text patterns
  NAME: /^[A-Za-z\s\-'\.]{2,50}$/,
  USERNAME: /^[A-Za-z0-9_]{3,20}$/,
  PASSWORD_STRONG: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
} as const;

// Common field validation functions
export const VALIDATION_FUNCTIONS = {
  required: (message = 'This field is required') => (value: any) => {
    const isEmpty = value === undefined || value === null || value === '' || 
                   (Array.isArray(value) && value.length === 0);
    return !isEmpty || message;
  },
  
  minLength: (min: number, message?: string) => (value: string) => {
    if (!value) return true;
    return value.length >= min || message || `Minimum length is ${min} characters`;
  },
  
  maxLength: (max: number, message?: string) => (value: string) => {
    if (!value) return true;
    return value.length <= max || message || `Maximum length is ${max} characters`;
  },
  
  pattern: (pattern: RegExp, message = 'Invalid format') => (value: string) => {
    if (!value) return true;
    return pattern.test(value) || message;
  },
  
  email: (message = 'Please enter a valid email address') => (value: string) => {
    if (!value) return true;
    return VALIDATION_PATTERNS.EMAIL.test(value) || message;
  },
  
  phone: (message = 'Please enter a valid phone number') => (value: string) => {
    if (!value) return true;
    return VALIDATION_PATTERNS.PHONE.test(value) || message;
  },
  
  currency: (message = 'Please enter a valid amount') => (value: string) => {
    if (!value) return true;
    return VALIDATION_PATTERNS.CURRENCY.test(value) || message;
  },
  
  zipCode: (message = 'Please enter a valid ZIP code') => (value: string) => {
    if (!value) return true;
    return VALIDATION_PATTERNS.ZIP_CODE.test(value) || message;
  },
  
  min: (min: number, message?: string) => (value: number) => {
    if (value === undefined || value === null) return true;
    return value >= min || message || `Minimum value is ${min}`;
  },
  
  max: (max: number, message?: string) => (value: number) => {
    if (value === undefined || value === null) return true;
    return value <= max || message || `Maximum value is ${max}`;
  },
  
  matchField: (fieldName: string, message = 'Fields do not match') => (value: any, formValues: Record<string, any>) => {
    return value === formValues[fieldName] || message;
  },
  
  custom: (validator: (value: any, formValues?: Record<string, any>) => boolean | string) => validator,
} as const;

// Property management specific field configurations
export const PROPERTY_FIELD_CONFIGS = {
  PROPERTY_NAME: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[A-Za-z0-9\s\-'\.&]{2,100}$/,
  },
  
  PROPERTY_ADDRESS: {
    required: true,
    minLength: 10,
    maxLength: 200,
  },
  
  UNIT_NUMBER: {
    maxLength: 10,
    pattern: VALIDATION_PATTERNS.UNIT_NUMBER,
  },
  
  RENT_AMOUNT: {
    required: true,
    min: 0,
    pattern: VALIDATION_PATTERNS.CURRENCY,
  },
  
  TENANT_NAME: {
    required: true,
    pattern: VALIDATION_PATTERNS.NAME,
  },
  
  TENANT_EMAIL: {
    pattern: VALIDATION_PATTERNS.EMAIL,
  },
  
  TENANT_PHONE: {
    pattern: VALIDATION_PATTERNS.PHONE,
  },
  
  LEASE_DURATION: {
    required: true,
    min: 1,
    max: 60, // months
  },
} as const;

// Form helper utilities
export const createFormField = (name: string, label: string, config: any = {}) => ({
  name,
  label,
  ...config,
});

export const createSelectOptions = (items: Array<{ value: any; label: string; [key: string]: any }>) => 
  items.map(item => ({
    value: item.value,
    label: item.label,
    disabled: item.disabled,
    group: item.group,
    description: item.description,
    icon: item.icon,
  }));

// PropertyFlow AI specific form constants
export const PROPERTY_FORM_CONSTANTS = {
  PROPERTY_TYPES: [
    { value: 'apartment', label: 'Apartment' },
    { value: 'house', label: 'Single Family House' },
    { value: 'condo', label: 'Condominium' },
    { value: 'townhouse', label: 'Townhouse' },
    { value: 'duplex', label: 'Duplex' },
    { value: 'commercial', label: 'Commercial Property' },
  ],
  
  LEASE_TERMS: [
    { value: 6, label: '6 months' },
    { value: 12, label: '1 year' },
    { value: 24, label: '2 years' },
    { value: 36, label: '3 years' },
  ],
  
  TENANT_STATUS: [
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'former', label: 'Former' },
    { value: 'applicant', label: 'Applicant' },
  ],
  
  MAINTENANCE_PRIORITY: [
    { value: 'low', label: 'Low Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'high', label: 'High Priority' },
    { value: 'emergency', label: 'Emergency' },
  ],
  
  MAINTENANCE_STATUS: [
    { value: 'open', label: 'Open' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ],
} as const;