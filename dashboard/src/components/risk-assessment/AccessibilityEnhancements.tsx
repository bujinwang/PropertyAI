import React from 'react';
import { Box, Typography, Alert, AlertTitle } from '@mui/material';
import { AccessibilityNew as AccessibilityIcon } from '@mui/icons-material';

/**
 * Accessibility enhancements and compliance features for Risk Assessment Dashboard
 * Provides additional accessibility support and compliance information
 */
export const AccessibilityEnhancements: React.FC = () => {
  return (
    <Box
      role="complementary"
      aria-labelledby="accessibility-info"
      sx={{ 
        position: 'fixed',
        bottom: 16,
        right: 16,
        maxWidth: 300,
        zIndex: 1000,
        display: { xs: 'none', md: 'block' }
      }}
    >
      <Alert 
        severity="info" 
        icon={<AccessibilityIcon />}
        sx={{ 
          '& .MuiAlert-message': {
            fontSize: '0.75rem'
          }
        }}
      >
        <AlertTitle id="accessibility-info" sx={{ fontSize: '0.8rem' }}>
          Accessibility Features
        </AlertTitle>
        <Typography variant="caption" component="div">
          • Use Tab/Shift+Tab to navigate
          • Press Enter/Space to activate buttons
          • Use arrow keys in tables and lists
          • Screen reader compatible
        </Typography>
      </Alert>
    </Box>
  );
};

/**
 * Skip navigation link for keyboard users
 */
export const SkipNavigation: React.FC = () => {
  return (
    <Box
      component="a"
      href="#main-content"
      sx={{
        position: 'absolute',
        left: '-9999px',
        zIndex: 999,
        padding: 1,
        backgroundColor: 'primary.main',
        color: 'primary.contrastText',
        textDecoration: 'none',
        '&:focus': {
          left: '16px',
          top: '16px',
        },
      }}
    >
      Skip to main content
    </Box>
  );
};

/**
 * Keyboard navigation instructions component
 */
export const KeyboardInstructions: React.FC<{ visible: boolean }> = ({ visible }) => {
  if (!visible) return null;

  return (
    <Alert severity="info" sx={{ mb: 2 }}>
      <AlertTitle>Keyboard Navigation</AlertTitle>
      <Box component="ul" sx={{ m: 0, pl: 2 }}>
        <Typography component="li" variant="body2">
          Use <kbd>Tab</kbd> and <kbd>Shift+Tab</kbd> to navigate between elements
        </Typography>
        <Typography component="li" variant="body2">
          Press <kbd>Enter</kbd> or <kbd>Space</kbd> to activate buttons and links
        </Typography>
        <Typography component="li" variant="body2">
          Use arrow keys to navigate within tables and lists
        </Typography>
        <Typography component="li" variant="body2">
          Press <kbd>Escape</kbd> to close modals and dialogs
        </Typography>
      </Box>
    </Alert>
  );
};

export default AccessibilityEnhancements;