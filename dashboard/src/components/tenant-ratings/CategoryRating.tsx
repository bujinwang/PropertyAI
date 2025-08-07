import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import StarRating from './StarRating';
import { RATING_CATEGORIES, RatingCategory } from '../../types/enhancedTenantRating';

interface CategoryRatingProps {
  categories: {
    cleanliness: number;
    communication: number;
    paymentHistory: number;
    propertyCare: number;
  };
  onChange?: (category: RatingCategory, value: number) => void;
  disabled?: boolean;
  showLabels?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const CATEGORY_DESCRIPTIONS = {
  cleanliness: 'How well the tenant maintains cleanliness of the property',
  communication: 'Responsiveness and quality of communication with property management',
  paymentHistory: 'Timeliness and consistency of rent and fee payments',
  propertyCare: 'Care taken to maintain and protect the property from damage'
};

const CategoryRating: React.FC<CategoryRatingProps> = ({
  categories,
  onChange,
  disabled = false,
  showLabels = true,
  size = 'medium'
}) => {
  const handleCategoryChange = (category: RatingCategory) => (value: number) => {
    if (onChange) {
      onChange(category, value);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {showLabels && (
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Category Ratings
        </Typography>
      )}
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {Object.entries(RATING_CATEGORIES).map(([key, label]) => {
          const category = key as RatingCategory;
          return (
            <Box key={category} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip 
                title={CATEGORY_DESCRIPTIONS[category]} 
                placement="top"
                arrow
              >
                <Box sx={{ minWidth: '140px', cursor: 'help' }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 500,
                      color: 'text.primary',
                      '&:hover': {
                        color: 'primary.main'
                      }
                    }}
                  >
                    {label}
                  </Typography>
                </Box>
              </Tooltip>
              
              <StarRating
                value={categories[category]}
                onChange={onChange ? handleCategoryChange(category) : undefined}
                disabled={disabled}
                size={size}
                showValue={true}
                precision={1}
              />
            </Box>
          );
        })}
      </Box>
      
      {!disabled && onChange && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            💡 Hover over category names for detailed descriptions. 
            Click stars to rate each category from 1-5.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default CategoryRating;