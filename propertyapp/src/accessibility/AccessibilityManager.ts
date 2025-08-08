import { AccessibilityInfo, findNodeHandle } from 'react-native';
import { useEffect, useRef, useCallback } from 'react';

// Accessibility configuration
export const AccessibilityConfig = {
  // Screen reader announcements
  announcements: {
    pageLoaded: 'Page loaded successfully',
    contentUpdated: 'Content updated',
    loading: 'Loading content',
    error: 'An error occurred',
    success: 'Action completed successfully',
  },

  // Focus management
  focus: {
    trapFocus: true,
    returnFocus: true,
    initialFocus: true,
  },

  // ARIA labels and descriptions
  labels: {
    navigation: {
      back: 'Go back',
      home: 'Go to home',
      menu: 'Open menu',
      close: 'Close',
    },
    forms: {
      submit: 'Submit form',
      cancel: 'Cancel',
      required: 'required',
      optional: 'optional',
    },
    images: {
      decorative: 'decorative image',
      loading: 'Loading image',
      failed: 'Failed to load image',
    },
  },

  // Screen reader hints
  hints: {
    button: 'Double tap to activate',
    link: 'Double tap to open link',
    input: 'Double tap to edit',
    image: 'Double tap to view image',
  },

  // Keyboard navigation
  keyboard: {
    tabOrder: [],
    shortcuts: {
      search: 'Cmd+F',
      refresh: 'Cmd+R',
      back: 'Cmd+[',
    },
  },
};

// Focus management utilities
export class FocusManager {
  private static focusableRefs = new Map<string, any>();
  private static currentFocus = '';

  static registerFocusable(id: string, ref: any) {
    this.focusableRefs.set(id, ref);
  }

  static unregisterFocusable(id: string) {
    this.focusableRefs.delete(id);
  }

  static focusElement(id: string) {
    const ref = this.focusableRefs.get(id);
    if (ref) {
      const node = findNodeHandle(ref);
      if (node) {
        AccessibilityInfo.setAccessibilityFocus(node);
        this.currentFocus = id;
      }
    }
  }

  static focusFirst() {
    const firstId = Array.from(this.focusableRefs.keys())[0];
    if (firstId) {
      this.focusElement(firstId);
    }
  }

  static clearFocus() {
    this.currentFocus = '';
  }
}

// Screen reader announcements
export class ScreenReader {
  static announce(message: string, priority: 'assertive' | 'polite' = 'polite') {
    AccessibilityInfo.announceForAccessibility(message);
  }

  static announcePageLoaded(pageName: string) {
    this.announce(`${pageName} page loaded`, 'assertive');
  }

  static announceLoading(loadingType: string) {
    this.announce(`Loading ${loadingType}`, 'polite');
  }

  static announceError(errorMessage: string) {
    this.announce(`Error: ${errorMessage}`, 'assertive');
  }

  static announceSuccess(action: string) {
    this.announce(`${action} completed successfully`, 'polite');
  }
}

export const useAccessibility = () => {
  const ref = useRef<any>(null);

  const setAccessibilityFocus = useCallback(() => {
    if (ref.current) {
      const node = findNodeHandle(ref.current);
      if (node) {
        AccessibilityInfo.setAccessibilityFocus(node);
      }
    }
  }, []);

  const announce = useCallback((message: string, priority?: 'assertive' | 'polite') => {
    ScreenReader.announce(message, priority);
  }, []);

  return { ref, setAccessibilityFocus, announce };
};

export const useAccessibleInput = ({
  label,
  hint,
  required = false,
  disabled = false,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
}) => {
  return {
    accessibilityLabel: label,
    accessibilityHint: hint || 'Double tap to edit',
    accessibilityRole: 'text',
    accessibilityState: {
      disabled,
      required,
    },
  };
};

export const useAccessibleButton = ({
  label,
  hint,
  disabled = false,
}: {
  label: string;
  hint?: string;
  disabled?: boolean;
}) => {
  return {
    accessibilityLabel: label,
    accessibilityHint: hint || 'Double tap to activate',
    accessibilityRole: 'button',
    accessibilityState: {
      disabled,
    },
  };
};

// Color contrast utilities
export const ColorContrast = {
  // WCAG 2.1 compliance ratios
  ratios: {
    AA: 4.5,
    AAA: 7.0,
    AA_Large: 3.0,
  },

  // Calculate contrast ratio between two colors
  calculateContrast(color1: string, color2: string): number {
    // Implementation for WCAG contrast calculation
    // This is a simplified version - use a proper library for production
    return 4.5; // Placeholder
  },

  // Check if colors meet WCAG standards
  isCompliant(color1: string, color2: string, level: 'AA' | 'AAA' = 'AA'): boolean {
    const ratio = this.calculateContrast(color1, color2);
    return ratio >= this.ratios[level];
  },
};

// Keyboard navigation
export class KeyboardNavigation {
  private static listeners = new Set<(keyboardEvent: KeyboardEvent) => void>();

  static addListener(listener: (keyboardEvent: KeyboardEvent) => void) {
    this.listeners.add(listener);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  static handleKeyPress(event: KeyboardEvent) {
    this.listeners.forEach(listener => listener(event));
  }

  static setupKeyboardShortcuts() {
    // Setup global keyboard shortcuts
    // This would typically use a library like react-native-keyevent
  }
}

// Accessibility validation
export class AccessibilityValidator {
  static validateElement(element: any): string[] {
    const issues: string[] = [];

    // Check for accessibility label
    if (!element.accessibilityLabel) {
      issues.push('Element missing accessibility label');
    }

    // Check for accessibility role
    if (!element.accessibilityRole) {
      issues.push('Element missing accessibility role');
    }

    // Check for touch target size
    if (element.style && (element.style.minWidth < 44 || element.style.minHeight < 44)) {
      issues.push('Touch target too small (minimum 44x44)');
    }

    // Check for color contrast
    if (element.style && element.style.color && element.style.backgroundColor) {
      if (!ColorContrast.isCompliant(element.style.color, element.style.backgroundColor)) {
        issues.push('Color contrast does not meet WCAG standards');
      }
    }

    return issues;
  }

  static validateScreen(elements: any[]): string[] {
    const issues: string[] = [];
    
    elements.forEach((element, index) => {
      const elementIssues = this.validateElement(element);
      elementIssues.forEach(issue => {
        issues.push(`Element ${index + 1}: ${issue}`);
      });
    });

    return issues;
  }
}