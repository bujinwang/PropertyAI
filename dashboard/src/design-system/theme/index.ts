// PropertyFlow AI Theme System - Main Export
// Central access point for all theme-related functionality

export * from './ThemeContext';
export * from './ThemeProvider';
export * from './themeConfig';
export * from './useTheme';

// Re-export the theme context hook with a simpler name
export { useThemeContext as usePropertyFlowTheme } from './ThemeContext';

// Default export for the main theme provider
export { default as PropertyFlowThemeProvider } from './ThemeProvider';