/**
 * Accessibility testing utilities for AI Dashboard Components
 * Provides runtime accessibility validation and testing helpers
 */

import { validateFormAccessibility } from './accessibility';

// Color contrast testing
export const testColorContrast = (foreground: string, background: string): {
  ratio: number;
  wcagAA: boolean;
  wcagAAA: boolean;
} => {
  const getLuminance = (color: string): number => {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    // Calculate relative luminance
    const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  };

  const lum1 = getLuminance(foreground);
  const lum2 = getLuminance(background);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  const ratio = (brightest + 0.05) / (darkest + 0.05);

  return {
    ratio,
    wcagAA: ratio >= 4.5,
    wcagAAA: ratio >= 7,
  };
};

// Keyboard navigation testing
export const testKeyboardNavigation = (container: HTMLElement): string[] => {
  const issues: string[] = [];
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  focusableElements.forEach((element, index) => {
    const el = element as HTMLElement;
    
    // Check if element is focusable
    if (el.tabIndex < 0 && !el.hasAttribute('tabindex')) {
      issues.push(`Element ${index} is not keyboard accessible: ${el.tagName}`);
    }

    // Check for focus indicators
    const computedStyle = window.getComputedStyle(el, ':focus');
    if (!computedStyle.outline || computedStyle.outline === 'none') {
      issues.push(`Element ${index} lacks focus indicator: ${el.tagName}`);
    }
  });

  return issues;
};

// ARIA attributes testing
export const testAriaAttributes = (container: HTMLElement): string[] => {
  const issues: string[] = [];
  
  // Check for proper ARIA labels
  const interactiveElements = container.querySelectorAll(
    'button, [role="button"], input, select, textarea, [role="textbox"]'
  );

  interactiveElements.forEach((element, index) => {
    const el = element as HTMLElement;
    const hasLabel = el.getAttribute('aria-label') || 
                    el.getAttribute('aria-labelledby') ||
                    container.querySelector(`label[for="${el.id}"]`);

    if (!hasLabel) {
      issues.push(`Interactive element ${index} missing accessible name: ${el.tagName}`);
    }
  });

  // Check for proper heading hierarchy
  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let lastLevel = 0;
  
  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName.charAt(1));
    if (index === 0 && level !== 1) {
      issues.push('First heading should be h1');
    } else if (level > lastLevel + 1) {
      issues.push(`Heading level skipped: ${heading.tagName} after h${lastLevel}`);
    }
    lastLevel = level;
  });

  // Check for proper list structure
  const listItems = container.querySelectorAll('li');
  listItems.forEach((li, index) => {
    const parent = li.parentElement;
    if (!parent || !['UL', 'OL'].includes(parent.tagName)) {
      issues.push(`List item ${index} not properly nested in ul or ol`);
    }
  });

  return issues;
};

// Screen reader testing simulation
export const testScreenReaderContent = (container: HTMLElement): string[] => {
  const issues: string[] = [];
  
  // Check for images without alt text
  const images = container.querySelectorAll('img');
  images.forEach((img, index) => {
    if (!img.getAttribute('alt') && img.getAttribute('alt') !== '') {
      issues.push(`Image ${index} missing alt text`);
    }
  });

  // Check for decorative images
  const decorativeImages = container.querySelectorAll('img[alt=""], img[role="presentation"]');
  decorativeImages.forEach((img, index) => {
    if (img.getAttribute('alt') === '' && !img.getAttribute('role')) {
      issues.push(`Decorative image ${index} should have role="presentation"`);
    }
  });

  // Check for proper table structure
  const tables = container.querySelectorAll('table');
  tables.forEach((table, index) => {
    const caption = table.querySelector('caption');
    const headers = table.querySelectorAll('th');
    
    if (!caption) {
      issues.push(`Table ${index} missing caption`);
    }
    
    if (headers.length === 0) {
      issues.push(`Table ${index} missing header cells`);
    }
  });

  return issues;
};

// AI-specific accessibility testing
export const testAIComponentAccessibility = (container: HTMLElement): {
  colorContrast: string[];
  keyboard: string[];
  aria: string[];
  screenReader: string[];
  aiSpecific: string[];
} => {
  const aiSpecific: string[] = [];
  
  // Check AI-generated content indicators
  const aiContent = container.querySelectorAll('[data-ai-generated="true"]');
  aiContent.forEach((element, index) => {
    const el = element as HTMLElement;
    if (!el.getAttribute('aria-label')?.includes('AI')) {
      aiSpecific.push(`AI content ${index} missing AI indicator in accessible name`);
    }
  });

  // Check confidence indicators
  const confidenceIndicators = container.querySelectorAll('[role="progressbar"]');
  confidenceIndicators.forEach((element, index) => {
    const el = element as HTMLElement;
    if (!el.getAttribute('aria-valuenow') || !el.getAttribute('aria-label')) {
      aiSpecific.push(`Confidence indicator ${index} missing proper ARIA attributes`);
    }
  });

  // Check feedback mechanisms
  const feedbackButtons = container.querySelectorAll('[aria-label*="feedback"], [aria-label*="helpful"]');
  feedbackButtons.forEach((element, index) => {
    const el = element as HTMLElement;
    if (!el.getAttribute('aria-label')) {
      aiSpecific.push(`Feedback button ${index} missing accessible name`);
    }
  });

  return {
    colorContrast: [], // Would need actual color values to test
    keyboard: testKeyboardNavigation(container),
    aria: testAriaAttributes(container),
    screenReader: testScreenReaderContent(container),
    aiSpecific,
  };
};

// Comprehensive accessibility audit
export const auditAccessibility = (container: HTMLElement): {
  passed: boolean;
  issues: {
    critical: string[];
    warning: string[];
    info: string[];
  };
  score: number;
} => {
  const results = testAIComponentAccessibility(container);
  const allIssues = [
    ...results.keyboard,
    ...results.aria,
    ...results.screenReader,
    ...results.aiSpecific,
  ];

  // Categorize issues
  const critical = allIssues.filter(issue => 
    issue.includes('missing accessible name') ||
    issue.includes('not keyboard accessible') ||
    issue.includes('missing alt text')
  );

  const warning = allIssues.filter(issue => 
    issue.includes('focus indicator') ||
    issue.includes('heading level') ||
    issue.includes('missing caption')
  );

  const info = allIssues.filter(issue => 
    !critical.includes(issue) && !warning.includes(issue)
  );

  // Calculate score (0-100)
  const totalElements = container.querySelectorAll('*').length;
  const issueWeight = critical.length * 3 + warning.length * 2 + info.length * 1;
  const score = Math.max(0, 100 - (issueWeight / totalElements) * 100);

  return {
    passed: critical.length === 0,
    issues: { critical, warning, info },
    score: Math.round(score),
  };
};

// Runtime accessibility monitoring
export class AccessibilityMonitor {
  private observer: MutationObserver | null = null;
  private issues: string[] = [];

  start(container: HTMLElement) {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as HTMLElement;
              const audit = auditAccessibility(element);
              this.issues.push(...audit.issues.critical);
            }
          });
        }
      });
    });

    this.observer.observe(container, {
      childList: true,
      subtree: true,
    });
  }

  stop() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  getIssues(): string[] {
    return [...this.issues];
  }

  clearIssues() {
    this.issues = [];
  }
}

// Export testing utilities for use in tests
export const accessibilityTestUtils = {
  testColorContrast,
  testKeyboardNavigation,
  testAriaAttributes,
  testScreenReaderContent,
  testAIComponentAccessibility,
  auditAccessibility,
  AccessibilityMonitor,
};