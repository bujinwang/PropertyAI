// PropertyFlow AI Enhanced TextField Component
// Accessible text input with validation and enhanced UX features

import * as React from 'react';
const { forwardRef, useState, useId } = React;
import { styled } from '@mui/material/styles';
import {
  TextField as MuiTextField,
  TextFieldProps as MuiTextFieldProps,
  InputAdornment,
  IconButton,
  FormHelperText,
  Box,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { tokens } from '../../tokens';
import { useForm } from '../FormProvider';
import { VisuallyHidden, RequiredIndicator } from '../../accessibility';

export interface EnhancedTextFieldProps extends Omit<MuiTextFieldProps, 'variant' | 'color'> {
  name: string;
  label: string;
  variant?: 'outlined' | 'filled' | 'standard';
  validation?: {
    required?: boolean | string;
    minLength?: number | string;
    maxLength?: number | string;
    pattern?: RegExp | string;
    custom?: (value: any) => boolean | string;
  };
  showCharacterCount?: boolean;
  helpText?: string;
  successText?: string;
  loadingText?: string;
  clearable?: boolean;
  copyable?: boolean;
  autoGrow?: boolean;
  preserveWhitespace?: boolean;
  validateOnMount?: boolean;
  debounceMs?: number;
  formatInput?: (value: string) => string;
  parseInput?: (value: string) => any;
}

const StyledTextField = styled(MuiTextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'var(--color-background-paper)',
    transition: 'all 0.2s ease-in-out',
    
    '&:hover': {
      backgroundColor: 'var(--color-surface-hover)',
      
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'var(--color-primary-light)',
      },
    },
    
    '&.Mui-focused': {
      backgroundColor: 'var(--color-background-paper)',
      
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'var(--color-primary-main)',
        borderWidth: '2px',
      },
    },
    
    '&.Mui-error': {
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'var(--color-error-main)',
      },
    },
    
    '&.field-success': {
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'var(--color-success-main)',
      },
    },
  },
  
  '& .MuiInputLabel-root': {
    color: 'var(--color-text-secondary)',
    fontSize: tokens.typography.body.medium.fontSize,
    
    '&.Mui-focused': {
      color: 'var(--color-primary-main)',
    },
    
    '&.Mui-error': {
      color: 'var(--color-error-main)',
    },
  },
  
  '& .MuiFormHelperText-root': {
    fontSize: tokens.typography.body.small.fontSize,
    marginTop: tokens.spacing.xs,
    
    '&.Mui-error': {
      color: 'var(--color-error-main)',
    },
    
    '&.helper-success': {
      color: 'var(--color-success-main)',
    },
    
    '&.helper-info': {
      color: 'var(--color-text-secondary)',
    },
  },
}));

const FieldWrapper = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
}));

const CharacterCount = styled(Typography)(({ theme }) => ({
  fontSize: tokens.typography.body.small.fontSize,
  color: 'var(--color-text-secondary)',
  textAlign: 'right',
  marginTop: tokens.spacing.xs,
  
  '&.count-warning': {
    color: 'var(--color-warning-main)',
  },
  
  '&.count-error': {
    color: 'var(--color-error-main)',
  },
}));

const StatusIcon = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  '& .MuiSvgIcon-root': {
    fontSize: '1.2rem',
  },
}));

export const TextField = forwardRef<HTMLInputElement, EnhancedTextFieldProps>((props, ref) => {
  const {
    name,
    label,
    variant = 'outlined',
    validation = {},
    showCharacterCount = false,
    helpText,
    successText,
    loadingText,
    clearable = false,
    copyable = false,
    autoGrow = false,
    preserveWhitespace = false,
    validateOnMount = false,
    debounceMs = 0,
    formatInput,
    parseInput,
    type = 'text',
    multiline = false,
    maxLength,
    disabled = false,
    required = false,
    placeholder,
    value: controlledValue,
    onChange: controlledOnChange,
    onBlur: controlledOnBlur,
    InputProps,
    ...textFieldProps
  } = props;

  const { register, formState, setValue, getValue, trigger } = useForm();
  const fieldId = useId();
  const helperTextId = `${fieldId}-helper-text`;
  const errorTextId = `${fieldId}-error-text`;

  // Internal state for enhanced features
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);
  const isPasswordType = type === 'password';
  
  // Get field state from form provider
  const fieldState = formState.fields[name];
  const fieldError = formState.errors[name];
  const fieldValue = getValue(name) || '';
  const hasError = !!fieldError;
  const hasSuccess = fieldState?.valid && fieldState?.touched && !hasError;
  const isValidating = fieldState?.validating;

  // Register field with form provider
  const registeredField = register(name, {
    required: validation.required || required,
    minLength: validation.minLength,
    maxLength: validation.maxLength || maxLength,
    pattern: validation.pattern,
    validate: validation.custom,
  });

  // Character count logic
  const currentLength = fieldValue?.length || 0;
  const maxCharLimit = Number(validation.maxLength || maxLength || 0);
  const showCharCount = showCharacterCount && maxCharLimit > 0;
  const charCountStatus = maxCharLimit > 0 ? 
    (currentLength > maxCharLimit * 0.9 ? (currentLength > maxCharLimit ? 'error' : 'warning') : 'normal') :
    'normal';

  // Helper text logic
  const getHelperText = () => {
    if (hasError && fieldError) {
      return fieldError.message;
    }
    if (isValidating && loadingText) {
      return loadingText;
    }
    if (hasSuccess && successText) {
      return successText;
    }
    if (helpText) {
      return helpText;
    }
    return '';
  };

  const helperTextContent = getHelperText();
  const helperTextClass = hasError ? 'Mui-error' : 
                         hasSuccess ? 'helper-success' : 'helper-info';

  // Enhanced input props
  const enhancedInputProps = {
    ...InputProps,
    endAdornment: (
      <>
        {/* Status indicators */}
        {(hasSuccess || hasError || isValidating) && (
          <InputAdornment position="end">
            <StatusIcon>
              {isValidating && <div className="loading-spinner" />}
              {hasSuccess && <CheckCircleIcon color="success" />}
              {hasError && <CancelIcon color="error" />}
            </StatusIcon>
          </InputAdornment>
        )}
        
        {/* Password visibility toggle */}
        {isPasswordType && (
          <InputAdornment position="end">
            <IconButton
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword(!showPassword)}
              edge="end"
            >
              {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
            </IconButton>
          </InputAdornment>
        )}
        
        {/* Clear button */}
        {clearable && fieldValue && !disabled && (
          <InputAdornment position="end">
            <IconButton
              aria-label="Clear field"
              onClick={() => setValue(name, '', { shouldValidate: true })}
              edge="end"
              size="small"
            >
              <CancelIcon />
            </IconButton>
          </InputAdornment>
        )}
        
        {/* Copy button */}
        {copyable && fieldValue && (
          <InputAdornment position="end">
            <IconButton
              aria-label="Copy to clipboard"
              onClick={() => navigator.clipboard.writeText(fieldValue)}
              edge="end"
              size="small"
            >
              <InfoIcon />
            </IconButton>
          </InputAdornment>
        )}
        
        {InputProps?.endAdornment}
      </>
    ),
  };

  return (
    <FieldWrapper>
      <StyledTextField
        {...textFieldProps}
        ref={ref}
        id={fieldId}
        name={registeredField.name}
        label={
          <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {label}
            {(required || validation.required) && <RequiredIndicator />}
            {helpText && (
              <Tooltip title={helpText} placement="top">
                <InfoIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
              </Tooltip>
            )}
          </Box>
        }
        variant={variant}
        type={isPasswordType ? (showPassword ? 'text' : 'password') : type}
        multiline={multiline}
        disabled={disabled}
        placeholder={placeholder}
        value={fieldValue}
        onChange={registeredField.onChange}
        onBlur={(event) => {
          setFocused(false);
          registeredField.onBlur(event);
          controlledOnBlur?.(event);
        }}
        onFocus={(event) => {
          setFocused(true);
          textFieldProps.onFocus?.(event);
        }}
        error={hasError}
        helperText={helperTextContent}
        InputProps={enhancedInputProps}
        FormHelperTextProps={{
          id: hasError ? errorTextId : helperTextId,
          className: helperTextClass,
          'aria-live': hasError ? 'polite' : 'off',
        }}
        inputProps={{
          'aria-describedby': helperTextContent ? (hasError ? errorTextId : helperTextId) : undefined,
          'aria-invalid': hasError,
          maxLength: maxCharLimit || undefined,
          ...textFieldProps.inputProps,
        }}
        className={`${hasSuccess ? 'field-success' : ''} ${textFieldProps.className || ''}`}
      />
      
      {/* Character count */}
      {showCharCount && (
        <CharacterCount 
          className={charCountStatus === 'normal' ? '' : `count-${charCountStatus}`}
        >
          {currentLength} / {maxCharLimit}
        </CharacterCount>
      )}
      
      {/* Screen reader announcements */}
      <VisuallyHidden>
        <div aria-live="polite" aria-atomic="true">
          {hasError && `Error: ${fieldError?.message}`}
          {hasSuccess && successText && `Success: ${successText}`}
          {isValidating && `Validating ${label}`}
        </div>
      </VisuallyHidden>
    </FieldWrapper>
  );
});

TextField.displayName = 'TextField';

export default TextField;