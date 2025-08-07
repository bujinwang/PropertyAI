import React, { useState, useEffect, useCallback } from 'react';
import {
  Autocomplete,
  TextField,
  Box,
  Typography,
  Avatar,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import { Person, Home } from '@mui/icons-material';
import { debounce } from '../../utils/debounce';
import { TenantSearchResult } from '../../types/enhancedTenantRating';
import { searchTenants } from '../../services/enhancedTenantRating.api';

interface TenantAutocompleteProps {
  onTenantSelect: (tenant: TenantSearchResult | null) => void;
  selectedTenant: TenantSearchResult | null;
  disabled?: boolean;
  placeholder?: string;
  label?: string;
}

const TenantAutocomplete: React.FC<TenantAutocompleteProps> = ({
  onTenantSelect,
  selectedTenant,
  disabled = false,
  placeholder = "Search by tenant name, email, or property address...",
  label = "Select Tenant"
}) => {
  const [options, setOptions] = useState<TenantSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query || query.length < 2) {
        setOptions([]);
        setLoading(false);
        return;
      }

      try {
        setError(null);
        const response = await searchTenants(query);
        setOptions(response.tenants);
      } catch (err) {
        console.error('Error searching tenants:', err);
        setError('Failed to search tenants. Please try again.');
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    if (inputValue) {
      setLoading(true);
      debouncedSearch(inputValue);
    } else {
      setOptions([]);
    }

    return () => {
      debouncedSearch.cancel();
    };
  }, [inputValue, debouncedSearch]);

  const handleInputChange = (event: React.SyntheticEvent, newInputValue: string) => {
    setInputValue(newInputValue);
  };

  const handleChange = (event: React.SyntheticEvent, newValue: TenantSearchResult | null) => {
    onTenantSelect(newValue);
  };

  const getOptionLabel = (option: TenantSearchResult) => {
    return `${option.firstName} ${option.lastName}`;
  };

  const isOptionEqualToValue = (option: TenantSearchResult, value: TenantSearchResult) => {
    return option.id === value.id;
  };

  const renderOption = (props: any, option: TenantSearchResult) => (
    <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
      <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>
        <Person />
      </Avatar>
      
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          {option.firstName} {option.lastName}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          {option.email}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Home sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary">
            {option.property.address}
            {option.property.unit !== 'N/A' && ` - Unit ${option.property.unit}`}
          </Typography>
        </Box>
        
        {option.currentLease && (
          <Chip
            label="Active Lease"
            size="small"
            color="success"
            variant="outlined"
            sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }}
          />
        )}
      </Box>
    </Box>
  );

  const renderInput = (params: any) => (
    <TextField
      {...params}
      label={label}
      placeholder={placeholder}
      variant="outlined"
      fullWidth
      error={!!error}
      helperText={error}
      InputProps={{
        ...params.InputProps,
        endAdornment: (
          <>
            {loading && <CircularProgress color="inherit" size={20} />}
            {params.InputProps.endAdornment}
          </>
        ),
      }}
    />
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Autocomplete
        options={options}
        value={selectedTenant}
        onChange={handleChange}
        onInputChange={handleInputChange}
        getOptionLabel={getOptionLabel}
        isOptionEqualToValue={isOptionEqualToValue}
        renderOption={renderOption}
        renderInput={renderInput}
        disabled={disabled}
        loading={loading}
        loadingText="Searching tenants..."
        noOptionsText={
          inputValue.length < 2 
            ? "Type at least 2 characters to search" 
            : "No tenants found"
        }
        filterOptions={(x) => x} // Disable client-side filtering since we do server-side search
        sx={{
          '& .MuiAutocomplete-listbox': {
            maxHeight: '300px',
          },
          '& .MuiAutocomplete-option': {
            padding: '8px 16px',
          }
        }}
      />
      
      {selectedTenant && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.50', borderRadius: 1, border: '1px solid', borderColor: 'primary.200' }}>
          <Typography variant="body2" color="primary.main" sx={{ fontWeight: 500, mb: 1 }}>
            Selected Tenant
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              <Person />
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {selectedTenant.firstName} {selectedTenant.lastName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedTenant.property.address}
                {selectedTenant.property.unit !== 'N/A' && ` - Unit ${selectedTenant.property.unit}`}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default TenantAutocomplete;