// PropertyFlow AI Accessibility Testing Utilities
// Functions to test and validate accessibility compliance

import { performWCAGCheck, WCAGComplianceCheck, checkColorContrast } from './wcag';

/**
 * Test results interface
 */
export interface AccessibilityTestResult {
  passed: boolean;
  issues: AccessibilityIssue[];
  warnings: AccessibilityWarning[];
  score: number; // 0-100 accessibility score
}

export interface AccessibilityIssue {
  type: 'error';
  category: 'color-contrast' | 'focus-management' | 'semantic-markup' | 'keyboard-navigation' | 'screen-reader';
  message: string;
  element?: string;
  wcagReference?: string;
}

export interface AccessibilityWarning {
  type: 'warning';
  category: 'color-contrast' | 'focus-management' | 'semantic-markup' | 'keyboard-navigation' | 'screen-reader';
  message: string;
  element?: string;
  recommendation?: string;
}

/**
 * Test color contrast for multiple color combinations
 */
export const testColorContrasts = (
  combinations: Array<{
    foreground: string;
    background: string;
    context: string;
    isLarge?: boolean;
  }>
): AccessibilityTestResult => {
  const issues: AccessibilityIssue[] = [];
  const warnings: AccessibilityWarning[] = [];
  let passedTests = 0;

  combinations.forEach(({ foreground, background, context, isLarge = false }) => {
    try {
      const result = checkColorContrast(foreground, background, isLarge ? 'large' : 'normal');
      
      if (!result.passes) {
        issues.push({
          type: 'error',
          category: 'color-contrast',
          message: `Insufficient color contrast (${result.ratio}:1) for ${context}`,
          wcagReference: 'WCAG 2.1 SC 1.4.3',
        });
      } else {
        passedTests++;
        
        if (result.grade === 'AA' && !isLarge) {
          warnings.push({
            type: 'warning',
            category: 'color-contrast',
            message: `Color contrast for ${context} meets AA but not AAA standards`,
            recommendation: 'Consider improving contrast for better accessibility',
          });
        }
      }
    } catch (error) {
      issues.push({
        type: 'error',
        category: 'color-contrast',
        message: `Failed to test color contrast for ${context}: ${error}`,
      });
    }
  });

  return {
    passed: issues.length === 0,
    issues,
    warnings,
    score: Math.round((passedTests / combinations.length) * 100),
  };
};

/**
 * Test focus management for an element
 */
export const testFocusManagement = (element: HTMLElement): AccessibilityTestResult => {
  const issues: AccessibilityIssue[] = [];
  const warnings: AccessibilityWarning[] = [];

  // Check if element is focusable
  const isFocusable = element.tabIndex >= 0 || 
    ['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA', 'A'].includes(element.tagName) ||
    element.hasAttribute('href');

  if (!isFocusable && !element.hasAttribute('aria-hidden')) {
    warnings.push({
      type: 'warning',
      category: 'focus-management',
      message: 'Interactive element may not be focusable',
      element: element.tagName.toLowerCase(),
      recommendation: 'Add tabindex="0" or use semantic interactive elements',
    });
  }

  // Check focus indicator
  const computedStyle = window.getComputedStyle(element, ':focus');
  const hasCustomFocusStyle = 
    computedStyle.outline !== 'none' || 
    computedStyle.boxShadow !== 'none' ||
    computedStyle.border !== computedStyle.border; // Changed on focus

  if (!hasCustomFocusStyle) {
    issues.push({
      type: 'error',
      category: 'focus-management',
      message: 'Element lacks visible focus indicator',
      element: element.tagName.toLowerCase(),
      wcagReference: 'WCAG 2.1 SC 2.4.7',
    });
  }

  return {
    passed: issues.length === 0,
    issues,
    warnings,
    score: issues.length === 0 ? 100 : warnings.length === 0 ? 50 : 0,
  };
};

/**
 * Test semantic markup for accessibility
 */
export const testSemanticMarkup = (element: HTMLElement): AccessibilityTestResult => {
  const issues: AccessibilityIssue[] = [];
  const warnings: AccessibilityWarning[] = [];

  // Check for proper heading hierarchy
  if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(element.tagName)) {
    const headingLevel = parseInt(element.tagName.substring(1));
    const previousHeadings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
      .filter(h => h.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_PRECEDING);
    
    if (previousHeadings.length > 0) {
      const lastHeading = previousHeadings[previousHeadings.length - 1];
      const lastLevel = parseInt(lastHeading.tagName.substring(1));
      
      if (headingLevel > lastLevel + 1) {
        issues.push({
          type: 'error',
          category: 'semantic-markup',
          message: `Heading level skipped from h${lastLevel} to h${headingLevel}`,
          element: element.tagName.toLowerCase(),
          wcagReference: 'WCAG 2.1 SC 1.3.1',
        });
      }
    }
  }

  // Check for proper labeling
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName)) {
    const hasLabel = element.hasAttribute('aria-label') || 
      element.hasAttribute('aria-labelledby') ||
      document.querySelector(`label[for="${element.id}"]`);

    if (!hasLabel) {
      issues.push({
        type: 'error',
        category: 'semantic-markup',
        message: 'Form element lacks accessible label',
        element: element.tagName.toLowerCase(),
        wcagReference: 'WCAG 2.1 SC 1.3.1',
      });
    }
  }

  // Check for proper button semantics
  if (element.tagName === 'DIV' && element.onclick && !element.hasAttribute('role')) {
    warnings.push({
      type: 'warning',
      category: 'semantic-markup',
      message: 'Interactive div should use button role or semantic button element',
      element: 'div',
      recommendation: 'Use <button> element or add role="button"',
    });
  }

  return {
    passed: issues.length === 0,
    issues,
    warnings,
    score: issues.length === 0 ? 100 : Math.max(0, 100 - (issues.length * 25)),
  };
};

/**
 * Test keyboard navigation support
 */
export const testKeyboardNavigation = async (element: HTMLElement): Promise<AccessibilityTestResult> => {
  const issues: AccessibilityIssue[] = [];
  const warnings: AccessibilityWarning[] = [];

  return new Promise((resolve) => {
    // Focus the element
    element.focus();

    if (document.activeElement !== element) {
      issues.push({
        type: 'error',
        category: 'keyboard-navigation',
        message: 'Element cannot receive keyboard focus',
        element: element.tagName.toLowerCase(),
        wcagReference: 'WCAG 2.1 SC 2.1.1',
      });
    }

    // Test common keyboard interactions
    const testKeyEvents = ['Enter', 'Space', 'ArrowUp', 'ArrowDown', 'Escape'];
    let handledEvents = 0;

    const handleKeyDown = (event: KeyboardEvent) => {
      handledEvents++;
    };

    element.addEventListener('keydown', handleKeyDown);

    // Simulate key events (in a real test environment)
    testKeyEvents.forEach(key => {
      const event = new KeyboardEvent('keydown', { key });
      element.dispatchEvent(event);
    });

    setTimeout(() => {
      element.removeEventListener('keydown', handleKeyDown);

      if (handledEvents === 0 && ['BUTTON', 'A', 'INPUT'].includes(element.tagName)) {
        warnings.push({
          type: 'warning',
          category: 'keyboard-navigation',
          message: 'Interactive element may not handle keyboard events',
          element: element.tagName.toLowerCase(),
          recommendation: 'Add keyboard event handlers for Enter and Space keys',
        });
      }

      resolve({
        passed: issues.length === 0,
        issues,
        warnings,
        score: issues.length === 0 ? 100 : 50,
      });
    }, 100);
  });
};

/**
 * Comprehensive accessibility audit for a component
 */
export const auditAccessibility = async (
  rootElement: HTMLElement,
  options: {
    checkColorContrast?: boolean;
    checkFocusManagement?: boolean;
    checkSemanticMarkup?: boolean;
    checkKeyboardNavigation?: boolean;
  } = {}
): Promise<AccessibilityTestResult> => {
  const {
    checkColorContrast = true,
    checkFocusManagement = true,
    checkSemanticMarkup = true,
    checkKeyboardNavigation = true,
  } = options;

  const allIssues: AccessibilityIssue[] = [];
  const allWarnings: AccessibilityWarning[] = [];
  const testScores: number[] = [];

  // Test all interactive elements
  const interactiveElements = rootElement.querySelectorAll(
    'button, input, select, textarea, a, [tabindex], [role="button"], [role="link"]'
  );

  for (const element of Array.from(interactiveElements) as HTMLElement[]) {
    if (checkFocusManagement) {
      const focusResult = testFocusManagement(element);
      allIssues.push(...focusResult.issues);
      allWarnings.push(...focusResult.warnings);
      testScores.push(focusResult.score);
    }

    if (checkSemanticMarkup) {
      const semanticResult = testSemanticMarkup(element);
      allIssues.push(...semanticResult.issues);
      allWarnings.push(...semanticResult.warnings);
      testScores.push(semanticResult.score);
    }

    if (checkKeyboardNavigation) {
      const keyboardResult = await testKeyboardNavigation(element);
      allIssues.push(...keyboardResult.issues);
      allWarnings.push(...keyboardResult.warnings);
      testScores.push(keyboardResult.score);
    }
  }

  // Calculate overall score
  const averageScore = testScores.length > 0 
    ? Math.round(testScores.reduce((sum, score) => sum + score, 0) / testScores.length)
    : 100;

  return {
    passed: allIssues.length === 0,
    issues: allIssues,
    warnings: allWarnings,
    score: averageScore,
  };
};

/**
 * Generate accessibility report
 */
export const generateAccessibilityReport = (results: AccessibilityTestResult): string => {
  const { passed, issues, warnings, score } = results;

  let report = `Accessibility Audit Report\n`;
  report += `==========================\n\n`;
  report += `Overall Score: ${score}/100\n`;
  report += `Status: ${passed ? 'PASSED' : 'FAILED'}\n\n`;

  if (issues.length > 0) {
    report += `Issues Found (${issues.length}):\n`;
    report += `-----------------\n`;
    issues.forEach((issue, index) => {
      report += `${index + 1}. [${issue.category.toUpperCase()}] ${issue.message}\n`;
      if (issue.element) report += `   Element: ${issue.element}\n`;
      if (issue.wcagReference) report += `   WCAG: ${issue.wcagReference}\n`;
      report += '\n';
    });
  }

  if (warnings.length > 0) {
    report += `Warnings (${warnings.length}):\n`;
    report += `----------\n`;
    warnings.forEach((warning, index) => {
      report += `${index + 1}. [${warning.category.toUpperCase()}] ${warning.message}\n`;
      if (warning.element) report += `   Element: ${warning.element}\n`;
      if (warning.recommendation) report += `   Recommendation: ${warning.recommendation}\n`;
      report += '\n';
    });
  }

  if (passed) {
    report += `✅ All accessibility tests passed!\n`;
  } else {
    report += `❌ Accessibility issues found. Please address the issues above.\n`;
  }

  return report;
};