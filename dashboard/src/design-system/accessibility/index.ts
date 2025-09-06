// PropertyFlow AI Accessibility Foundation - Main Export
// Central access point for all accessibility utilities, components, and hooks

// Hooks
export * from './hooks';

// Components
export * from './components';

// Providers
export { AnnouncementProvider, useAnnouncements } from './providers/AnnouncementProvider';

// WCAG Utilities
export * from './utils/wcag';

// Testing Utilities
export * from './utils/testing';

// Re-export commonly used items with convenient names
export {
  // Essential hooks
  useAnnouncement,
  useFocusManagement,
  useKeyboardNavigation,
  useColorContrast,
  useReducedMotion,
  useAriaExpanded,
  useDisclosure,
  useRovingTabIndex,
} from './hooks';

export {
  // Essential components
  VisuallyHidden,
  SkipLink,
  FocusableContainer,
  Landmark,
  LiveRegion,
  ErrorMessage,
  StatusMessage,
  RequiredIndicator,
} from './components';

export {
  // Essential utilities
  checkColorContrast,
  validateTouchTarget,
  validateFocusIndicator,
  performWCAGCheck,
  WCAG_STANDARDS,
} from './utils/wcag';

export {
  // Testing utilities
  auditAccessibility,
  testColorContrasts,
  testFocusManagement,
  testSemanticMarkup,
  testKeyboardNavigation,
  generateAccessibilityReport,
} from './utils/testing';

// Type exports
export type {
  UseAnnouncementOptions,
  UseFocusManagementOptions,
  UseKeyboardNavigationOptions,
  WCAGComplianceCheck,
  AccessibilityTestResult,
  AccessibilityIssue,
  AccessibilityWarning,
} from './hooks';

export type {
  VisuallyHiddenProps,
  SkipLinkProps,
  FocusableContainerProps,
  LandmarkProps,
  LiveRegionProps,
  ErrorMessageProps,
  StatusMessageProps,
  RequiredIndicatorProps,
} from './components';

// Constants for easy reference
export const ACCESSIBILITY_CONSTANTS = {
  // Minimum touch target size (WCAG 2.1 AA)
  MIN_TOUCH_TARGET_SIZE: 44,
  
  // Minimum color contrast ratios
  MIN_CONTRAST_NORMAL_TEXT: 4.5,
  MIN_CONTRAST_LARGE_TEXT: 3.0,
  MIN_CONTRAST_UI_COMPONENTS: 3.0,
  
  // Focus indicator requirements
  MIN_FOCUS_INDICATOR_WIDTH: 2,
  MIN_FOCUS_INDICATOR_CONTRAST: 3.0,
  
  // Timing requirements (in milliseconds)
  MAX_ANIMATION_DURATION: 5000,
  DEFAULT_TIMEOUT: 20000,
  
  // Common ARIA roles
  LANDMARK_ROLES: ['banner', 'navigation', 'main', 'complementary', 'contentinfo', 'region'] as const,
  INTERACTIVE_ROLES: ['button', 'link', 'menuitem', 'tab', 'option'] as const,
  
  // Keyboard keys
  NAVIGATION_KEYS: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'] as const,
  ACTION_KEYS: ['Enter', 'Space'] as const,
  ESCAPE_KEYS: ['Escape'] as const,
} as const;

// Utility function for quick accessibility checks
export const quickAccessibilityCheck = (element: HTMLElement): boolean => {
  try {
    // Basic checks that can be done synchronously
    const hasAccessibleName = element.hasAttribute('aria-label') || 
      element.hasAttribute('aria-labelledby') ||
      element.textContent?.trim() ||
      element.hasAttribute('title');

    const isFocusable = element.tabIndex >= 0 || 
      ['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA', 'A'].includes(element.tagName) ||
      element.hasAttribute('href');

    const hasRole = element.hasAttribute('role') || 
      ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA', 'NAV', 'MAIN', 'HEADER', 'FOOTER'].includes(element.tagName);

    return hasAccessibleName && (isFocusable || hasRole);
  } catch (error) {
    console.warn('Quick accessibility check failed:', error);
    return false;
  }
};