import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  InputAdornment,
  IconButton,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { usePullToRefresh } from '../hooks/useTouchGestures';

export interface MobileFormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'search' | 'select';
  required?: boolean;
  placeholder?: string;
  helperText?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: (value: string) => string | null;
  autoComplete?: string;
  inputMode?: 'text' | 'numeric' | 'tel' | 'email' | 'url' | 'search';
}

export interface MobileFormProps {
  fields: MobileFormField[];
  onSubmit: (data: Record<string, string>) => Promise<void>;
  onRefresh?: () => Promise<void>;
  submitLabel?: string;
  loading?: boolean;
  error?: string;
  success?: string;
  enablePullToRefresh?: boolean;
  className?: string;
}

const MobileForm: React.FC<MobileFormProps> = ({
  fields,
  onSubmit,
  onRefresh,
  submitLabel = 'Submit',
  loading = false,
  error,
  success,
  enablePullToRefresh = false,
  className
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);

  // Pull-to-refresh functionality
  const { ref: pullToRefreshRef, pullDistance } = usePullToRefresh(
    async () => {
      if (onRefresh) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }
    },
    80
  );

  const validateField = useCallback((field: MobileFormField, value: string): string | null => {
    if (field.required && !value.trim()) {
      return `${field.label} is required`;
    }

    if (field.validation) {
      return field.validation(value);
    }

    // Built-in validations
    switch (field.type) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRegex.test(value)) {
          return 'Please enter a valid email address';
        }
        break;
      case 'tel':
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (value && !phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
          return 'Please enter a valid phone number';
        }
        break;
      case 'number':
        if (value && isNaN(Number(value))) {
          return 'Please enter a valid number';
        }
        break;
    }

    return null;
  }, []);

  const handleFieldChange = useCallback((fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));

    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: '' }));
    }
  }, [errors]);

  const handleFieldBlur = useCallback((field: MobileFormField) => {
    const error = validateField(field, formData[field.name] || '');
    if (error) {
      setErrors(prev => ({ ...prev, [field.name]: error }));
    }
  }, [formData, validateField]);

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();

    // Validate all fields
    const newErrors: Record<string, string> = {};
    let hasErrors = false;

    fields.forEach(field => {
      const error = validateField(field, formData[field.name] || '');
      if (error) {
        newErrors[field.name] = error;
        hasErrors = true;
      }
    });

    setErrors(newErrors);

    if (hasErrors) {
      // Focus first error field
      const firstErrorField = fields.find(field => newErrors[field.name]);
      if (firstErrorField) {
        const element = document.getElementById(`field-${firstErrorField.name}`);
        element?.focus();
      }
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission failed:', error);
    }
  }, [fields, formData, validateField, onSubmit]);

  const clearField = useCallback((fieldName: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: '' }));
    setErrors(prev => ({ ...prev, [fieldName]: '' }));
  }, []);

  const togglePasswordVisibility = useCallback((fieldName: string) => {
    setShowPassword(prev => ({ ...prev, [fieldName]: !prev[fieldName] }));
  }, []);

  return (
    <Box
      ref={enablePullToRefresh ? pullToRefreshRef : undefined}
      className={`mobile-form ${className || ''}`}
      sx={{
        position: 'relative',
        minHeight: enablePullToRefresh ? '100vh' : 'auto'
      }}
    >
      {/* Pull-to-refresh indicator */}
      {enablePullToRefresh && pullDistance > 0 && (
        <Box
          sx={{
            position: 'absolute',
            top: Math.min(pullDistance - 50, 30),
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            opacity: Math.min(pullDistance / 80, 1),
            transition: 'opacity 0.2s ease'
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              border: '3px solid #e2e8f0',
              borderTop: '3px solid #3b82f6',
              borderRadius: '50%',
              animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
            }}
          />
        </Box>
      )}

      {/* Refreshing indicator */}
      {isRefreshing && (
        <Box
          sx={{
            position: 'absolute',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            bgcolor: 'background.paper',
            px: 2,
            py: 1,
            borderRadius: 2,
            boxShadow: 2
          }}
        >
          <CircularProgress size={16} />
          <Typography variant="body2">Refreshing...</Typography>
        </Box>
      )}

      <Box
        component="form"
        ref={formRef}
        onSubmit={handleSubmit}
        sx={{
          pt: enablePullToRefresh ? 4 : 0,
          px: 2,
          pb: 2
        }}
      >
        {/* Status Messages */}
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

        {/* Form Fields */}
        {fields.map((field) => (
          <Box key={field.name} sx={{ mb: 3 }}>
            {field.type === 'select' ? (
              <FormControl
                fullWidth
                error={!!errors[field.name]}
                variant="outlined"
              >
                <InputLabel id={`${field.name}-label`}>
                  {field.label}
                  {field.required && ' *'}
                </InputLabel>
                <Select
                  labelId={`${field.name}-label`}
                  id={`field-${field.name}`}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  onBlur={() => handleFieldBlur(field)}
                  label={field.label}
                  inputProps={{
                    'aria-describedby': errors[field.name] ? `${field.name}-helper-text` : undefined
                  }}
                  sx={{
                    '& .MuiSelect-select': {
                      fontSize: '1rem', // Prevent zoom on iOS
                      minHeight: '1.5rem'
                    }
                  }}
                >
                  {field.options?.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors[field.name] && (
                  <FormHelperText id={`${field.name}-helper-text`}>
                    {errors[field.name]}
                  </FormHelperText>
                )}
              </FormControl>
            ) : (
              <TextField
                id={`field-${field.name}`}
                name={field.name}
                label={field.label}
                type={
                  field.type === 'password'
                    ? (showPassword[field.name] ? 'text' : 'password')
                    : field.type
                }
                value={formData[field.name] || ''}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                onBlur={() => handleFieldBlur(field)}
                placeholder={field.placeholder}
                required={field.required}
                error={!!errors[field.name]}
                helperText={errors[field.name] || field.helperText}
                fullWidth
                autoComplete={field.autoComplete}
                inputMode={field.inputMode}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      {/* Clear button for text/search fields */}
                      {(field.type === 'text' || field.type === 'search' || field.type === 'email') &&
                       formData[field.name] && (
                        <IconButton
                          onClick={() => clearField(field.name)}
                          edge="end"
                          size="small"
                          sx={{ mr: 0.5 }}
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      )}

                      {/* Password visibility toggle */}
                      {field.type === 'password' && (
                        <IconButton
                          onClick={() => togglePasswordVisibility(field.name)}
                          edge="end"
                          size="small"
                        >
                          {showPassword[field.name] ? (
                            <VisibilityOffIcon fontSize="small" />
                          ) : (
                            <VisibilityIcon fontSize="small" />
                          )}
                        </IconButton>
                      )}

                      {/* Search icon */}
                      {field.type === 'search' && (
                        <SearchIcon color="action" fontSize="small" />
                      )}
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: '1rem', // Prevent zoom on iOS
                    minHeight: '1.5rem'
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '1rem'
                  }
                }}
              />
            )}
          </Box>
        ))}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={loading}
          sx={{
            minHeight: 48,
            fontSize: '1rem',
            mt: 2
          }}
        >
          {loading ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Processing...
            </>
          ) : (
            submitLabel
          )}
        </Button>

        {/* Pull-to-refresh hint */}
        {enablePullToRefresh && !isRefreshing && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: 'block',
              textAlign: 'center',
              mt: 2,
              opacity: 0.7
            }}
          >
            Pull down to refresh
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default MobileForm;