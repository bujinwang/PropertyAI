import React from 'react';
import { Chip, ChipProps } from '@mui/material';
import { WbIncandescent } from '@mui/icons-material';

const SuggestionChip: React.FC<ChipProps> = (props) => {
  return <Chip icon={<WbIncandescent />} label="AI Suggestion" variant="outlined" color="primary" {...props} />;
};

export default SuggestionChip;
