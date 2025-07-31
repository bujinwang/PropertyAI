import React from 'react';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';

interface UXReviewFiltersProps {
  filters: {
    status: string;
    severity: string;
    priority: string;
    reviewType: string;
    tags: string;
  };
  onFilterChange: (filters: any) => void;
  isMobile: boolean;
}

export const UXReviewFilters: React.FC<UXReviewFiltersProps> = ({
  filters,
  onFilterChange,
  isMobile,
}) => {
  const theme = useTheme();

  const handleFilterChange = (field: string, value: string) => {
    onFilterChange({
      ...filters,
      [field]: value,
    });
  };

  const clearFilters = () => {
    onFilterChange({
      status: '',
      severity: '',
      priority: '',
      reviewType: '',
      tags: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  const filterOptions = {
    status: ['', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'WONT_FIX'],
    severity: ['', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    priority: ['', 'LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    reviewType: ['', 'USABILITY', 'ACCESSIBILITY', 'DESIGN', 'CONTENT', 'PERFORMANCE', 'SECURITY'],
  };

  return (
    <Box sx={{ mb: 3 }} role="region" aria-labelledby="filters-heading">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <FilterIcon fontSize="small" color="action" aria-hidden="true" />
          <Typography variant="h6" id="filters-heading">Filters</Typography>
        </Box>
        
        {hasActiveFilters && (
          <IconButton
            size="small"
            onClick={clearFilters}
            color="primary"
            title="Clear all filters"
            aria-label="Clear all active filters"
          >
            <ClearIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      <Box
        display="grid"
        gridTemplateColumns={isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))'}
        gap={2}
        mb={2}
      >
        <FormControl size="small" fullWidth>
          <InputLabel id="status-label">Status</InputLabel>
          <Select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            label="Status"
            labelId="status-label"
            inputProps={{
              'aria-label': 'Filter by status',
            }}
          >
            {filterOptions.status.map((option) => (
              <MenuItem key={option} value={option}>
                {option === '' ? 'All' : option.replace('_', ' ')}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" fullWidth>
          <InputLabel id="severity-label">Severity</InputLabel>
          <Select
            value={filters.severity}
            onChange={(e) => handleFilterChange('severity', e.target.value)}
            label="Severity"
            labelId="severity-label"
            inputProps={{
              'aria-label': 'Filter by severity',
            }}
          >
            {filterOptions.severity.map((option) => (
              <MenuItem key={option} value={option}>
                {option === '' ? 'All' : option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" fullWidth>
          <InputLabel id="priority-label">Priority</InputLabel>
          <Select
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            label="Priority"
            labelId="priority-label"
            inputProps={{
              'aria-label': 'Filter by priority',
            }}
          >
            {filterOptions.priority.map((option) => (
              <MenuItem key={option} value={option}>
                {option === '' ? 'All' : option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" fullWidth>
          <InputLabel id="type-label">Type</InputLabel>
          <Select
            value={filters.reviewType}
            onChange={(e) => handleFilterChange('reviewType', e.target.value)}
            label="Type"
            labelId="type-label"
            inputProps={{
              'aria-label': 'Filter by review type',
            }}
          >
            {filterOptions.reviewType.map((option) => (
              <MenuItem key={option} value={option}>
                {option === '' ? 'All' : option.replace('_', ' ')}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          size="small"
          label="Tags"
          value={filters.tags}
          onChange={(e) => handleFilterChange('tags', e.target.value)}
          placeholder="Enter tags separated by commas"
          fullWidth
          inputProps={{
            'aria-label': 'Filter by tags (comma separated)',
          }}
        />
      </Box>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <Box 
          display="flex" 
          flexWrap="wrap" 
          gap={1} 
          mb={2}
          role="list"
          aria-label="Active filters"
        >
          {Object.entries(filters).map(([key, value]) => {
            if (!value) return null;
            
            const label = key.charAt(0).toUpperCase() + key.slice(1);
            const displayValue = value.includes(',') 
              ? `${value.split(',').length} tags` 
              : value;
            
            return (
              <Chip
                key={key}
                label={`${label}: ${displayValue}`}
                size="small"
                onDelete={() => handleFilterChange(key, '')}
                color="primary"
                variant="outlined"
                role="listitem"
                aria-label={`Remove ${label} filter: ${displayValue}`}
              />
            );
          })}
        </Box>
      )}
    </Box>
  );
};