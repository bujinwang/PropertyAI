import React, { useState } from 'react';
import { Box, Rating, Typography } from '@mui/material';
import { Star, StarBorder } from '@mui/icons-material';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  showValue?: boolean;
  label?: string;
  precision?: number;
}

const StarRating: React.FC<StarRatingProps> = ({
  value,
  onChange,
  disabled = false,
  size = 'medium',
  showValue = true,
  label,
  precision = 1
}) => {
  const [hoverValue, setHoverValue] = useState<number>(-1);

  const handleChange = (event: React.SyntheticEvent, newValue: number | null) => {
    if (onChange && newValue !== null) {
      onChange(newValue);
    }
  };

  const handleMouseEnter = (event: React.SyntheticEvent, newHoverValue: number) => {
    if (!disabled) {
      setHoverValue(newHoverValue);
    }
  };

  const handleMouseLeave = () => {
    setHoverValue(-1);
  };

  const displayValue = hoverValue !== -1 ? hoverValue : value;

  return (
    <Box display="flex" alignItems="center" gap={1}>
      {label && (
        <Typography variant="body2" color="text.secondary" minWidth="120px">
          {label}:
        </Typography>
      )}
      <Rating
        value={value}
        onChange={handleChange}
        onChangeActive={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        disabled={disabled}
        size={size}
        precision={precision}
        icon={<Star fontSize="inherit" />}
        emptyIcon={<StarBorder fontSize="inherit" />}
        sx={{
          '& .MuiRating-iconFilled': {
            color: '#ffc107',
          },
          '& .MuiRating-iconHover': {
            color: '#ffb300',
          },
          '& .MuiRating-iconEmpty': {
            color: '#e0e0e0',
          },
          '& .MuiRating-icon': {
            transition: 'color 0.2s ease-in-out',
          }
        }}
        aria-label={label ? `${label} rating` : 'Rating'}
      />
      {showValue && (
        <Typography 
          variant="body2" 
          color="text.secondary"
          minWidth="40px"
          sx={{ fontWeight: 500 }}
        >
          {displayValue > 0 ? displayValue.toFixed(precision === 0.5 ? 1 : 0) : '0'}
        </Typography>
      )}
    </Box>
  );
};

export default StarRating;