// PropertyFlow AI Button Showcase Component
// Test component to demonstrate all button variants and functionality

import React, { useState } from 'react';
import { Box, Typography, Grid, Paper, Divider } from '@mui/material';
import { 
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { Button } from '../design-system/components/Button';

const ButtonShowcase: React.FC = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const handleLoadingTest = (buttonId: string) => {
    setLoadingStates(prev => ({ ...prev, [buttonId]: true }));
    
    // Simulate loading for 2 seconds
    setTimeout(() => {
      setLoadingStates(prev => ({ ...prev, [buttonId]: false }));
    }, 2000);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h3" gutterBottom>
        PropertyFlow AI Button System
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Standardized button component showcasing all variants, sizes, and states.
        Replaces the previous dual API system with a clean, accessible interface.
      </Typography>

      {/* Button Variants */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Button Variants
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Button variant="primary">Primary</Button>
          </Grid>
          <Grid item>
            <Button variant="secondary">Secondary</Button>
          </Grid>
          <Grid item>
            <Button variant="outline">Outline</Button>
          </Grid>
          <Grid item>
            <Button variant="ghost">Ghost</Button>
          </Grid>
          <Grid item>
            <Button variant="danger">Danger</Button>
          </Grid>
          <Grid item>
            <Button variant="success">Success</Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Button Sizes */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Button Sizes
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Button variant="primary" size="small">Small (32px)</Button>
          </Grid>
          <Grid item>
            <Button variant="primary" size="medium">Medium (44px)</Button>
          </Grid>
          <Grid item>
            <Button variant="primary" size="large">Large (56px)</Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Button States */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Button States
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Button variant="primary">Normal</Button>
          </Grid>
          <Grid item>
            <Button variant="primary" disabled>Disabled</Button>
          </Grid>
          <Grid item>
            <Button 
              variant="primary" 
              loading={loadingStates['loading-test']}
              onClick={() => handleLoadingTest('loading-test')}
            >
              {loadingStates['loading-test'] ? 'Loading...' : 'Click to Load'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Icons and Content */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Icons & Content
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Button variant="primary" startIcon={<AddIcon />}>
              Add Property
            </Button>
          </Grid>
          <Grid item>
            <Button variant="secondary" endIcon={<ViewIcon />}>
              View Details
            </Button>
          </Grid>
          <Grid item>
            <Button variant="outline" startIcon={<DownloadIcon />} endIcon={<SaveIcon />}>
              Download & Save
            </Button>
          </Grid>
          <Grid item>
            <Button variant="success" startIcon={<CheckIcon />} size="small">
              Approve
            </Button>
          </Grid>
          
          {/* Icon-only buttons */}
          <Grid item>
            <Typography variant="body2" color="text.secondary">
              Icon-only:
            </Typography>
          </Grid>
          <Grid item>
            <Button variant="ghost" startIcon={<ViewIcon />} aria-label="View" />
          </Grid>
          <Grid item>
            <Button variant="danger" startIcon={<DeleteIcon />} aria-label="Delete" />
          </Grid>
        </Grid>
      </Paper>

      {/* Full Width */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Full Width Buttons
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Button variant="primary" fullWidth>
              Full Width Primary
            </Button>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button variant="outline" fullWidth>
              Full Width Outline
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Real-world Examples */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Real-world Usage Examples
        </Typography>
        
        <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
          Property Management Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item>
            <Button variant="success" startIcon={<CheckIcon />}>
              Approve Application
            </Button>
          </Grid>
          <Grid item>
            <Button variant="danger" startIcon={<DeleteIcon />}>
              Remove Property
            </Button>
          </Grid>
          <Grid item>
            <Button variant="outline" startIcon={<SaveIcon />}>
              Save Draft
            </Button>
          </Grid>
          <Grid item>
            <Button variant="ghost">
              Cancel
            </Button>
          </Grid>
        </Grid>
        
        <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
          Form Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item>
            <Button 
              variant="primary" 
              type="submit"
              loading={loadingStates['form-submit']}
              onClick={() => handleLoadingTest('form-submit')}
            >
              {loadingStates['form-submit'] ? 'Submitting...' : 'Submit Form'}
            </Button>
          </Grid>
          <Grid item>
            <Button variant="secondary" type="reset">
              Reset
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Divider sx={{ my: 3 }} />
      
      <Typography variant="body2" color="text.secondary" align="center">
        ✅ All buttons meet WCAG 2.1 AA accessibility requirements<br />
        ✅ 44px minimum touch target for medium and large sizes<br />
        ✅ Design token integration for consistent theming<br />
        ✅ Support for light and dark themes
      </Typography>
    </Box>
  );
};

export default ButtonShowcase;