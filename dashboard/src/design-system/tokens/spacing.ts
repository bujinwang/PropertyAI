// PropertyFlow AI Design Tokens - Spacing
// 8px base grid system for consistent spacing across components

export interface SpacingScale {
  xs: string;    // 4px
  sm: string;    // 8px
  md: string;    // 12px
  lg: string;    // 16px
  xl: string;    // 24px
  '2xl': string; // 32px
  '3xl': string; // 48px
  '4xl': string; // 64px
  '5xl': string; // 96px
}

export interface SpacingTokens extends SpacingScale {
  // Numeric values for calculations
  values: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
    '4xl': number;
    '5xl': number;
  };
  // Component-specific semantic spacing
  component: {
    padding: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
    };
    margin: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
    };
    gap: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
    };
  };
}

export const spacing: SpacingTokens = {
  // String values for CSS
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '0.75rem',   // 12px
  lg: '1rem',      // 16px
  xl: '1.5rem',    // 24px
  '2xl': '2rem',   // 32px
  '3xl': '3rem',   // 48px
  '4xl': '4rem',   // 64px
  '5xl': '6rem',   // 96px

  // Numeric values for calculations
  values: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 32,
    '3xl': 48,
    '4xl': 64,
    '5xl': 96,
  },

  // Component-specific semantic spacing
  component: {
    padding: {
      xs: '0.25rem',  // Input fields, small buttons
      sm: '0.5rem',   // Button padding
      md: '0.75rem',  // Card padding
      lg: '1rem',     // Page padding
    },
    margin: {
      xs: '0.25rem',  // Small element margins
      sm: '0.5rem',   // Element spacing
      md: '0.75rem',  // Section spacing
      lg: '1rem',     // Major section spacing
    },
    gap: {
      xs: '0.25rem',  // Tight element groups
      sm: '0.5rem',   // Form elements
      md: '0.75rem',  // Card elements
      lg: '1rem',     // Layout sections
    },
  },
};

// Utility function to get spacing values
export const getSpacing = (size: keyof SpacingScale): string => spacing[size];

// Utility function to get numeric spacing values for calculations
export const getSpacingValue = (size: keyof SpacingScale): number => spacing.values[size];