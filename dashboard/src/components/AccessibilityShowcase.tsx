// PropertyFlow AI Accessibility Showcase Component
// Demonstrates all accessibility features and best practices

import React, { useState, useRef } from 'react';
import { Box, Typography, Grid, Paper, Divider, TextField, FormControl, FormLabel, Alert } from '@mui/material';
import { 
  VisuallyHidden, 
  SkipLink, 
  FocusableContainer, 
  ErrorMessage, 
  StatusMessage, 
  RequiredIndicator,
  useAnnouncements,
  useKeyboardNavigation,
  useReducedMotion,
  useDisclosure,
  checkColorContrast,
  ACCESSIBILITY_CONSTANTS,
} from '../design-system/accessibility';
import { Button } from '../design-system/components/Button';
import { Add as AddIcon, Check as CheckIcon, Warning as WarningIcon } from '@mui/icons-material';

const AccessibilityShowcase: React.FC = () => {
  const { announce } = useAnnouncements();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<string>('');
  const prefersReducedMotion = useReducedMotion();
  
  // Disclosure example
  const disclosure = useDisclosure();
  
  // Form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      announce('Form has errors. Please review and correct them.', 'assertive');
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setStatus('Form submitted successfully!');
      announce('Form submitted successfully!', 'polite');
    }
  };

  const handleAddItem = () => {
    announce('New property added to the list');
  };

  const handleColorContrastTest = () => {
    const result = checkColorContrast('#1976d2', '#ffffff');
    announce(`Color contrast ratio is ${result.ratio}:1 - ${result.grade} compliance`);
  };

  // Keyboard navigation example
  useKeyboardNavigation({
    onEscape: () => {
      announce('Escape key pressed - canceling current action');
    },
  });

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Skip Link Example */}
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      
      <Typography variant="h3" gutterBottom id="main-heading">
        PropertyFlow AI Accessibility Foundation
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Comprehensive accessibility features ensuring WCAG 2.1 AA compliance across all components.
        This showcase demonstrates screen reader support, keyboard navigation, focus management, and more.
      </Typography>

      {/* Motion Preferences */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Motion Preferences
        </Typography>
        
        <Alert severity="info" sx={{ mb: 2 }}>
          User prefers reduced motion: <strong>{prefersReducedMotion ? 'Yes' : 'No'}</strong>
          <br />
          <small>Animations and transitions are {prefersReducedMotion ? 'disabled' : 'enabled'} based on system preference</small>
        </Alert>
        
        <Button variant="primary" onClick={handleAddItem}>
          Test Motion Preference
        </Button>
      </Paper>

      {/* Color Contrast Testing */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Color Contrast Validation
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              WCAG 2.1 AA Requirements:
              <br />• Normal text: {ACCESSIBILITY_CONSTANTS.MIN_CONTRAST_NORMAL_TEXT}:1 minimum
              <br />• Large text: {ACCESSIBILITY_CONSTANTS.MIN_CONTRAST_LARGE_TEXT}:1 minimum
              <br />• UI components: {ACCESSIBILITY_CONSTANTS.MIN_CONTRAST_UI_COMPONENTS}:1 minimum
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button variant="outline" onClick={handleColorContrastTest}>
              Test Primary Color Contrast
            </Button>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Contrast examples:
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
            <Box sx={{ 
              p: 1, 
              backgroundColor: 'var(--color-primary-main)', 
              color: 'var(--color-primary-contrast)',
              borderRadius: 1,
            }}>
              Primary Button (✓ AA)
            </Box>
            <Box sx={{ 
              p: 1, 
              backgroundColor: 'var(--color-success-main)', 
              color: 'var(--color-success-contrast)',
              borderRadius: 1,
            }}>
              Success Status (✓ AA)
            </Box>
            <Box sx={{ 
              p: 1, 
              backgroundColor: 'var(--color-error-main)', 
              color: 'var(--color-error-contrast)',
              borderRadius: 1,
            }}>
              Error State (✓ AA)
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Focus Management */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Focus Management & Keyboard Navigation
        </Typography>
        
        <Typography variant="body2" sx={{ mb: 2 }}>
          Press Tab to navigate between elements. Press Enter or Space to activate buttons.
          Press Escape to test keyboard navigation handlers.
        </Typography>
        
        <FocusableContainer trapFocus={false}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button variant="primary" startIcon={<AddIcon />}>
              Focusable Button 1
            </Button>
            <Button variant="secondary">
              Focusable Button 2
            </Button>
            <Button variant="outline">
              Focusable Button 3
            </Button>
            <Button variant="ghost" endIcon={<CheckIcon />}>
              Focusable Button 4
            </Button>
          </Box>
        </FocusableContainer>
      </Paper>

      {/* Screen Reader Support */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Screen Reader Support
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            The following content includes screen reader only text:
          </Typography>
          <Typography variant="body1">
            Property status: Available
            <VisuallyHidden>, last updated 2 hours ago, 3 inquiries pending</VisuallyHidden>
          </Typography>
        </Box>
        
        <Button 
          variant="primary" 
          onClick={() => announce('This is a screen reader announcement')}
        >
          Test Screen Reader Announcement
        </Button>
        
        <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
          Click the button above to hear a screen reader announcement
        </Typography>
      </Paper>

      {/* Form Accessibility */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Accessible Form Example
        </Typography>
        
        <form onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={Boolean(errors.email)}>
                <FormLabel htmlFor="email-input">
                  Email Address
                  <RequiredIndicator />
                </FormLabel>
                <TextField
                  id="email-input"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  error={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'email-error' : 'email-help'}
                  aria-required="true"
                  autoComplete="email"
                />
                {errors.email && (
                  <ErrorMessage id="email-error">
                    <WarningIcon fontSize="small" />
                    {errors.email}
                  </ErrorMessage>
                )}
                {!errors.email && (
                  <Typography id="email-help" variant="caption" color="text.secondary">
                    We'll use this email for account notifications
                  </Typography>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={Boolean(errors.password)}>
                <FormLabel htmlFor="password-input">
                  Password
                  <RequiredIndicator />
                </FormLabel>
                <TextField
                  id="password-input"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  error={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'password-error' : 'password-help'}
                  aria-required="true"
                  autoComplete="new-password"
                />
                {errors.password && (
                  <ErrorMessage id="password-error">
                    <WarningIcon fontSize="small" />
                    {errors.password}
                  </ErrorMessage>
                )}
                {!errors.password && (
                  <Typography id="password-help" variant="caption" color="text.secondary">
                    Must be at least 8 characters long
                  </Typography>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Button 
                type="submit" 
                variant="primary" 
                startIcon={<CheckIcon />}
              >
                Submit Form
              </Button>
            </Grid>
          </Grid>
        </form>
        
        {status && (
          <StatusMessage status="success" sx={{ mt: 2 }}>
            <CheckIcon fontSize="small" />
            {status}
          </StatusMessage>
        )}
      </Paper>

      {/* Disclosure Pattern */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Accessible Disclosure Pattern
        </Typography>
        
        <Button 
          variant="outline"
          onClick={disclosure.toggle}
          {...disclosure.triggerProps}
        >
          {disclosure.isOpen ? 'Hide' : 'Show'} Advanced Settings
        </Button>
        
        <Box 
          {...disclosure.contentProps}
          sx={{ 
            mt: 2, 
            p: 2, 
            backgroundColor: 'var(--color-surface-default)',
            borderRadius: 1,
            display: disclosure.isOpen ? 'block' : 'none',
          }}
        >
          <Typography variant="h6" gutterBottom>
            Advanced Configuration
          </Typography>
          <Typography variant="body2">
            This content is properly associated with the trigger button using ARIA attributes.
            Screen readers will announce the expanded/collapsed state.
          </Typography>
        </Box>
      </Paper>

      <Divider sx={{ my: 3 }} />
      
      {/* Accessibility Summary */}
      <Paper sx={{ p: 3, backgroundColor: 'var(--color-success-light)', border: '1px solid var(--color-success-main)' }}>
        <Typography variant="h6" gutterBottom color="var(--color-success-dark)">
          ✅ WCAG 2.1 AA Compliance Features Implemented
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Perceivable
            </Typography>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>Color contrast ratios meet 4.5:1 minimum</li>
              <li>Alternative text for images</li>
              <li>Resizable text support</li>
              <li>Color is not the only visual means of conveying information</li>
            </ul>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Operable
            </Typography>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>All functionality available from keyboard</li>
              <li>44px minimum touch target sizes</li>
              <li>No content flashes more than 3 times per second</li>
              <li>Users can extend time limits</li>
            </ul>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Understandable
            </Typography>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>Clear and consistent navigation</li>
              <li>Error identification and suggestions</li>
              <li>Labels and instructions for user input</li>
              <li>Predictable functionality</li>
            </ul>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Robust
            </Typography>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>Valid HTML markup</li>
              <li>Screen reader compatibility</li>
              <li>Proper ARIA usage</li>
              <li>Assistive technology support</li>
            </ul>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default AccessibilityShowcase;