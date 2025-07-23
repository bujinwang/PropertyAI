/**
 * Accessibility utilities for AI Dashboard Components
 * Provides WCAG 2.1 AA compliant accessibility features
 */

import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';

// ARIA live region announcements
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.style.position = 'absolute';
  announcement.style.left = '-10000px';
  announcement.style.width = '1px';
  announcement.style.height = '1px';
  announcement.style.overflow = 'hidden';
  
  document.body.appendChild(announcement);
  announcement.textContent = message;
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

// Hook for managing focus
export const useFocusManagement = () => {
  const focusRef = useRef<HTMLElement | null>(null);
  
  const setFocus = useCallback((element: HTMLElement | null) => {
    if (element) {
      focusRef.current = element;
      element.focus();
    }
  }, []);
  
  const restoreFocus = useCallback(() => {
    if (focusRef.current) {
      focusRef.current.focus();
    }
  }, []);
  
  return { setFocus, restoreFocus };
};

// Hook for keyboard navigation
export const useKeyboardNavigation = (
  onEnter?: () => void,
  onEscape?: () => void,
  onArrowUp?: () => void,
  onArrowDown?: () => void,
  onArrowLeft?: () => void,
  onArrowRight?: () => void
) => {
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        onEnter?.();
        break;
      case 'Escape':
        event.preventDefault();
        onEscape?.();
        break;
      case 'ArrowUp':
        event.preventDefault();
        onArrowUp?.();
        break;
      case 'ArrowDown':
        event.preventDefault();
        onArrowDown?.();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        onArrowLeft?.();
        break;
      case 'ArrowRight':
        event.preventDefault();
        onArrowRight?.();
        break;
    }
  }, [onEnter, onEscape, onArrowUp, onArrowDown, onArrowLeft, onArrowRight]);
  
  return { handleKeyDown };
};

// Color contrast utilities
export const getContrastRatio = (color1: string, color2: string): number => {
  const getLuminance = (color: string): number => {
    const rgb = color.match(/\d+/g);
    if (!rgb) return 0;
    
    const [r, g, b] = rgb.map(c => {
      const val = parseInt(c) / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
};

export const meetsWCAGContrast = (color1: string, color2: string, level: 'AA' | 'AAA' = 'AA'): boolean => {
  const ratio = getContrastRatio(color1, color2);
  return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
};

// ARIA attributes for AI content
export const getAIContentAriaAttributes = (confidence?: number, isAIGenerated: boolean = true) => {
  const attributes: Record<string, string> = {};
  
  if (isAIGenerated) {
    attributes['aria-label'] = `AI generated content${confidence ? ` with ${Math.round(confidence)}% confidence` : ''}`;
    attributes['data-ai-generated'] = 'true';
  }
  
  if (confidence !== undefined) {
    attributes['aria-describedby'] = 'confidence-description';
    attributes['data-confidence'] = confidence.toString();
  }
  
  return attributes;
};

// Screen reader optimized descriptions
export const getConfidenceDescription = (confidence: number): string => {
  if (confidence >= 90) return 'Very high confidence';
  if (confidence >= 80) return 'High confidence';
  if (confidence >= 70) return 'Good confidence';
  if (confidence >= 60) return 'Moderate confidence';
  if (confidence >= 50) return 'Low confidence';
  return 'Very low confidence';
};

export const getFeedbackAriaLabel = (type: 'positive' | 'negative', hasComment: boolean = false): string => {
  const baseLabel = type === 'positive' ? 'Mark as helpful' : 'Mark as not helpful';
  return hasComment ? `${baseLabel} with additional comment` : baseLabel;
};

// Hook for managing live regions
export const useLiveRegion = () => {
  const liveRegionRef = useRef<HTMLDivElement | null>(null);
  
  useEffect(() => {
    // Create live region if it doesn't exist
    if (!liveRegionRef.current) {
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      liveRegion.style.position = 'absolute';
      liveRegion.style.left = '-10000px';
      liveRegion.style.width = '1px';
      liveRegion.style.height = '1px';
      liveRegion.style.overflow = 'hidden';
      
      document.body.appendChild(liveRegion);
      liveRegionRef.current = liveRegion;
    }
    
    return () => {
      if (liveRegionRef.current && document.body.contains(liveRegionRef.current)) {
        document.body.removeChild(liveRegionRef.current);
      }
    };
  }, []);
  
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (liveRegionRef.current) {
      liveRegionRef.current.setAttribute('aria-live', priority);
      liveRegionRef.current.textContent = message;
    }
  }, []);
  
  return { announce };
};

// Validation for form accessibility
export const validateFormAccessibility = (formElement: HTMLFormElement): string[] => {
  const issues: string[] = [];
  
  // Check for labels
  const inputs = formElement.querySelectorAll('input, select, textarea');
  inputs.forEach((input) => {
    const hasLabel = input.getAttribute('aria-label') || 
                    input.getAttribute('aria-labelledby') ||
                    formElement.querySelector(`label[for="${input.id}"]`);
    
    if (!hasLabel) {
      issues.push(`Input element missing label: ${input.tagName}`);
    }
  });
  
  // Check for required field indicators
  const requiredInputs = formElement.querySelectorAll('[required]');
  requiredInputs.forEach((input) => {
    const hasRequiredIndicator = input.getAttribute('aria-required') === 'true' ||
                                input.getAttribute('aria-describedby')?.includes('required');
    
    if (!hasRequiredIndicator) {
      issues.push(`Required field missing accessibility indicator: ${input.id || input.tagName}`);
    }
  });
  
  return issues;
};

// High contrast mode detection
export const useHighContrastMode = () => {
  const [isHighContrast, setIsHighContrast] = React.useState(false);
  
  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return isHighContrast;
};

// Enhanced keyboard navigation with roving tabindex
export const useRovingTabIndex = (items: HTMLElement[], activeIndex: number = 0) => {
  const [currentIndex, setCurrentIndex] = React.useState(activeIndex);
  
  React.useEffect(() => {
    items.forEach((item, index) => {
      if (item) {
        item.tabIndex = index === currentIndex ? 0 : -1;
      }
    });
  }, [items, currentIndex]);
  
  const moveNext = React.useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % items.length);
  }, [items.length]);
  
  const movePrevious = React.useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + items.length) % items.length);
  }, [items.length]);
  
  const moveToIndex = React.useCallback((index: number) => {
    if (index >= 0 && index < items.length) {
      setCurrentIndex(index);
    }
  }, [items.length]);
  
  return {
    currentIndex,
    moveNext,
    movePrevious,
    moveToIndex,
    handleKeyDown: (event: React.KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          event.preventDefault();
          moveNext();
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          event.preventDefault();
          movePrevious();
          break;
        case 'Home':
          event.preventDefault();
          moveToIndex(0);
          break;
        case 'End':
          event.preventDefault();
          moveToIndex(items.length - 1);
          break;
      }
    }
  };
};

// Reduced motion detection
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);
  
  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return prefersReducedMotion;
};

// Skip link utilities
export const createSkipLink = (targetId: string, label: string) => {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.textContent = label;
  skipLink.className = 'skip-link';
  skipLink.style.position = 'absolute';
  skipLink.style.left = '-10000px';
  skipLink.style.top = 'auto';
  skipLink.style.width = '1px';
  skipLink.style.height = '1px';
  skipLink.style.overflow = 'hidden';
  
  skipLink.addEventListener('focus', () => {
    skipLink.style.left = '6px';
    skipLink.style.top = '7px';
    skipLink.style.width = 'auto';
    skipLink.style.height = 'auto';
    skipLink.style.overflow = 'visible';
    skipLink.style.zIndex = '999999';
    skipLink.style.padding = '8px 16px';
    skipLink.style.backgroundColor = '#000';
    skipLink.style.color = '#fff';
    skipLink.style.textDecoration = 'none';
    skipLink.style.borderRadius = '3px';
  });
  
  skipLink.addEventListener('blur', () => {
    skipLink.style.left = '-10000px';
    skipLink.style.top = 'auto';
    skipLink.style.width = '1px';
    skipLink.style.height = '1px';
    skipLink.style.overflow = 'hidden';
  });
  
  return skipLink;
};

// Enhanced focus management with focus trap
export const useFocusTrap = (isActive: boolean) => {
  const containerRef = React.useRef<HTMLElement>(null);
  const firstFocusableRef = React.useRef<HTMLElement | null>(null);
  const lastFocusableRef = React.useRef<HTMLElement | null>(null);
  
  React.useEffect(() => {
    if (!isActive || !containerRef.current) return;
    
    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;
    
    if (focusableElements.length === 0) return;
    
    firstFocusableRef.current = focusableElements[0];
    lastFocusableRef.current = focusableElements[focusableElements.length - 1];
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      
      if (event.shiftKey) {
        if (document.activeElement === firstFocusableRef.current) {
          event.preventDefault();
          lastFocusableRef.current?.focus();
        }
      } else {
        if (document.activeElement === lastFocusableRef.current) {
          event.preventDefault();
          firstFocusableRef.current?.focus();
        }
      }
    };
    
    container.addEventListener('keydown', handleKeyDown);
    firstFocusableRef.current?.focus();
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive]);
  
  return containerRef;
};

// ARIA live region manager
export const useAriaLiveRegion = () => {
  const [announcements, setAnnouncements] = React.useState<Array<{
    id: string;
    message: string;
    priority: 'polite' | 'assertive';
    timestamp: number;
  }>>([]);
  
  const announce = React.useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const id = `announcement-${Date.now()}-${Math.random()}`;
    const announcement = {
      id,
      message,
      priority,
      timestamp: Date.now()
    };
    
    setAnnouncements(prev => [...prev, announcement]);
    
    // Remove announcement after it's been read
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    }, 1000);
  }, []);
  
  const LiveRegion = React.useMemo(() => {
    const Component = () => (
      <>
        {announcements.map(announcement => (
          <div
            key={announcement.id}
            aria-live={announcement.priority}
            aria-atomic="true"
            className="sr-only"
            style={{
              position: 'absolute',
              left: '-10000px',
              width: '1px',
              height: '1px',
              overflow: 'hidden'
            }}
          >
            {announcement.message}
          </div>
        ))}
      </>
    );
    return Component;
  }, [announcements]);
  
  return { announce, LiveRegion };
};

// Color contrast validation
export const validateColorContrast = (foreground: string, background: string): {
  ratio: number;
  wcagAA: boolean;
  wcagAAA: boolean;
  recommendation?: string;
} => {
  const ratio = getContrastRatio(foreground, background);
  const wcagAA = ratio >= 4.5;
  const wcagAAA = ratio >= 7;
  
  let recommendation: string | undefined;
  if (!wcagAA) {
    recommendation = 'Increase contrast to meet WCAG AA standards (4.5:1 minimum)';
  } else if (!wcagAAA) {
    recommendation = 'Consider increasing contrast for WCAG AAA compliance (7:1 minimum)';
  }
  
  return { ratio, wcagAA, wcagAAA, recommendation };
};

// Accessible form validation
export const useAccessibleFormValidation = () => {
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});
  
  const validateField = React.useCallback((name: string, value: any, rules: any) => {
    let error = '';
    
    if (rules.required && (!value || value.toString().trim() === '')) {
      error = `${name} is required`;
    } else if (rules.minLength && value.length < rules.minLength) {
      error = `${name} must be at least ${rules.minLength} characters`;
    } else if (rules.maxLength && value.length > rules.maxLength) {
      error = `${name} must be no more than ${rules.maxLength} characters`;
    } else if (rules.pattern && !rules.pattern.test(value)) {
      error = rules.message || `${name} format is invalid`;
    }
    
    setErrors(prev => ({ ...prev, [name]: error }));
    return error === '';
  }, []);
  
  const markFieldTouched = React.useCallback((name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);
  
  const getFieldProps = React.useCallback((name: string) => ({
    'aria-invalid': errors[name] ? 'true' : 'false',
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
    onBlur: () => markFieldTouched(name)
  }), [errors, markFieldTouched]);
  
  const getErrorProps = React.useCallback((name: string) => ({
    id: `${name}-error`,
    role: 'alert',
    'aria-live': 'polite'
  }), []);
  
  return {
    errors,
    touched,
    validateField,
    markFieldTouched,
    getFieldProps,
    getErrorProps,
    hasErrors: Object.values(errors).some(error => error !== ''),
    clearErrors: () => setErrors({})
  };
};