// PropertyFlow AI Enhanced Select Component
// Accessible select dropdown with search, multi-select, and validation

import * as React from 'react';
const { forwardRef, useState, useId, useMemo } = React;
import { styled } from '@mui/material/styles';
import {
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
  FormHelperText,
  Box,
  Chip,
  Typography,
  TextField,
  InputAdornment,
  ListSubheader,
  Checkbox,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { tokens } from '../../tokens';
import { useForm } from '../FormProvider';
import { VisuallyHidden, RequiredIndicator } from '../../accessibility';

export interface SelectOption {
  value: any;
  label: string;
  disabled?: boolean;
  group?: string;
  description?: string;
  icon?: React.ReactNode;
}

export interface EnhancedSelectProps {
  name: string;
  label: string;
  options: SelectOption[];
  variant?: 'outlined' | 'filled' | 'standard';
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  placeholder?: string;
  helpText?: string;
  successText?: string;
  loadingText?: string;
  noOptionsText?: string;
  maxSelections?: number;
  groupBy?: string;
  disabled?: boolean;
  required?: boolean;
  validation?: {
    required?: boolean | string;
    custom?: (value: any) => boolean | string;
  };
  renderValue?: (selected: any) => React.ReactNode;
  renderOption?: (option: SelectOption) => React.ReactNode;
  onSearchChange?: (searchTerm: string) => void;
  loading?: boolean;
  fullWidth?: boolean;
}

const StyledFormControl = styled(FormControl)(({ theme }) => ({
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

const SearchField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    padding: tokens.spacing.sm,
    
    '& input': {
      padding: `${tokens.spacing.xs} 0`,
    },
  },
}));

const OptionItem = styled(MenuItem)(({ theme }) => ({
  padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
  borderRadius: tokens.borderRadius.sm,
  margin: `0 ${tokens.spacing.xs}`,
  
  '&:hover': {
    backgroundColor: 'var(--color-surface-hover)',
  },
  
  '&.Mui-selected': {
    backgroundColor: 'var(--color-primary-light)',
    color: 'var(--color-primary-contrast)',
    
    '&:hover': {
      backgroundColor: 'var(--color-primary-main)',
    },
  },
}));

const OptionContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: tokens.spacing.sm,
  width: '100%',
}));

const OptionText = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1,
}));

const OptionDescription = styled(Typography)(({ theme }) => ({
  fontSize: tokens.typography.body.small.fontSize,
  color: 'var(--color-text-secondary)',
  marginTop: tokens.spacing.xs / 2,
}));

const ChipContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: tokens.spacing.xs,
  maxHeight: '120px',
  overflowY: 'auto',
}));

const StatusIndicator = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginLeft: tokens.spacing.sm,
  
  '& .MuiSvgIcon-root': {
    fontSize: '1.2rem',
  },
}));

export const Select = forwardRef<HTMLSelectElement, EnhancedSelectProps>((props, ref) => {
  const {
    name,
    label,
    options,
    variant = 'outlined',
    multiple = false,
    searchable = false,
    clearable = false,
    placeholder,
    helpText,
    successText,
    loadingText,
    noOptionsText = 'No options available',
    maxSelections,
    disabled = false,
    required = false,
    validation = {},
    renderValue,
    renderOption,
    onSearchChange,
    loading = false,
    fullWidth = true,
    ...selectProps
  } = props;

  const { register, formState, setValue, getValue } = useForm();
  const fieldId = useId();
  const helperTextId = `${fieldId}-helper-text`;
  const errorTextId = `${fieldId}-error-text`;

  // Internal state
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);

  // Get field state from form provider
  const fieldState = formState.fields[name];
  const fieldError = formState.errors[name];
  const fieldValue = getValue(name) || (multiple ? [] : '');
  const hasError = !!fieldError;
  const hasSuccess = fieldState?.valid && fieldState?.touched && !hasError;
  const isValidating = fieldState?.validating;

  // Register field with form provider
  const registeredField = register(name, {
    required: validation.required || required,
    validate: validation.custom,
  });

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchable || !searchTerm.trim()) {
      return options;
    }
    
    return options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm, searchable]);

  // Group options if needed
  const groupedOptions = useMemo(() => {
    const groups: Record<string, SelectOption[]> = {};
    const ungrouped: SelectOption[] = [];
    
    filteredOptions.forEach(option => {
      if (option.group) {
        if (!groups[option.group]) {
          groups[option.group] = [];
        }
        groups[option.group].push(option);
      } else {
        ungrouped.push(option);
      }
    });
    
    return { grouped: groups, ungrouped };
  }, [filteredOptions]);

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

  // Handle selection change
  const handleChange = (event: any) => {
    const value = event.target.value;
    
    // Check max selections for multiple select
    if (multiple && maxSelections && Array.isArray(value) && value.length > maxSelections) {
      return;
    }
    
    setValue(name, value, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    registeredField.onChange(event);
  };

  // Handle clear selection
  const handleClear = (event: React.MouseEvent) => {
    event.stopPropagation();
    setValue(name, multiple ? [] : '', { shouldValidate: true, shouldDirty: true });
  };

  // Custom render value for multiple select
  const renderMultipleValue = (selected: any[]) => {
    if (renderValue) {
      return renderValue(selected);
    }
    
    if (selected.length === 0) {
      return <em>{placeholder || 'Select options'}</em>;
    }
    
    return (
      <ChipContainer>
        {selected.map((value) => {
          const option = options.find(opt => opt.value === value);
          return (
            <Chip
              key={value}
              label={option?.label || value}
              size="small"
              onDelete={(e) => {
                e.stopPropagation();
                const newValue = selected.filter(v => v !== value);
                setValue(name, newValue, { shouldValidate: true, shouldDirty: true });
              }}
            />
          );
        })}
      </ChipContainer>
    );
  };

  // Render option content
  const renderOptionContent = (option: SelectOption, selected?: boolean) => {
    if (renderOption) {
      return renderOption(option);
    }
    
    return (
      <OptionContent>
        {multiple && (
          <Checkbox
            checked={selected || false}
            size="small"
          />
        )}
        {option.icon && <Box sx={{ mr: 1 }}>{option.icon}</Box>}
        <OptionText>
          <Typography variant="body2">{option.label}</Typography>
          {option.description && (
            <OptionDescription variant="caption">
              {option.description}
            </OptionDescription>
          )}
        </OptionText>
      </OptionContent>
    );
  };

  const hasValue = multiple ? Array.isArray(fieldValue) && fieldValue.length > 0 : fieldValue !== '';

  return (
    <StyledFormControl
      fullWidth={fullWidth}
      variant={variant}
      error={hasError}
      disabled={disabled}
      className={hasSuccess ? 'field-success' : ''}
    >
      <InputLabel id={`${fieldId}-label`}>
        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {label}
          {(required || validation.required) && <RequiredIndicator />}
          {helpText && (
            <Tooltip title={helpText} placement="top">
              <InfoIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
            </Tooltip>
          )}
        </Box>
      </InputLabel>
      
      <MuiSelect
        {...selectProps}
        ref={ref}
        labelId={`${fieldId}-label`}
        id={fieldId}
        name={registeredField.name}
        value={fieldValue}
        onChange={handleChange}
        onBlur={registeredField.onBlur}
        multiple={multiple}
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => {
          setOpen(false);
          setSearchTerm('');
        }}
        label={label}
        displayEmpty={!!placeholder}
        IconComponent={ExpandMoreIcon}
        renderValue={multiple ? renderMultipleValue : renderValue}
        MenuProps={{
          PaperProps: {
            sx: {
              maxHeight: 300,
              '& .MuiMenuItem-root': {
                whiteSpace: 'normal',
              },
            },
          },
        }}
        endAdornment={
          <StatusIndicator>
            {loading && <div className="loading-spinner" />}
            {hasSuccess && <CheckCircleIcon color="success" />}
            {hasError && <CancelIcon color="error" />}
            {clearable && hasValue && !disabled && (
              <ClearIcon
                sx={{ cursor: 'pointer', mr: 1 }}
                onClick={handleClear}
              />
            )}
          </StatusIndicator>
        }
        inputProps={{
          'aria-describedby': helperTextContent ? (hasError ? errorTextId : helperTextId) : undefined,
          'aria-invalid': hasError,
        }}
      >
        {/* Placeholder option */}
        {!multiple && placeholder && (
          <MenuItem value="" disabled>
            <em>{placeholder}</em>
          </MenuItem>
        )}
        
        {/* Search field */}
        {searchable && (
          <ListSubheader>
            <SearchField
              size="small"
              autoFocus
              placeholder="Search options..."
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                onSearchChange?.(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key !== 'Escape') {
                  e.stopPropagation();
                }
              }}
            />
          </ListSubheader>
        )}
        
        {/* Options */}
        {filteredOptions.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              {noOptionsText}
            </Typography>
          </MenuItem>
        ) : (
          <>
            {/* Ungrouped options */}
            {groupedOptions.ungrouped.map((option) => {
              const isSelected = multiple 
                ? Array.isArray(fieldValue) && fieldValue.includes(option.value)
                : fieldValue === option.value;
              
              return (
                <OptionItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  selected={isSelected}
                >
                  {renderOptionContent(option, isSelected)}
                </OptionItem>
              );
            })}
            
            {/* Grouped options */}
            {Object.entries(groupedOptions.grouped).map(([group, groupOptions]) => (
              <React.Fragment key={group}>
                <ListSubheader>{group}</ListSubheader>
                {groupOptions.map((option) => {
                  const isSelected = multiple 
                    ? Array.isArray(fieldValue) && fieldValue.includes(option.value)
                    : fieldValue === option.value;
                  
                  return (
                    <OptionItem
                      key={option.value}
                      value={option.value}
                      disabled={option.disabled}
                      selected={isSelected}
                    >
                      {renderOptionContent(option, isSelected)}
                    </OptionItem>
                  );
                })}
              </React.Fragment>
            ))}
          </>
        )}
      </MuiSelect>
      
      {/* Helper text */}
      {helperTextContent && (
        <FormHelperText 
          id={hasError ? errorTextId : helperTextId}
          className={helperTextClass}
          aria-live={hasError ? 'polite' : 'off'}
        >
          {helperTextContent}
        </FormHelperText>
      )}
      
      {/* Screen reader announcements */}
      <VisuallyHidden>
        <div aria-live="polite" aria-atomic="true">
          {hasError && `Error: ${fieldError?.message}`}
          {hasSuccess && successText && `Success: ${successText}`}
          {isValidating && `Validating ${label}`}
        </div>
      </VisuallyHidden>
    </StyledFormControl>
  );
});

Select.displayName = 'Select';

export default Select;