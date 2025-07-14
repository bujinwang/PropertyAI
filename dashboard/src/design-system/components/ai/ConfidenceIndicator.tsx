import React from 'react';
import { Box, LinearProgress, Typography, LinearProgressProps } from '@mui/material';

interface ConfidenceIndicatorProps extends LinearProgressProps {
  confidence: number; // A value between 0 and 100
}

const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({ confidence, ...props }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress variant="determinate" value={confidence} {...props} />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography variant="body2" color="text.secondary">{`${Math.round(
          confidence,
        )}%`}</Typography>
      </Box>
    </Box>
  );
};

export default ConfidenceIndicator;
