// PropertyFlow AI Design Tokens - Typography
// Consistent typography scale and weights for all text elements

export interface FontWeights {
  light: number;
  regular: number;
  medium: number;
  semibold: number;
  bold: number;
}

export interface FontSizes {
  xs: string;     // 12px
  sm: string;     // 14px
  base: string;   // 16px
  lg: string;     // 18px
  xl: string;     // 20px
  '2xl': string;  // 24px
  '3xl': string;  // 30px
  '4xl': string;  // 36px
  '5xl': string;  // 48px
  '6xl': string;  // 60px
}

export interface LineHeights {
  tight: number;    // 1.25
  snug: number;     // 1.375
  normal: number;   // 1.5
  relaxed: number;  // 1.625
  loose: number;    // 2
}

export interface TypographyTokens {
  fontFamily: {
    sans: string;
    mono: string;
  };
  fontWeight: FontWeights;
  fontSize: FontSizes;
  lineHeight: LineHeights;
  // Semantic typography styles
  display: {
    fontSize: string;
    fontWeight: number;
    lineHeight: number;
    letterSpacing: string;
  };
  heading: {
    h1: {
      fontSize: string;
      fontWeight: number;
      lineHeight: number;
      letterSpacing: string;
    };
    h2: {
      fontSize: string;
      fontWeight: number;
      lineHeight: number;
      letterSpacing: string;
    };
    h3: {
      fontSize: string;
      fontWeight: number;
      lineHeight: number;
      letterSpacing: string;
    };
    h4: {
      fontSize: string;
      fontWeight: number;
      lineHeight: number;
      letterSpacing: string;
    };
    h5: {
      fontSize: string;
      fontWeight: number;
      lineHeight: number;
      letterSpacing: string;
    };
    h6: {
      fontSize: string;
      fontWeight: number;
      lineHeight: number;
      letterSpacing: string;
    };
  };
  body: {
    large: {
      fontSize: string;
      fontWeight: number;
      lineHeight: number;
    };
    medium: {
      fontSize: string;
      fontWeight: number;
      lineHeight: number;
    };
    small: {
      fontSize: string;
      fontWeight: number;
      lineHeight: number;
    };
  };
  caption: {
    fontSize: string;
    fontWeight: number;
    lineHeight: number;
  };
  overline: {
    fontSize: string;
    fontWeight: number;
    lineHeight: number;
    letterSpacing: string;
    textTransform: string;
  };
}

export const typography: TypographyTokens = {
  fontFamily: {
    sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Open Sans", "Helvetica Neue", sans-serif',
    mono: '"JetBrains Mono", "SF Mono", "Monaco", "Inconsolata", "Fira Code", "Droid Sans Mono", "Source Code Pro", monospace',
  },

  fontWeight: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  fontSize: {
    xs: '0.75rem',   // 12px
    sm: '0.875rem',  // 14px
    base: '1rem',    // 16px
    lg: '1.125rem',  // 18px
    xl: '1.25rem',   // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
    '6xl': '3.75rem',  // 60px
  },

  lineHeight: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  // Semantic typography styles
  display: {
    fontSize: '3.75rem', // 60px
    fontWeight: 700,
    lineHeight: 1.25,
    letterSpacing: '-0.025em',
  },

  heading: {
    h1: {
      fontSize: '2.25rem', // 36px
      fontWeight: 600,
      lineHeight: 1.25,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontSize: '1.875rem', // 30px
      fontWeight: 600,
      lineHeight: 1.25,
      letterSpacing: '-0.025em',
    },
    h3: {
      fontSize: '1.5rem', // 24px
      fontWeight: 600,
      lineHeight: 1.375,
      letterSpacing: '0',
    },
    h4: {
      fontSize: '1.25rem', // 20px
      fontWeight: 600,
      lineHeight: 1.375,
      letterSpacing: '0',
    },
    h5: {
      fontSize: '1.125rem', // 18px
      fontWeight: 500,
      lineHeight: 1.375,
      letterSpacing: '0',
    },
    h6: {
      fontSize: '1rem', // 16px
      fontWeight: 500,
      lineHeight: 1.5,
      letterSpacing: '0',
    },
  },

  body: {
    large: {
      fontSize: '1.125rem', // 18px
      fontWeight: 400,
      lineHeight: 1.625,
    },
    medium: {
      fontSize: '1rem', // 16px
      fontWeight: 400,
      lineHeight: 1.5,
    },
    small: {
      fontSize: '0.875rem', // 14px
      fontWeight: 400,
      lineHeight: 1.5,
    },
  },

  caption: {
    fontSize: '0.75rem', // 12px
    fontWeight: 400,
    lineHeight: 1.5,
  },

  overline: {
    fontSize: '0.75rem', // 12px
    fontWeight: 500,
    lineHeight: 1.5,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
};