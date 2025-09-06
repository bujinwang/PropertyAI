// PropertyFlow AI Accessibility Hooks
// Custom React hooks for consistent accessibility patterns

import { useEffect, useRef, useState, useCallback, RefObject } from 'react';

/**
 * Hook for managing screen reader announcements
 */
export interface UseAnnouncementOptions {
  priority?: 'polite' | 'assertive';
  clearOnUnmount?: boolean;
}

export const useAnnouncement = (options: UseAnnouncementOptions = {}) => {
  const { priority = 'polite', clearOnUnmount = true } = options;
  const regionRef = useRef<HTMLDivElement>(null);

  const announce = useCallback((message: string) => {
    if (!regionRef.current) return;

    // Clear previous message first to ensure new message is announced
    regionRef.current.textContent = '';
    
    // Use requestAnimationFrame to ensure the clear happens before the new message
    requestAnimationFrame(() => {
      if (regionRef.current) {
        regionRef.current.textContent = message;
      }
    });
  }, []);

  const clear = useCallback(() => {
    if (regionRef.current) {
      regionRef.current.textContent = '';
    }
  }, []);

  useEffect(() => {
    return () => {
      if (clearOnUnmount) {
        clear();
      }
    };
  }, [clearOnUnmount, clear]);

  // Create the live region element
  const liveRegion = (
    <div
      ref={regionRef}
      aria-live={priority}
      aria-atomic="true"
      style={{
        position: 'absolute',
        left: '-10000px',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
      }}
    />
  );

  return { announce, clear, liveRegion };
};

/**
 * Hook for managing focus within components
 */
export interface UseFocusManagementOptions {
  returnFocus?: boolean;
  trapFocus?: boolean;
  initialFocus?: RefObject<HTMLElement>;
  restoreFocus?: RefObject<HTMLElement>;
}

export const useFocusManagement = (options: UseFocusManagementOptions = {}) => {
  const { returnFocus = true, trapFocus = false, initialFocus, restoreFocus } = options;
  const containerRef = useRef<HTMLElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  const setInitialFocus = useCallback(() => {
    if (initialFocus?.current) {
      initialFocus.current.focus();
    } else if (containerRef.current) {
      const firstFocusable = containerRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      firstFocusable?.focus();
    }
  }, [initialFocus]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!trapFocus || !containerRef.current) return;

      const focusableElements = containerRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      const firstFocusable = focusableElements[0] as HTMLElement;
      const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (event.key === 'Tab') {
        if (event.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstFocusable) {
            event.preventDefault();
            lastFocusable?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastFocusable) {
            event.preventDefault();
            firstFocusable?.focus();
          }
        }
      }
    },
    [trapFocus]
  );

  useEffect(() => {
    // Store previously focused element
    previouslyFocusedElement.current = document.activeElement as HTMLElement;

    // Set initial focus
    setInitialFocus();

    // Add event listener for focus trapping
    if (trapFocus) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      if (trapFocus) {
        document.removeEventListener('keydown', handleKeyDown);
      }

      // Return focus to previously focused element
      if (returnFocus && previouslyFocusedElement.current) {
        const elementToFocus = restoreFocus?.current || previouslyFocusedElement.current;
        elementToFocus?.focus();
      }
    };
  }, [trapFocus, returnFocus, restoreFocus, handleKeyDown, setInitialFocus]);

  return { containerRef, setInitialFocus };
};

/**
 * Hook for keyboard navigation patterns
 */
export interface UseKeyboardNavigationOptions {
  onEscape?: () => void;
  onEnter?: () => void;
  onSpace?: () => void;
  onArrowKeys?: (direction: 'up' | 'down' | 'left' | 'right') => void;
  enabled?: boolean;
}

export const useKeyboardNavigation = (options: UseKeyboardNavigationOptions = {}) => {
  const { onEscape, onEnter, onSpace, onArrowKeys, enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          onEscape?.();
          break;
        case 'Enter':
          onEnter?.();
          break;
        case ' ':
          if (onSpace) {
            event.preventDefault();
            onSpace();
          }
          break;
        case 'ArrowUp':
          onArrowKeys?.('up');
          break;
        case 'ArrowDown':
          onArrowKeys?.('down');
          break;
        case 'ArrowLeft':
          onArrowKeys?.('left');
          break;
        case 'ArrowRight':
          onArrowKeys?.('right');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onEscape, onEnter, onSpace, onArrowKeys, enabled]);
};

/**
 * Hook for validating color contrast dynamically
 */
export const useColorContrast = () => {
  const [contrastResults, setContrastResults] = useState<Map<string, number>>(new Map());

  const checkContrast = useCallback(async (foreground: string, background: string, key?: string) => {
    // Dynamic import to avoid bundling WCAG utilities in every component
    const { getContrastRatio } = await import('../utils/wcag');
    
    try {
      const ratio = getContrastRatio(foreground, background);
      
      if (key) {
        setContrastResults(prev => new Map(prev).set(key, ratio));
      }
      
      return ratio;
    } catch (error) {
      console.warn('Color contrast check failed:', error);
      return 1; // Fail-safe value
    }
  }, []);

  return { checkContrast, contrastResults };
};

/**
 * Hook for respecting user's motion preferences
 */
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
};

/**
 * Hook for managing ARIA expanded state
 */
export const useAriaExpanded = (initialExpanded: boolean = false) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

  const toggle = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const expand = useCallback(() => {
    setIsExpanded(true);
  }, []);

  const collapse = useCallback(() => {
    setIsExpanded(false);
  }, []);

  return {
    isExpanded,
    'aria-expanded': isExpanded,
    toggle,
    expand,
    collapse,
  };
};

/**
 * Hook for managing disclosure patterns (show/hide content)
 */
export const useDisclosure = (initialOpen: boolean = false) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const triggerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLElement>(null);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // Generate unique IDs for ARIA relationships
  const triggerId = `disclosure-trigger-${Math.random().toString(36).substr(2, 9)}`;
  const contentId = `disclosure-content-${Math.random().toString(36).substr(2, 9)}`;

  return {
    isOpen,
    open,
    close,
    toggle,
    triggerRef,
    contentRef,
    triggerProps: {
      ref: triggerRef,
      id: triggerId,
      'aria-expanded': isOpen,
      'aria-controls': contentId,
    },
    contentProps: {
      ref: contentRef,
      id: contentId,
      'aria-labelledby': triggerId,
      hidden: !isOpen,
    },
  };
};

/**
 * Hook for managing roving tabindex pattern
 */
export const useRovingTabIndex = (items: RefObject<HTMLElement>[], initialIndex: number = 0) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const moveToIndex = useCallback((index: number) => {
    if (index >= 0 && index < items.length) {
      setCurrentIndex(index);
      items[index].current?.focus();
    }
  }, [items]);

  const moveNext = useCallback(() => {
    const nextIndex = (currentIndex + 1) % items.length;
    moveToIndex(nextIndex);
  }, [currentIndex, items.length, moveToIndex]);

  const movePrevious = useCallback(() => {
    const prevIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
    moveToIndex(prevIndex);
  }, [currentIndex, items.length, moveToIndex]);

  const getTabIndex = useCallback((index: number) => {
    return index === currentIndex ? 0 : -1;
  }, [currentIndex]);

  return {
    currentIndex,
    moveToIndex,
    moveNext,
    movePrevious,
    getTabIndex,
  };
};