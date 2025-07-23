import React from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Slider,
  Button,
  Divider,
  Chip,
  IconButton
} from '@mui/material';
import {
  Clear as ClearIcon,
  FilterList as FilterListIcon
} from '@mui/material';
import { FiltersPanelProps, InsightCategory, InsightPriority, TimeRange } from '../../types/ai-insights';

const FiltersPanel: React.FC<FiltersPanelProps> = ({
  filters,
  onFiltersChange,
  categories
}) => {
  // Category options
  const categoryOptions: { value: InsightCategory; label: string }[] = [
    { value: 'financial', label: 'Financial' },
    { value: 'operational', label: 'Operational' },
    { value: 'tenant_satisfaction', label: 'Tenant Satisfaction' }
  ];

  // Priority options
  const priorityOptions: { value: InsightPriority; label: string; color: string }[] = [
    { value: 'critical', label: 'Critical', color: '#f44336' },
    { value: 'high', label: 'High', color: '#ff9800' },
    { value: 'medium', label: 'Medium', color: '#2196f3' },
    { value: 'low', label: 'Low', color: '#4caf50' }
  ];

  // Time range options
  const timeRangeOptions: { value: TimeRange; label: string }[] = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' }
  ];

  // Sort options
  const sortOptions = [
    { value: 'priority', label: 'Priority' },
    { value: 'confidence', label: 'Confidence' },
    { value: 'impact', label: 'Impact' },
    { value: 'timestamp', label: 'Date' }
  ];

  // Handle category change
  const handleCategoryChange = (category: InsightCategory, checked: boolean) => {
    const newCategories = checked
      ? [...filters.categories, category]
      : filters.categories.filter(c => c !== category);
    onFiltersChange({ categories: newCategories });
  };

  // Handle priority change
  const handlePriorityChange = (priority: InsightPriority, checked: boolean) => {
    const newPriorities = checked
      ? [...filters.priorities, priority]
      : filters.priorities.filter(p => p !== priority);
    onFiltersChange({ priorities: newPriorities });
  };

  // Clear all filters
  const clearAllFilters = () => {
    onFiltersChange({
      categories: [],
      priorities: [],
      timeRange: '30d',
      searchQuery: '',
      sortBy: 'priority',
      sortOrder: 'desc'
    });
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.categories.length > 0) count++;
    if (filters.priorities.length > 0) count++;
    if (filters.timeRange !== '30d') count++;
    if (filters.searchQuery) count++;
    if (filters.sortBy !== 'priority' || filters.sortOrder !== 'desc') count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <Paper sx={{ p: 3, height: 'fit-content' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterListIcon color="primary" />
          <Typography variant="h6">
            Filters
          </Typography>
          {activeFilterCount > 0 && (
            <Chip 
              label={activeFilterCount} 
              size="small" 
              color="primary" 
            />
          )}
        </Box>
        {activeFilterCount > 0 && (
          <IconButton size="small" onClick={clearAllFilters}>
            <ClearIcon />
          </IconButton>
        )}
      </Box>

      {/* Categories */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Categories
        </Typography>
        <FormGroup>
          {categoryOptions.map((option) => (
            <FormControlLabel
              key={option.value}
              control={
                <Checkbox
                  checked={filters.categories.includes(option.value)}
                  onChange={(e) => handleCategoryChange(option.value, e.target.checked)}
                  size="small"
                />
              }
              label={option.label}
            />
          ))}
        </FormGroup>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Priorities */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Priority
        </Typography>
        <FormGroup>
          {priorityOptions.map((option) => (
            <FormControlLabel
              key={option.value}
              control={
                <Checkbox
                  checked={filters.priorities.includes(option.value)}
                  onChange={(e) => handlePriorityChange(option.value, e.target.checked)}
                  size="small"
                  sx={{ color: option.color }}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: option.color
                    }}
                  />
                  {option.label}
                </Box>
              }
            />
          ))}
        </FormGroup>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Time Range */}
      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Time Range</InputLabel>
          <Select
            value={filters.timeRange}
            label="Time Range"
            onChange={(e) => onFiltersChange({ timeRange: e.target.value as TimeRange })}
          >
            {timeRangeOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Sort Options */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Sort By
        </Typography>
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <Select
            value={filters.sortBy}
            onChange={(e) => onFiltersChange({ sortBy: e.target.value as any })}
          >
            {sortOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl fullWidth size="small">
          <Select
            value={filters.sortOrder}
            onChange={(e) => onFiltersChange({ sortOrder: e.target.value as 'asc' | 'desc' })}
          >
            <MenuItem value="desc">Descending</MenuItem>
            <MenuItem value="asc">Ascending</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Active Filters Summary */}
      {activeFilterCount > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Active Filters
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {filters.categories.map((category) => (
                <Chip
                  key={category}
                  label={categoryOptions.find(c => c.value === category)?.label}
                  size="small"
                  onDelete={() => handleCategoryChange(category, false)}
                  color="primary"
                  variant="outlined"
                />
              ))}
              {filters.priorities.map((priority) => (
                <Chip
                  key={priority}
                  label={priorityOptions.find(p => p.value === priority)?.label}
                  size="small"
                  onDelete={() => handlePriorityChange(priority, false)}
                  color="secondary"
                  variant="outlined"
                />
              ))}
              {filters.timeRange !== '30d' && (
                <Chip
                  label={timeRangeOptions.find(t => t.value === filters.timeRange)?.label}
                  size="small"
                  onDelete={() => onFiltersChange({ timeRange: '30d' })}
                  color="default"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
        </>
      )}

      {/* Clear All Button */}
      {activeFilterCount > 0 && (
        <Button
          fullWidth
          variant="outlined"
          onClick={clearAllFilters}
          sx={{ mt: 2 }}
          startIcon={<ClearIcon />}
        >
          Clear All Filters
        </Button>
      )}
    </Paper>
  );
};

export default FiltersPanel;