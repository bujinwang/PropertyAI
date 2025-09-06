// PropertyFlow AI Form Provider
// Context and state management for enhanced form system

import * as React from 'react';
const { createContext, useContext, useState, useEffect, ReactNode } = React;

export type ValidationTrigger = 'onChange' | 'onBlur' | 'onSubmit' | 'manual';
export type ValidationMode = 'all' | 'touched' | 'dirty';

export interface FieldError {
  type: string;
  message: string;
  ref?: React.RefObject<any>;
}

export interface FieldState {
  value: any;
  error?: FieldError;
  touched: boolean;
  dirty: boolean;
  valid: boolean;
  validating: boolean;
}

export interface FormState {
  fields: Record<string, FieldState>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  isSubmitted: boolean;
  submitCount: number;
  errors: Record<string, FieldError>;
  touchedFields: string[];
  dirtyFields: string[];
}

export interface FormConfig {
  mode: ValidationMode;
  reValidateMode: ValidationMode;
  shouldFocusError: boolean;
  shouldUnregister: boolean;
  shouldUseNativeValidation: boolean;
  criteriaMode: 'firstError' | 'all';
  delayError: number;
}

export interface FormContextType {
  // State
  formState: FormState;
  config: FormConfig;
  
  // Field registration
  register: (name: string, options?: RegisterOptions) => RegisterReturn;
  unregister: (name: string) => void;
  
  // Field operations
  setValue: (name: string, value: any, options?: SetValueOptions) => void;
  getValue: (name: string) => any;
  getValues: (fieldNames?: string[]) => Record<string, any>;
  
  // Validation
  trigger: (name?: string | string[]) => Promise<boolean>;
  clearErrors: (name?: string | string[]) => void;
  setError: (name: string, error: FieldError) => void;
  
  // Form operations
  handleSubmit: (onValid: SubmitHandler, onInvalid?: SubmitErrorHandler) => FormSubmitHandler;
  reset: (values?: Record<string, any>, options?: ResetOptions) => void;
  
  // Utilities
  watch: (name?: string | string[] | ((data: any, info: WatchInfo) => void)) => any;
  formValues: Record<string, any>;
}

export interface RegisterOptions {
  required?: boolean | string;
  min?: number | string;
  max?: number | string;
  minLength?: number | string;
  maxLength?: number | string;
  pattern?: RegExp | string;
  validate?: Record<string, (value: any) => boolean | string> | ((value: any) => boolean | string);
  valueAsNumber?: boolean;
  valueAsDate?: boolean;
  setValueAs?: (value: any) => any;
  shouldUnregister?: boolean;
  onChange?: (event: React.ChangeEvent) => void;
  onBlur?: (event: React.FocusEvent) => void;
  disabled?: boolean;
  deps?: string[];
}

export interface RegisterReturn {
  onChange: (event: React.ChangeEvent) => void;
  onBlur: (event: React.FocusEvent) => void;
  name: string;
  ref: (ref: any) => void;
}

export interface SetValueOptions {
  shouldValidate?: boolean;
  shouldDirty?: boolean;
  shouldTouch?: boolean;
}

export interface ResetOptions {
  keepErrors?: boolean;
  keepDirty?: boolean;
  keepTouched?: boolean;
  keepValues?: boolean;
  keepDefaultValues?: boolean;
}

export interface WatchInfo {
  name?: string;
  type?: string;
  value?: any;
}

export type SubmitHandler = (data: Record<string, any>) => void | Promise<void>;
export type SubmitErrorHandler = (errors: Record<string, FieldError>) => void;
export type FormSubmitHandler = (event: React.FormEvent) => void;

const defaultConfig: FormConfig = {
  mode: 'onSubmit',
  reValidateMode: 'onChange',
  shouldFocusError: true,
  shouldUnregister: true,
  shouldUseNativeValidation: false,
  criteriaMode: 'firstError',
  delayError: 0,
};

const initialFormState: FormState = {
  fields: {},
  isValid: true,
  isDirty: false,
  isSubmitting: false,
  isSubmitted: false,
  submitCount: 0,
  errors: {},
  touchedFields: [],
  dirtyFields: [],
};

export const FormContext = createContext<FormContextType | undefined>(undefined);

export const useForm = (config: Partial<FormConfig> = {}): FormContextType => {
  const context = useContext(FormContext);
  
  if (context === undefined) {
    throw new Error(
      'useForm must be used within a FormProvider. ' +
      'Make sure your component is wrapped with <FormProvider>.'
    );
  }
  
  return context;
};

export interface FormProviderProps {
  children: ReactNode;
  config?: Partial<FormConfig>;
  defaultValues?: Record<string, any>;
  onSubmit?: SubmitHandler;
  onError?: SubmitErrorHandler;
}

export const FormProvider: React.FC<FormProviderProps> = ({ 
  children, 
  config: userConfig = {},
  defaultValues = {},
  onSubmit,
  onError
}) => {
  const config = { ...defaultConfig, ...userConfig };
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [formValues, setFormValues] = useState<Record<string, any>>(defaultValues);
  const fieldsRef = React.useRef<Record<string, any>>({});
  const validationRef = React.useRef<Record<string, any>>({});

  // Field registration
  const register = (name: string, options: RegisterOptions = {}): RegisterReturn => {
    // Initialize field if not exists
    if (!formState.fields[name]) {
      setFormState(prev => ({
        ...prev,
        fields: {
          ...prev.fields,
          [name]: {
            value: formValues[name] || '',
            touched: false,
            dirty: false,
            valid: true,
            validating: false,
          }
        }
      }));
    }

    // Store validation rules
    validationRef.current[name] = options;

    return {
      name,
      onChange: (event: React.ChangeEvent) => {
        const target = event.target as HTMLInputElement;
        const value = options.valueAsNumber ? target.valueAsNumber : 
                     options.valueAsDate ? new Date(target.value) :
                     options.setValueAs ? options.setValueAs(target.value) : target.value;
        
        setValue(name, value, { 
          shouldValidate: config.mode === 'onChange',
          shouldDirty: true,
          shouldTouch: true 
        });
        
        options.onChange?.(event);
      },
      onBlur: (event: React.FocusEvent) => {
        setFormState(prev => ({
          ...prev,
          fields: {
            ...prev.fields,
            [name]: {
              ...prev.fields[name],
              touched: true
            }
          },
          touchedFields: [...new Set([...prev.touchedFields, name])]
        }));

        if (config.mode === 'onBlur' || config.reValidateMode === 'onBlur') {
          trigger(name);
        }
        
        options.onBlur?.(event);
      },
      ref: (ref: any) => {
        fieldsRef.current[name] = ref;
      }
    };
  };

  const unregister = (name: string) => {
    if (config.shouldUnregister) {
      setFormState(prev => {
        const newFields = { ...prev.fields };
        const newErrors = { ...prev.errors };
        delete newFields[name];
        delete newErrors[name];
        
        return {
          ...prev,
          fields: newFields,
          errors: newErrors,
          touchedFields: prev.touchedFields.filter(field => field !== name),
          dirtyFields: prev.dirtyFields.filter(field => field !== name)
        };
      });
      
      setFormValues(prev => {
        const newValues = { ...prev };
        delete newValues[name];
        return newValues;
      });
      
      delete fieldsRef.current[name];
      delete validationRef.current[name];
    }
  };

  // Field operations
  const setValue = (name: string, value: any, options: SetValueOptions = {}) => {
    const {
      shouldValidate = false,
      shouldDirty = false,
      shouldTouch = false
    } = options;

    setFormValues(prev => ({ ...prev, [name]: value }));
    
    setFormState(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [name]: {
          ...prev.fields[name],
          value,
          dirty: shouldDirty ? true : prev.fields[name]?.dirty || false,
          touched: shouldTouch ? true : prev.fields[name]?.touched || false
        }
      },
      isDirty: shouldDirty ? true : prev.isDirty,
      dirtyFields: shouldDirty ? [...new Set([...prev.dirtyFields, name])] : prev.dirtyFields,
      touchedFields: shouldTouch ? [...new Set([...prev.touchedFields, name])] : prev.touchedFields
    }));

    if (shouldValidate) {
      trigger(name);
    }
  };

  const getValue = (name: string) => formValues[name];

  const getValues = (fieldNames?: string[]) => {
    if (fieldNames) {
      const values: Record<string, any> = {};
      fieldNames.forEach(name => {
        values[name] = formValues[name];
      });
      return values;
    }
    return { ...formValues };
  };

  // Validation
  const validateField = async (name: string, value: any): Promise<FieldError | undefined> => {
    const rules = validationRef.current[name];
    if (!rules) return undefined;

    // Required validation
    if (rules.required) {
      const isEmpty = value === undefined || value === null || value === '' || 
                     (Array.isArray(value) && value.length === 0);
      if (isEmpty) {
        return {
          type: 'required',
          message: typeof rules.required === 'string' ? rules.required : 'This field is required'
        };
      }
    }

    // Pattern validation
    if (rules.pattern && value) {
      const pattern = typeof rules.pattern === 'string' ? new RegExp(rules.pattern) : rules.pattern;
      if (!pattern.test(value)) {
        return {
          type: 'pattern',
          message: 'Invalid format'
        };
      }
    }

    // Length validations
    if (rules.minLength && value && value.length < rules.minLength) {
      return {
        type: 'minLength',
        message: `Minimum length is ${rules.minLength}`
      };
    }

    if (rules.maxLength && value && value.length > rules.maxLength) {
      return {
        type: 'maxLength',
        message: `Maximum length is ${rules.maxLength}`
      };
    }

    // Min/Max validations
    if (rules.min !== undefined && value < rules.min) {
      return {
        type: 'min',
        message: `Minimum value is ${rules.min}`
      };
    }

    if (rules.max !== undefined && value > rules.max) {
      return {
        type: 'max',
        message: `Maximum value is ${rules.max}`
      };
    }

    // Custom validation
    if (rules.validate) {
      const validator = typeof rules.validate === 'function' ? 
        { custom: rules.validate } : rules.validate;
      
      for (const [key, validatorFn] of Object.entries(validator)) {
        const result = await validatorFn(value);
        if (result !== true) {
          return {
            type: key,
            message: typeof result === 'string' ? result : `Validation failed: ${key}`
          };
        }
      }
    }

    return undefined;
  };

  const trigger = async (name?: string | string[]): Promise<boolean> => {
    const fieldsToValidate = name ? 
      (Array.isArray(name) ? name : [name]) : 
      Object.keys(formValues);

    const errors: Record<string, FieldError> = {};
    let hasErrors = false;

    for (const fieldName of fieldsToValidate) {
      const value = formValues[fieldName];
      setFormState(prev => ({
        ...prev,
        fields: {
          ...prev.fields,
          [fieldName]: {
            ...prev.fields[fieldName],
            validating: true
          }
        }
      }));

      const error = await validateField(fieldName, value);
      
      if (error) {
        errors[fieldName] = error;
        hasErrors = true;
      }

      setFormState(prev => ({
        ...prev,
        fields: {
          ...prev.fields,
          [fieldName]: {
            ...prev.fields[fieldName],
            valid: !error,
            validating: false,
            error
          }
        }
      }));
    }

    setFormState(prev => ({
      ...prev,
      errors: { ...prev.errors, ...errors },
      isValid: !hasErrors
    }));

    return !hasErrors;
  };

  const clearErrors = (name?: string | string[]) => {
    if (!name) {
      setFormState(prev => ({
        ...prev,
        errors: {},
        fields: Object.keys(prev.fields).reduce((acc, fieldName) => ({
          ...acc,
          [fieldName]: {
            ...prev.fields[fieldName],
            error: undefined,
            valid: true
          }
        }), {})
      }));
    } else {
      const fieldsToReset = Array.isArray(name) ? name : [name];
      setFormState(prev => ({
        ...prev,
        errors: Object.keys(prev.errors).reduce((acc, key) => {
          if (!fieldsToReset.includes(key)) {
            acc[key] = prev.errors[key];
          }
          return acc;
        }, {} as Record<string, FieldError>),
        fields: fieldsToReset.reduce((acc, fieldName) => ({
          ...acc,
          [fieldName]: {
            ...prev.fields[fieldName],
            error: undefined,
            valid: true
          }
        }), prev.fields)
      }));
    }
  };

  const setError = (name: string, error: FieldError) => {
    setFormState(prev => ({
      ...prev,
      errors: { ...prev.errors, [name]: error },
      fields: {
        ...prev.fields,
        [name]: {
          ...prev.fields[name],
          error,
          valid: false
        }
      },
      isValid: false
    }));
  };

  // Form operations
  const handleSubmit = (onValid: SubmitHandler, onInvalid?: SubmitErrorHandler): FormSubmitHandler => {
    return async (event: React.FormEvent) => {
      event.preventDefault();
      
      setFormState(prev => ({
        ...prev,
        isSubmitting: true,
        submitCount: prev.submitCount + 1
      }));

      const isValid = await trigger();
      
      setFormState(prev => ({
        ...prev,
        isSubmitting: false,
        isSubmitted: true
      }));

      if (isValid) {
        try {
          await onValid(formValues);
        } catch (error) {
          console.error('Form submission error:', error);
        }
      } else {
        onInvalid?.(formState.errors);
        
        // Focus first error field
        if (config.shouldFocusError) {
          const firstErrorField = Object.keys(formState.errors)[0];
          const fieldRef = fieldsRef.current[firstErrorField];
          if (fieldRef?.focus) {
            fieldRef.focus();
          }
        }
      }
    };
  };

  const reset = (values: Record<string, any> = {}, options: ResetOptions = {}) => {
    const newValues = { ...defaultValues, ...values };
    
    if (!options.keepValues) {
      setFormValues(newValues);
    }
    
    setFormState(prev => ({
      ...initialFormState,
      fields: Object.keys(prev.fields).reduce((acc, name) => ({
        ...acc,
        [name]: {
          value: newValues[name] || '',
          touched: options.keepTouched ? prev.fields[name]?.touched || false : false,
          dirty: options.keepDirty ? prev.fields[name]?.dirty || false : false,
          valid: true,
          validating: false,
          error: options.keepErrors ? prev.fields[name]?.error : undefined
        }
      }), {}),
      errors: options.keepErrors ? prev.errors : {},
      isDirty: options.keepDirty ? prev.isDirty : false,
      touchedFields: options.keepTouched ? prev.touchedFields : [],
      dirtyFields: options.keepDirty ? prev.dirtyFields : []
    }));
  };

  // Watch functionality
  const watch = (name?: string | string[] | ((data: any, info: WatchInfo) => void)) => {
    if (typeof name === 'function') {
      // Callback mode - would need useEffect to implement properly
      return formValues;
    } else if (Array.isArray(name)) {
      return name.reduce((acc, fieldName) => ({
        ...acc,
        [fieldName]: formValues[fieldName]
      }), {});
    } else if (name) {
      return formValues[name];
    } else {
      return formValues;
    }
  };

  const contextValue: FormContextType = {
    formState,
    config,
    register,
    unregister,
    setValue,
    getValue,
    getValues,
    trigger,
    clearErrors,
    setError,
    handleSubmit,
    reset,
    watch,
    formValues
  };

  return (
    <FormContext.Provider value={contextValue}>
      {children}
    </FormContext.Provider>
  );
};

export default FormProvider;