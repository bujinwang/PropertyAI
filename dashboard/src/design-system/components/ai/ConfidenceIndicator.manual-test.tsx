import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import ConfidenceIndicator from './ConfidenceIndicator';

/**
 * Manual test component for ConfidenceIndicator enhancements
 * This demonstrates the enhanced features implemented in task 2.2
 */
const ConfidenceIndicatorManualTest: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        ConfidenceIndicator Enhanced Features Test
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          1. Color-coded confidence levels (green/yellow/red)
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>High Confidence (≥80%) - Green</Typography>
            <ConfidenceIndicator confidence={90} colorCoded />
          </Box>
          
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>Medium Confidence (60-79%) - Yellow</Typography>
            <ConfidenceIndicator confidence={70} colorCoded />
          </Box>
          
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>Low Confidence (&lt;60%) - Red</Typography>
            <ConfidenceIndicator confidence={45} colorCoded />
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          2. Tooltip support with explanations
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>With custom explanation (hover to see)</Typography>
            <ConfidenceIndicator 
              confidence={85} 
              showTooltip 
              explanation="This confidence score is based on comprehensive data analysis including historical patterns, current market conditions, and predictive modeling algorithms."
              colorCoded 
            />
          </Box>
          
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>With default explanation (hover to see)</Typography>
            <ConfidenceIndicator 
              confidence={65} 
              showTooltip 
              colorCoded 
            />
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          3. Numerical score display control
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>With numerical score (default)</Typography>
            <ConfidenceIndicator confidence={78} colorCoded />
          </Box>
          
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>Without numerical score</Typography>
            <ConfidenceIndicator confidence={78} colorCoded showNumericalScore={false} />
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          4. Circular variant with enhancements
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ mb: 1 }}>High (with tooltip)</Typography>
            <ConfidenceIndicator 
              confidence={92} 
              variant="circular" 
              size="large"
              colorCoded 
              showTooltip
            />
          </Box>
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ mb: 1 }}>Medium</Typography>
            <ConfidenceIndicator 
              confidence={68} 
              variant="circular" 
              colorCoded 
            />
          </Box>
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ mb: 1 }}>Low (no score)</Typography>
            <ConfidenceIndicator 
              confidence={42} 
              variant="circular" 
              colorCoded 
              showNumericalScore={false}
            />
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          5. All sizes with enhancements
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>Small size</Typography>
            <ConfidenceIndicator confidence={85} size="small" colorCoded showTooltip />
          </Box>
          
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>Medium size (default)</Typography>
            <ConfidenceIndicator confidence={85} size="medium" colorCoded showTooltip />
          </Box>
          
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>Large size</Typography>
            <ConfidenceIndicator confidence={85} size="large" colorCoded showTooltip />
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default ConfidenceIndicatorManualTest;