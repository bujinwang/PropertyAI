import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Typography,
  Grid,
  FormHelperText,
} from '@mui/material';
import { Upload as UploadIcon } from '@mui/icons-material';

interface UXReviewCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (reviewData: any) => void;
}

export const UXReviewCreateModal: React.FC<UXReviewCreateModalProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    componentId: '',
    componentType: 'COMPONENT',
    reviewType: 'USABILITY',
    severity: 'MEDIUM',
    priority: 'MEDIUM',
    environment: 'production',
    url: '',
    tags: '',
  });
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const componentTypes = [
    'PAGE',
    'COMPONENT',
    'FORM',
    'MODAL',
    'NAVIGATION',
    'BUTTON',
    'INPUT',
    'CHART',
    'TABLE',
    'OTHER',
  ];

  const reviewTypes = [
    'USABILITY',
    'ACCESSIBILITY',
    'DESIGN',
    'CONTENT',
    'PERFORMANCE',
    'SECURITY',
  ];

  const severityLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const priorityLevels = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
  const environments = ['development', 'staging', 'production'];

  const handleChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });
    
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: '',
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files).slice(0, 5); // Limit to 5 files
      setScreenshots([...screenshots, ...newFiles]);
    }
  };

  const removeScreenshot = (index: number) => {
    setScreenshots(screenshots.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.componentId.trim()) {
      newErrors.componentId = 'Component ID is required';
    }
    
    if (!formData.url.trim()) {
      newErrors.url = 'URL is required';
    } else if (!isValidUrl(formData.url)) {
      newErrors.url = 'Please enter a valid URL';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const reviewData = {
        ...formData,
        tags: tagsArray,
        screenshots: screenshots.map(file => file.name), // In real app, upload files first
      };

      onSubmit(reviewData);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        componentId: '',
        componentType: 'COMPONENT',
        reviewType: 'USABILITY',
        severity: 'MEDIUM',
        priority: 'MEDIUM',
        environment: 'production',
        url: '',
        tags: '',
      });
      setScreenshots([]);
      setErrors({});
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      aria-labelledby="create-review-dialog-title"
      aria-describedby="create-review-dialog-description"
    >
      <DialogTitle id="create-review-dialog-title">Create New UX Review</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }} id="create-review-dialog-description">
          <Grid container spacing={3}>
            {/* Basic Info */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Title *"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                error={!!errors.title}
                helperText={errors.title}
                variant="outlined"
                inputProps={{
                  'aria-label': 'Review title (required)',
                  'aria-required': 'true',
                  'aria-invalid': errors.title ? 'true' : 'false',
                  'aria-describedby': errors.title ? 'title-error' : undefined,
                }}
                FormHelperTextProps={{ id: 'title-error', role: 'alert' }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Component ID *"
                value={formData.componentId}
                onChange={(e) => handleChange('componentId', e.target.value)}
                error={!!errors.componentId}
                helperText={errors.componentId}
                variant="outlined"
                inputProps={{
                  'aria-label': 'Component ID (required)',
                  'aria-required': 'true',
                  'aria-invalid': errors.componentId ? 'true' : 'false',
                  'aria-describedby': errors.componentId ? 'component-id-error' : undefined,
                }}
                FormHelperTextProps={{ id: 'component-id-error', role: 'alert' }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                multiline
                rows={3}
                variant="outlined"
                inputProps={{
                  'aria-label': 'Review description (optional)',
                }}
              />
            </Grid>

            {/* Categorization */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Categorization
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel id="component-type-label">Component Type</InputLabel>
                <Select
                  value={formData.componentType}
                  onChange={(e) => handleChange('componentType', e.target.value)}
                  label="Component Type"
                  labelId="component-type-label"
                  inputProps={{
                    'aria-label': 'Select component type',
                  }}
                >
                  {componentTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type.replace('_', ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel id="review-type-label">Review Type</InputLabel>
                <Select
                  value={formData.reviewType}
                  onChange={(e) => handleChange('reviewType', e.target.value)}
                  label="Review Type"
                  labelId="review-type-label"
                  inputProps={{
                    'aria-label': 'Select review type',
                  }}
                >
                  {reviewTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type.replace('_', ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel id="severity-label">Severity</InputLabel>
                <Select
                  value={formData.severity}
                  onChange={(e) => handleChange('severity', e.target.value)}
                  label="Severity"
                  labelId="severity-label"
                  inputProps={{
                    'aria-label': 'Select severity level',
                  }}
                >
                  {severityLevels.map((level) => (
                    <MenuItem key={level} value={level}>
                      {level}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel id="priority-label">Priority</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                  label="Priority"
                  labelId="priority-label"
                  inputProps={{
                    'aria-label': 'Select priority level',
                  }}
                >
                  {priorityLevels.map((level) => (
                    <MenuItem key={level} value={level}>
                      {level}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Environment Info */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="environment-label">Environment</InputLabel>
                <Select
                  value={formData.environment}
                  onChange={(e) => handleChange('environment', e.target.value)}
                  label="Environment"
                  labelId="environment-label"
                  inputProps={{
                    'aria-label': 'Select environment',
                  }}
                >
                  {environments.map((env) => (
                    <MenuItem key={env} value={env}>
                      {env.charAt(0).toUpperCase() + env.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="URL *"
                value={formData.url}
                onChange={(e) => handleChange('url', e.target.value)}
                error={!!errors.url}
                helperText={errors.url}
                variant="outlined"
                placeholder="https://example.com/path"
                inputProps={{
                  'aria-label': 'URL (required)',
                  'aria-required': 'true',
                  'aria-invalid': errors.url ? 'true' : 'false',
                  'aria-describedby': errors.url ? 'url-error' : undefined,
                }}
                FormHelperTextProps={{ id: 'url-error', role: 'alert' }}
              />
            </Grid>

            {/* Tags */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tags"
                value={formData.tags}
                onChange={(e) => handleChange('tags', e.target.value)}
                variant="outlined"
                placeholder="tag1, tag2, tag3"
                helperText="Separate tags with commas"
                inputProps={{
                  'aria-label': 'Review tags (comma separated)',
                  'aria-describedby': 'tags-helper',
                }}
                FormHelperTextProps={{ id: 'tags-helper' }}
              />
            </Grid>

            {/* Screenshots */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom id="screenshots-label">
                Screenshots
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="screenshot-upload"
                  multiple
                  type="file"
                  onChange={() => {}} // Placeholder for file upload
                  aria-labelledby="screenshots-label"
                />
                <label htmlFor="screenshot-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<UploadIcon />}
                    disabled={screenshots.length >= 5}
                    aria-label={`Upload screenshots. ${screenshots.length} of 5 uploaded`}
                  >
                    Upload Screenshots ({screenshots.length}/5)
                  </Button>
                </label>

                {screenshots.length > 0 && (
                  <Box display="flex" flexWrap="wrap" gap={1} role="list" aria-label="Uploaded screenshots">
                    {screenshots.map((file, index) => (
                      <Chip
                        key={index}
                        label={file.name}
                        onDelete={() => removeScreenshot(index)}
                        variant="outlined"
                        role="listitem"
                        aria-label={`Screenshot: ${file.name}. Press Delete to remove`}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button 
          onClick={onClose} 
          color="inherit"
          aria-label="Cancel creating review"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          color="primary" 
          variant="contained"
          aria-label="Create new UX review"
        >
          Create Review
        </Button>
      </DialogActions>
    </Dialog>
  );
};