// PropertyFlow AI Design Tokens - Main Export
// Central access point for all design tokens

export * from './colors';
export * from './spacing';
export * from './typography';

import { primitiveColors, semanticColors, type PrimitiveColors, type SemanticColors } from './colors';
import { spacing, getSpacing, getSpacingValue, type SpacingTokens, type SpacingScale } from './spacing';
import { typography, type TypographyTokens, type FontWeights, type FontSizes, type LineHeights } from './typography';

// Additional token categories
export interface BorderRadiusTokens {
  none: string;
  sm: string;
  base: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

export interface ShadowTokens {
  none: string;
  sm: string;
  base: string;
  md: string;
  lg: string;
  xl: string;
  inner: string;
}

export interface BreakpointTokens {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export interface ZIndexTokens {
  hide: number;
  base: number;
  docked: number;
  dropdown: number;
  sticky: number;
  banner: number;
  overlay: number;
  modal: number;
  popover: number;
  tooltip: number;
}

// Border radius scale
export const borderRadius: BorderRadiusTokens = {
  none: '0',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  full: '9999px',   // Full rounded
};

// Shadow system
export const shadows: ShadowTokens = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
};

// Breakpoint system
export const breakpoints: BreakpointTokens = {
  xs: '475px',   // Small phones
  sm: '640px',   // Large phones
  md: '768px',   // Tablets
  lg: '1024px',  // Small laptops
  xl: '1280px',  // Large laptops
  '2xl': '1536px', // Desktop
};

// Z-index scale
export const zIndex: ZIndexTokens = {
  hide: -1,
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  tooltip: 1600,
};

// Complete design token system
export interface DesignTokens {
  colors: {
    primitive: PrimitiveColors;
    semantic: SemanticColors;
  };
  spacing: SpacingTokens;
  typography: TypographyTokens;
  borderRadius: BorderRadiusTokens;
  shadows: ShadowTokens;
  breakpoints: BreakpointTokens;
  zIndex: ZIndexTokens;
}

export const tokens: DesignTokens = {
  colors: {
    primitive: primitiveColors,
    semantic: semanticColors,
  },
  spacing,
  typography,
  borderRadius,
  shadows,
  breakpoints,
  zIndex,
};

// Utility functions
export { getSpacing, getSpacingValue };

export const getBreakpoint = (size: keyof BreakpointTokens): string => breakpoints[size];
export const getShadow = (size: keyof ShadowTokens): string => shadows[size];
export const getBorderRadius = (size: keyof BorderRadiusTokens): string => borderRadius[size];