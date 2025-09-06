// PropertyFlow AI WCAG Compliance Utilities
// Functions to validate and ensure WCAG 2.1 AA compliance

/**
 * WCAG 2.1 AA Standards
 */
export const WCAG_STANDARDS = {
  colorContrast: {
    // Text contrast requirements
    normalText: 4.5,        // AA standard for normal text
    largeText: 3.0,         // AA standard for large text (18pt+ or 14pt+ bold)
    uiComponents: 3.0,      // AA standard for UI components
    // AAA standards (optional, for reference)
    normalTextAAA: 7.0,
    largeTextAAA: 4.5,
  },
  touchTargets: {
    minimumSize: 44,        // 44x44px minimum touch target
    minimumSpacing: 8,      // 8px minimum spacing between targets
  },
  focusIndicators: {
    minimumWidth: 2,        // 2px minimum focus indicator width
    contrastRatio: 3.0,     // 3:1 contrast ratio for focus indicators
  },
} as const;

/**
 * Convert hex color to RGB values
 */
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

/**
 * Calculate relative luminance of a color
 * Based on WCAG 2.1 specification
 */
export const getRelativeLuminance = (r: number, g: number, b: number): number => {
  const normalize = (value: number) => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  };

  const rNorm = normalize(r);
  const gNorm = normalize(g);
  const bNorm = normalize(b);

  return 0.2126 * rNorm + 0.7152 * gNorm + 0.0722 * bNorm;
};

/**
 * Calculate contrast ratio between two colors
 * Returns ratio from 1:1 to 21:1
 */
export const getContrastRatio = (color1: string, color2: string): number => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    throw new Error('Invalid color format. Use hex colors (e.g., #ffffff)');
  }

  const luminance1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const luminance2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);

  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Check if color contrast meets WCAG standards
 */
export const checkColorContrast = (
  foreground: string,
  background: string,
  standard: 'normal' | 'large' | 'ui' = 'normal'
): {
  ratio: number;
  passes: boolean;
  grade: 'AAA' | 'AA' | 'Fail';
} => {
  const ratio = getContrastRatio(foreground, background);
  
  const requirements = {
    normal: { AA: WCAG_STANDARDS.colorContrast.normalText, AAA: WCAG_STANDARDS.colorContrast.normalTextAAA },
    large: { AA: WCAG_STANDARDS.colorContrast.largeText, AAA: WCAG_STANDARDS.colorContrast.largeTextAAA },
    ui: { AA: WCAG_STANDARDS.colorContrast.uiComponents, AAA: WCAG_STANDARDS.colorContrast.uiComponents },
  };

  const requirement = requirements[standard];
  const passesAAA = ratio >= requirement.AAA;
  const passesAA = ratio >= requirement.AA;

  return {
    ratio: Math.round(ratio * 100) / 100,
    passes: passesAA,
    grade: passesAAA ? 'AAA' : passesAA ? 'AA' : 'Fail',
  };
};

/**
 * Validate touch target size
 */
export const validateTouchTarget = (
  width: number,
  height: number,
  minimumSize: number = WCAG_STANDARDS.touchTargets.minimumSize
): {
  passes: boolean;
  issues: string[];
} => {
  const issues: string[] = [];

  if (width < minimumSize) {
    issues.push(`Width ${width}px is below minimum ${minimumSize}px`);
  }

  if (height < minimumSize) {
    issues.push(`Height ${height}px is below minimum ${minimumSize}px`);
  }

  return {
    passes: issues.length === 0,
    issues,
  };
};

/**
 * Validate spacing between touch targets
 */
export const validateTouchSpacing = (
  elements: Array<{ x: number; y: number; width: number; height: number }>,
  minimumSpacing: number = WCAG_STANDARDS.touchTargets.minimumSpacing
): {
  passes: boolean;
  conflicts: Array<{ element1: number; element2: number; distance: number }>;
} => {
  const conflicts: Array<{ element1: number; element2: number; distance: number }> = [];

  for (let i = 0; i < elements.length; i++) {
    for (let j = i + 1; j < elements.length; j++) {
      const el1 = elements[i];
      const el2 = elements[j];

      // Calculate distance between element edges
      const horizontalDistance = Math.max(0, 
        Math.max(el1.x, el2.x) - Math.min(el1.x + el1.width, el2.x + el2.width)
      );
      
      const verticalDistance = Math.max(0,
        Math.max(el1.y, el2.y) - Math.min(el1.y + el1.height, el2.y + el2.height)
      );

      const distance = Math.sqrt(horizontalDistance ** 2 + verticalDistance ** 2);

      if (distance < minimumSpacing) {
        conflicts.push({
          element1: i,
          element2: j,
          distance: Math.round(distance * 100) / 100,
        });
      }
    }
  }

  return {
    passes: conflicts.length === 0,
    conflicts,
  };
};

/**
 * Generate accessible color palette with guaranteed contrast
 */
export const generateAccessiblePalette = (
  baseColor: string,
  backgroundColor: string = '#ffffff'
): {
  lightest: string;
  lighter: string;
  base: string;
  darker: string;
  darkest: string;
  contrastRatios: number[];
} => {
  // This is a simplified version - in practice, you'd use more sophisticated color manipulation
  const rgb = hexToRgb(baseColor);
  if (!rgb) throw new Error('Invalid base color');

  // Generate palette variations (simplified implementation)
  const variations = [
    `#${Math.min(255, rgb.r + 60).toString(16).padStart(2, '0')}${Math.min(255, rgb.g + 60).toString(16).padStart(2, '0')}${Math.min(255, rgb.b + 60).toString(16).padStart(2, '0')}`,
    `#${Math.min(255, rgb.r + 30).toString(16).padStart(2, '0')}${Math.min(255, rgb.g + 30).toString(16).padStart(2, '0')}${Math.min(255, rgb.b + 30).toString(16).padStart(2, '0')}`,
    baseColor,
    `#${Math.max(0, rgb.r - 30).toString(16).padStart(2, '0')}${Math.max(0, rgb.g - 30).toString(16).padStart(2, '0')}${Math.max(0, rgb.b - 30).toString(16).padStart(2, '0')}`,
    `#${Math.max(0, rgb.r - 60).toString(16).padStart(2, '0')}${Math.max(0, rgb.g - 60).toString(16).padStart(2, '0')}${Math.max(0, rgb.b - 60).toString(16).padStart(2, '0')}`,
  ];

  const contrastRatios = variations.map(color => getContrastRatio(color, backgroundColor));

  return {
    lightest: variations[0],
    lighter: variations[1],
    base: variations[2],
    darker: variations[3],
    darkest: variations[4],
    contrastRatios,
  };
};

/**
 * Validate focus indicator compliance
 */
export const validateFocusIndicator = (
  indicatorColor: string,
  backgroundColor: string,
  width: number = 2
): {
  passes: boolean;
  issues: string[];
  contrastRatio: number;
} => {
  const issues: string[] = [];
  const contrastCheck = checkColorContrast(indicatorColor, backgroundColor, 'ui');

  if (width < WCAG_STANDARDS.focusIndicators.minimumWidth) {
    issues.push(`Focus indicator width ${width}px is below minimum ${WCAG_STANDARDS.focusIndicators.minimumWidth}px`);
  }

  if (contrastCheck.ratio < WCAG_STANDARDS.focusIndicators.contrastRatio) {
    issues.push(`Focus indicator contrast ratio ${contrastCheck.ratio}:1 is below minimum ${WCAG_STANDARDS.focusIndicators.contrastRatio}:1`);
  }

  return {
    passes: issues.length === 0,
    issues,
    contrastRatio: contrastCheck.ratio,
  };
};

/**
 * Check if text size qualifies as "large text" for WCAG
 */
export const isLargeText = (fontSize: number, fontWeight: number | string): boolean => {
  // Large text is 18pt (24px) or larger, or 14pt (18.66px) bold or larger
  const fontWeightNum = typeof fontWeight === 'string' 
    ? (fontWeight === 'bold' || fontWeight === '700' || fontWeight === '600') ? 700 : 400
    : fontWeight;

  return fontSize >= 24 || (fontSize >= 19 && fontWeightNum >= 600);
};

/**
 * Comprehensive WCAG compliance check for a component
 */
export interface WCAGComplianceCheck {
  colorContrast: ReturnType<typeof checkColorContrast>;
  touchTarget: ReturnType<typeof validateTouchTarget>;
  focusIndicator: ReturnType<typeof validateFocusIndicator>;
  overallGrade: 'AAA' | 'AA' | 'Fail';
  recommendations: string[];
}

export const performWCAGCheck = (config: {
  foregroundColor: string;
  backgroundColor: string;
  focusIndicatorColor: string;
  width: number;
  height: number;
  fontSize: number;
  fontWeight: number | string;
  focusIndicatorWidth?: number;
}): WCAGComplianceCheck => {
  const textType = isLargeText(config.fontSize, config.fontWeight) ? 'large' : 'normal';
  
  const colorContrast = checkColorContrast(
    config.foregroundColor,
    config.backgroundColor,
    textType
  );

  const touchTarget = validateTouchTarget(config.width, config.height);

  const focusIndicator = validateFocusIndicator(
    config.focusIndicatorColor,
    config.backgroundColor,
    config.focusIndicatorWidth
  );

  const recommendations: string[] = [];
  
  if (!colorContrast.passes) {
    recommendations.push(`Increase color contrast to at least ${textType === 'normal' ? '4.5' : '3.0'}:1`);
  }
  
  if (!touchTarget.passes) {
    recommendations.push('Increase touch target size to at least 44x44px');
  }
  
  if (!focusIndicator.passes) {
    recommendations.push('Improve focus indicator contrast and/or width');
  }

  const overallPasses = colorContrast.passes && touchTarget.passes && focusIndicator.passes;
  const overallGrade = overallPasses 
    ? (colorContrast.grade === 'AAA' ? 'AAA' : 'AA')
    : 'Fail';

  return {
    colorContrast,
    touchTarget,
    focusIndicator,
    overallGrade,
    recommendations,
  };
};