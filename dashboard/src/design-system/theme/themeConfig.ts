// PropertyFlow AI Theme Configuration
// Light and dark theme definitions with CSS custom property mappings

import { tokens } from '../tokens';

export type ThemeMode = 'light' | 'dark';

export interface ThemeConfig {
  mode: ThemeMode;
  colors: {
    background: {
      default: string;
      paper: string;
      elevated: string;
    };
    surface: {
      default: string;
      hover: string;
      selected: string;
      disabled: string;
    };
    text: {
      primary: string;
      secondary: string;
      disabled: string;
    };
    primary: {
      main: string;
      light: string;
      dark: string;
      contrast: string;
    };
    secondary: {
      main: string;
      light: string;
      dark: string;
      contrast: string;
    };
    success: {
      main: string;
      light: string;
      dark: string;
      contrast: string;
    };
    warning: {
      main: string;
      light: string;
      dark: string;
      contrast: string;
    };
    error: {
      main: string;
      light: string;
      dark: string;
      contrast: string;
    };
    border: {
      default: string;
      hover: string;
      focus: string;
    };
  };
}

// Light theme configuration
export const lightTheme: ThemeConfig = {
  mode: 'light',
  colors: {
    background: {
      default: '#ffffff',
      paper: tokens.colors.primitive.gray[50],
      elevated: '#ffffff',
    },
    surface: {
      default: tokens.colors.primitive.gray[100],
      hover: tokens.colors.primitive.gray[200],
      selected: tokens.colors.primitive.blue[50],
      disabled: tokens.colors.primitive.gray[100],
    },
    text: {
      primary: tokens.colors.primitive.gray[900],
      secondary: tokens.colors.primitive.gray[600],
      disabled: tokens.colors.primitive.gray[400],
    },
    primary: {
      main: tokens.colors.semantic.primary.main,
      light: tokens.colors.semantic.primary.light,
      dark: tokens.colors.semantic.primary.dark,
      contrast: tokens.colors.semantic.primary.contrast,
    },
    secondary: {
      main: tokens.colors.semantic.secondary.main,
      light: tokens.colors.semantic.secondary.light,
      dark: tokens.colors.semantic.secondary.dark,
      contrast: tokens.colors.semantic.secondary.contrast,
    },
    success: {
      main: tokens.colors.semantic.success.main,
      light: tokens.colors.semantic.success.light,
      dark: tokens.colors.semantic.success.dark,
      contrast: tokens.colors.semantic.success.contrast,
    },
    warning: {
      main: tokens.colors.semantic.warning.main,
      light: tokens.colors.semantic.warning.light,
      dark: tokens.colors.semantic.warning.dark,
      contrast: tokens.colors.semantic.warning.contrast,
    },
    error: {
      main: tokens.colors.semantic.error.main,
      light: tokens.colors.semantic.error.light,
      dark: tokens.colors.semantic.error.dark,
      contrast: tokens.colors.semantic.error.contrast,
    },
    border: {
      default: tokens.colors.primitive.gray[300],
      hover: tokens.colors.primitive.gray[400],
      focus: tokens.colors.primitive.blue[500],
    },
  },
};

// Dark theme configuration
export const darkTheme: ThemeConfig = {
  mode: 'dark',
  colors: {
    background: {
      default: '#121212',
      paper: '#1e1e1e',
      elevated: '#2d2d2d',
    },
    surface: {
      default: '#2d2d2d',
      hover: '#404040',
      selected: '#1a3a5c',
      disabled: '#2d2d2d',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0',
      disabled: '#666666',
    },
    primary: {
      main: '#64b5f6', // Lighter blue for dark theme
      light: '#90caf9',
      dark: '#42a5f5',
      contrast: '#000000',
    },
    secondary: {
      main: '#b0b0b0',
      light: '#d0d0d0',
      dark: '#909090',
      contrast: '#000000',
    },
    success: {
      main: '#81c784', // Lighter green for dark theme
      light: '#a5d6a7',
      dark: '#66bb6a',
      contrast: '#000000',
    },
    warning: {
      main: '#ffb74d', // Lighter amber for dark theme
      light: '#ffcc02',
      dark: '#ff9800',
      contrast: '#000000',
    },
    error: {
      main: '#e57373', // Lighter red for dark theme
      light: '#ef9a9a',
      dark: '#f44336',
      contrast: '#000000',
    },
    border: {
      default: '#404040',
      hover: '#606060',
      focus: '#64b5f6',
    },
  },
};

// Theme configurations map
export const themes = {
  light: lightTheme,
  dark: darkTheme,
} as const;

// CSS custom property mapping
export const getCSSCustomProperties = (theme: ThemeConfig): Record<string, string> => {
  return {
    // Background colors
    '--color-background-default': theme.colors.background.default,
    '--color-background-paper': theme.colors.background.paper,
    '--color-background-elevated': theme.colors.background.elevated,
    
    // Surface colors
    '--color-surface-default': theme.colors.surface.default,
    '--color-surface-hover': theme.colors.surface.hover,
    '--color-surface-selected': theme.colors.surface.selected,
    '--color-surface-disabled': theme.colors.surface.disabled,
    
    // Text colors
    '--color-text-primary': theme.colors.text.primary,
    '--color-text-secondary': theme.colors.text.secondary,
    '--color-text-disabled': theme.colors.text.disabled,
    
    // Primary colors
    '--color-primary-main': theme.colors.primary.main,
    '--color-primary-light': theme.colors.primary.light,
    '--color-primary-dark': theme.colors.primary.dark,
    '--color-primary-contrast': theme.colors.primary.contrast,
    
    // Secondary colors
    '--color-secondary-main': theme.colors.secondary.main,
    '--color-secondary-light': theme.colors.secondary.light,
    '--color-secondary-dark': theme.colors.secondary.dark,
    '--color-secondary-contrast': theme.colors.secondary.contrast,
    
    // Success colors
    '--color-success-main': theme.colors.success.main,
    '--color-success-light': theme.colors.success.light,
    '--color-success-dark': theme.colors.success.dark,
    '--color-success-contrast': theme.colors.success.contrast,
    
    // Warning colors
    '--color-warning-main': theme.colors.warning.main,
    '--color-warning-light': theme.colors.warning.light,
    '--color-warning-dark': theme.colors.warning.dark,
    '--color-warning-contrast': theme.colors.warning.contrast,
    
    // Error colors
    '--color-error-main': theme.colors.error.main,
    '--color-error-light': theme.colors.error.light,
    '--color-error-dark': theme.colors.error.dark,
    '--color-error-contrast': theme.colors.error.contrast,
    
    // Border colors
    '--color-border-default': theme.colors.border.default,
    '--color-border-hover': theme.colors.border.hover,
    '--color-border-focus': theme.colors.border.focus,
  };
};