// PropertyFlow AI Theme Provider
// Main theme provider component that wraps the entire application

import React, { ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { ThemeContextProvider } from './ThemeContext';
import { useTheme } from './useTheme';
import { themes } from './themeConfig';
import { tokens } from '../tokens';

export interface PropertyFlowThemeProviderProps {
  children: ReactNode;
}

// Inner component that uses the theme hook
const ThemeProviderInner: React.FC<PropertyFlowThemeProviderProps> = ({ children }) => {
  const themeContext = useTheme();
  const currentTheme = themes[themeContext.theme];

  // Create Material-UI theme based on current theme
  const muiTheme = createTheme({
    palette: {
      mode: currentTheme.mode,
      primary: {
        main: currentTheme.colors.primary.main,
        light: currentTheme.colors.primary.light,
        dark: currentTheme.colors.primary.dark,
        contrastText: currentTheme.colors.primary.contrast,
      },
      secondary: {
        main: currentTheme.colors.secondary.main,
        light: currentTheme.colors.secondary.light,
        dark: currentTheme.colors.secondary.dark,
        contrastText: currentTheme.colors.secondary.contrast,
      },
      success: {
        main: currentTheme.colors.success.main,
        light: currentTheme.colors.success.light,
        dark: currentTheme.colors.success.dark,
        contrastText: currentTheme.colors.success.contrast,
      },
      warning: {
        main: currentTheme.colors.warning.main,
        light: currentTheme.colors.warning.light,
        dark: currentTheme.colors.warning.dark,
        contrastText: currentTheme.colors.warning.contrast,
      },
      error: {
        main: currentTheme.colors.error.main,
        light: currentTheme.colors.error.light,
        dark: currentTheme.colors.error.dark,
        contrastText: currentTheme.colors.error.contrast,
      },
      background: {
        default: currentTheme.colors.background.default,
        paper: currentTheme.colors.background.paper,
      },
      text: {
        primary: currentTheme.colors.text.primary,
        secondary: currentTheme.colors.text.secondary,
        disabled: currentTheme.colors.text.disabled,
      },
    },
    typography: {
      fontFamily: tokens.typography.fontFamily.sans,
      h1: {
        fontSize: tokens.typography.heading.h1.fontSize,
        fontWeight: tokens.typography.heading.h1.fontWeight,
        lineHeight: tokens.typography.heading.h1.lineHeight,
        letterSpacing: tokens.typography.heading.h1.letterSpacing,
      },
      h2: {
        fontSize: tokens.typography.heading.h2.fontSize,
        fontWeight: tokens.typography.heading.h2.fontWeight,
        lineHeight: tokens.typography.heading.h2.lineHeight,
        letterSpacing: tokens.typography.heading.h2.letterSpacing,
      },
      h3: {
        fontSize: tokens.typography.heading.h3.fontSize,
        fontWeight: tokens.typography.heading.h3.fontWeight,
        lineHeight: tokens.typography.heading.h3.lineHeight,
      },
      h4: {
        fontSize: tokens.typography.heading.h4.fontSize,
        fontWeight: tokens.typography.heading.h4.fontWeight,
        lineHeight: tokens.typography.heading.h4.lineHeight,
      },
      h5: {
        fontSize: tokens.typography.heading.h5.fontSize,
        fontWeight: tokens.typography.heading.h5.fontWeight,
        lineHeight: tokens.typography.heading.h5.lineHeight,
      },
      h6: {
        fontSize: tokens.typography.heading.h6.fontSize,
        fontWeight: tokens.typography.heading.h6.fontWeight,
        lineHeight: tokens.typography.heading.h6.lineHeight,
      },
      body1: {
        fontSize: tokens.typography.body.medium.fontSize,
        fontWeight: tokens.typography.body.medium.fontWeight,
        lineHeight: tokens.typography.body.medium.lineHeight,
      },
      body2: {
        fontSize: tokens.typography.body.small.fontSize,
        fontWeight: tokens.typography.body.small.fontWeight,
        lineHeight: tokens.typography.body.small.lineHeight,
      },
    },
    spacing: tokens.spacing.values.sm, // 8px base unit
    shape: {
      borderRadius: parseInt(tokens.borderRadius.md.replace('rem', '')) * 16,
    },
    components: {
      // Global component overrides
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            transition: 'background-color 0.3s ease, color 0.3s ease',
            fontFamily: tokens.typography.fontFamily.sans,
          },
          '*': {
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: currentTheme.colors.surface.default,
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: currentTheme.colors.border.default,
              borderRadius: '4px',
              '&:hover': {
                backgroundColor: currentTheme.colors.border.hover,
              },
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: tokens.typography.fontWeight.medium,
            borderRadius: tokens.borderRadius.md,
            minHeight: '44px', // Accessibility touch target
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: tokens.borderRadius.lg,
            boxShadow: tokens.shadows.base,
          },
        },
      },
    },
  });

  return (
    <ThemeContextProvider value={themeContext}>
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContextProvider>
  );
};

// Main theme provider component
export const PropertyFlowThemeProvider: React.FC<PropertyFlowThemeProviderProps> = ({ 
  children 
}) => {
  return (
    <ThemeProviderInner>
      {children}
    </ThemeProviderInner>
  );
};

export default PropertyFlowThemeProvider;