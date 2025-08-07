import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Divider,
  Grid,
  Chip,
  IconButton
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { Add, Close } from '@mui/icons-material';
import CategoryRating from './CategoryRating';
import { TenantSearchResult, CreateEnhancedRatingRequest, RatingCategory } from '../../types/enhancedTenantRating';
import { calculateOverallRating } from '../../services/enhancedTenantRating.api';

interface RatingFormProps {
  selectedTenant: TenantSearchResult | null;
  onSubmit: (ratingData: CreateEnhancedRatingRequest) => Promise<void>;
  loading?: boolean;
  disabled?: boolean;
}

const RatingForm: React.FC<RatingFormProps> = ({
  selectedTenant,
  onSubmit,
  loading = false,
  disabled = false
}) => {
  const [categories, setCategories] = useState({
    cleanliness: 0,
    communication: 0,
    paymentHistory: 0,
    propertyCare: 0
  });
  
  const [comment, setComment] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleCategoryChange = (category: RatingCategory, value: number) => {
    setCategories(prev => ({
      ...prev,
      [category]: value
    }));
    setError(null); // Clear error when user makes changes
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(prev => [...prev, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddTag();
    }
  };

  const validateForm = (): string | null => {
    if (!selectedTenant) {
      return 'Please select a tenant first.';
    }

    const categoryValues = Object.values(categories);
    if (categoryValues.every(value => value === 0)) {
      return 'Please provide at least one category rating.';
    }

    if (categoryValues.some(value => value < 1 || value > 5)) {
      return 'All ratings must be between 1 and 5 stars.';
    }

    return null;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setError(null);
      setSuccess(null);

      const ratingData: CreateEnhancedRatingRequest = {
        tenantId: selectedTenant!.id,
        leaseId: selectedTenant!.currentLease?.id || '',
        categories,
        comment: comment.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined
      };

      await onSubmit(ratingData);
      
      // Reset form on success
      setCategories({
        cleanliness: 0,
        communication: 0,
        paymentHistory: 0,
        propertyCare: 0
      });
      setComment('');
      setTags([]);
      setSuccess('Rating submitted successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err: any) {
      setError(err.message || 'Failed to submit rating. Please try again.');
    }
  };

  const overallRating = calculateOverallRating(categories);
  const isFormValid = selectedTenant && Object.values(categories).some(value => value > 0);

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        Submit Tenant Rating
      </Typography>

      {!selectedTenant && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Please select a tenant above to submit a rating.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Category Ratings */}
          <Grid item xs={12} md={8}>
            <CategoryRating
              categories={categories}
              onChange={handleCategoryChange}
              disabled={disabled || loading || !selectedTenant}
            />
          </Grid>

          {/* Overall Rating Display */}
          <Grid item xs={12} md={4}>
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, textAlign: 'center' }}>
              <Typography variant="h6" color="primary" gutterBottom>
                Overall Rating
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {overallRating > 0 ? overallRating.toFixed(1) : '0.0'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                out of 5.0
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
          </Grid>

          {/* Comment Section */}
          <Grid item xs={12}>
            <TextField
              label="Comments (Optional)"
              multiline
              rows={4}
              fullWidth
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={disabled || loading || !selectedTenant}
              placeholder="Share specific feedback about the tenant's performance..."
              helperText={`${comment.length}/500 characters`}
              inputProps={{ maxLength: 500 }}
            />
          </Grid>

          {/* Tags Section */}
          <Grid item xs={12}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
              Tags (Optional)
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              {tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={() => handleRemoveTag(tag)}
                  deleteIcon={<Close />}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                size="small"
                placeholder="Add a tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={disabled || loading || !selectedTenant}
                sx={{ flexGrow: 1, maxWidth: 200 }}
              />
              <IconButton
                onClick={handleAddTag}
                disabled={!newTag.trim() || disabled || loading || !selectedTenant}
                size="small"
                color="primary"
              >
                <Add />
              </IconButton>
            </Box>
            
            <Typography variant="caption" color="text.secondary">
              Add tags like "excellent", "needs improvement", "reliable", etc.
            </Typography>
          </Grid>

          {/* Submit Button */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
              <Button
                variant="outlined"
                onClick={() => {
                  setCategories({
                    cleanliness: 0,
                    communication: 0,
                    paymentHistory: 0,
                    propertyCare: 0
                  });
                  setComment('');
                  setTags([]);
                  setError(null);
                  setSuccess(null);
                }}
                disabled={disabled || loading}
              >
                Clear Form
              </Button>
              
              <LoadingButton
                type="submit"
                variant="contained"
                loading={loading}
                disabled={disabled || !isFormValid}
                sx={{ minWidth: 120 }}
              >
                Submit Rating
              </LoadingButton>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default RatingForm;