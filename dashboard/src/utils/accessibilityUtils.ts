/**
 * Accessibility Utilities for Enhanced User Experience
 * Provides comprehensive accessibility features and helpers
 * Epic 21.5.2 - Mobile Experience Enhancement
 */

interface AriaLiveRegion {
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  clear: () => void;
}

interface FocusManagement {
  trap: (container: HTMLElement) => () => void;
  restore: (element: HTMLElement) => void;
  move: (direction: 'next' | 'previous' | 'first' | 'last') => void;
}

interface KeyboardNavigation {
  handleArrowKeys: (event: KeyboardEvent, callback: (direction: 'up' | 'down' | 'left' | 'right') => void) => void;
  handleTabNavigation: (event: KeyboardEvent, elements: HTMLElement[]) => void;
  handleEscapeKey: (event: KeyboardEvent, callback: () => void) => void;
}

interface ScreenReaderSupport {
  announceAction: (action: string, element?: string) => void;
  announceStatus: (status: string, live?: boolean) => void;
  announceError: (error: string) => void;
  announceSuccess: (message: string) => void;
}

class AccessibilityManager {
  private liveRegion: HTMLElement | null = null;
  private focusStack: HTMLElement[] = [];
  private keyboardHandlers: Map<string, (event: KeyboardEvent) => void> = new Map();

  // Initialize accessibility features
  initialize(): void {
    this.createLiveRegion();
    this.setupGlobalKeyboardHandlers();
    this.enhanceExistingElements();
  }

  // Create ARIA live region for announcements
  private createLiveRegion(): void {
    if (this.liveRegion) return;

    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.setAttribute('role', 'status');
    this.liveRegion.style.position = 'absolute';
    this.liveRegion.style.left = '-10000px';
    this.liveRegion.style.width = '1px';
    this.liveRegion.style.height = '1px';
    this.liveRegion.style.overflow = 'hidden';

    document.body.appendChild(this.liveRegion);
  }

  // Setup global keyboard handlers
  private setupGlobalKeyboardHandlers(): void {
    document.addEventListener('keydown', this.handleGlobalKeydown.bind(this));
  }

  // Handle global keyboard events
  private handleGlobalKeydown(event: KeyboardEvent): void {
    // Handle Escape key globally
    if (event.key === 'Escape') {
      const modal = document.querySelector('[role="dialog"][aria-modal="true"]') as HTMLElement;
      if (modal) {
        const closeButton = modal.querySelector('[data-close]') as HTMLElement;
        if (closeButton) {
          closeButton.click();
          event.preventDefault();
        }
      }
    }
  }

  // Enhance existing elements with accessibility features
  private enhanceExistingElements(): void {
    // Add skip links
    this.addSkipLinks();

    // Enhance form elements
    this.enhanceFormElements();

    // Add focus indicators
    this.addFocusIndicators();
  }

  // Add skip navigation links
  private addSkipLinks(): void {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      z-index: 1000;
      border-radius: 4px;
    `;

    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });

    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });

    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  // Enhance form elements with better accessibility
  private enhanceFormElements(): void {
    // Add labels to inputs without them
    const inputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
    inputs.forEach((input, index) => {
      const element = input as HTMLInputElement;
      if (!element.id) {
        element.id = `input-${index}`;
      }

      // Try to find associated label
      const label = document.querySelector(`label[for="${element.id}"]`);
      if (!label) {
        // Create a hidden label for screen readers
        const hiddenLabel = document.createElement('label');
        hiddenLabel.htmlFor = element.id;
        hiddenLabel.textContent = element.placeholder || element.name || 'Input field';
        hiddenLabel.style.cssText = `
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        `;
        element.parentNode?.insertBefore(hiddenLabel, element);
      }
    });
  }

  // Add focus indicators
  private addFocusIndicators(): void {
    const style = document.createElement('style');
    style.textContent = `
      *:focus-visible {
        outline: 2px solid #2196f3;
        outline-offset: 2px;
      }

      .focus-ring {
        outline: 2px solid #2196f3;
        outline-offset: 2px;
      }

      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // ARIA Live Region Management
  get liveRegionManager(): AriaLiveRegion {
    return {
      announce: (message: string, priority: 'polite' | 'assertive' = 'polite') => {
        if (this.liveRegion) {
          this.liveRegion.setAttribute('aria-live', priority);
          this.liveRegion.textContent = message;

          // Clear after announcement
          setTimeout(() => {
            if (this.liveRegion) {
              this.liveRegion.textContent = '';
            }
          }, 1000);
        }
      },

      clear: () => {
        if (this.liveRegion) {
          this.liveRegion.textContent = '';
        }
      }
    };
  }

  // Focus Management
  get focusManager(): FocusManagement {
    return {
      trap: (container: HTMLElement) => {
        const focusableElements = container.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        const handleKeydown = (event: KeyboardEvent) => {
          if (event.key === 'Tab') {
            if (event.shiftKey) {
              if (document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
              }
            } else {
              if (document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
              }
            }
          }
        };

        container.addEventListener('keydown', handleKeydown);

        // Focus first element
        if (firstElement) {
          firstElement.focus();
        }

        // Return cleanup function
        return () => {
          container.removeEventListener('keydown', handleKeydown);
        };
      },

      restore: (element: HTMLElement) => {
        if (element && typeof element.focus === 'function') {
          element.focus();
        }
      },

      move: (direction: 'next' | 'previous' | 'first' | 'last') => {
        const focusableElements = Array.from(
          document.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
        ) as HTMLElement[];

        const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);

        if (currentIndex === -1) return;

        let nextIndex: number;

        switch (direction) {
          case 'next':
            nextIndex = (currentIndex + 1) % focusableElements.length;
            break;
          case 'previous':
            nextIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
            break;
          case 'first':
            nextIndex = 0;
            break;
          case 'last':
            nextIndex = focusableElements.length - 1;
            break;
        }

        focusableElements[nextIndex]?.focus();
      }
    };
  }

  // Keyboard Navigation
  get keyboardNavigation(): KeyboardNavigation {
    return {
      handleArrowKeys: (event: KeyboardEvent, callback: (direction: 'up' | 'down' | 'left' | 'right') => void) => {
        const keyMap: { [key: string]: 'up' | 'down' | 'left' | 'right' } = {
          'ArrowUp': 'up',
          'ArrowDown': 'down',
          'ArrowLeft': 'left',
          'ArrowRight': 'right'
        };

        const direction = keyMap[event.key];
        if (direction) {
          event.preventDefault();
          callback(direction);
        }
      },

      handleTabNavigation: (event: KeyboardEvent, elements: HTMLElement[]) => {
        if (event.key === 'Tab') {
          event.preventDefault();

          const currentIndex = elements.indexOf(document.activeElement as HTMLElement);
          const nextIndex = event.shiftKey
            ? (currentIndex - 1 + elements.length) % elements.length
            : (currentIndex + 1) % elements.length;

          elements[nextIndex]?.focus();
        }
      },

      handleEscapeKey: (event: KeyboardEvent, callback: () => void) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          callback();
        }
      }
    };
  }

  // Screen Reader Support
  get screenReader(): ScreenReaderSupport {
    return {
      announceAction: (action: string, element?: string) => {
        const message = element ? `${action} on ${element}` : action;
        this.liveRegionManager.announce(message, 'polite');
      },

      announceStatus: (status: string, live: boolean = true) => {
        if (live) {
          this.liveRegionManager.announce(status, 'polite');
        }
      },

      announceError: (error: string) => {
        this.liveRegionManager.announce(`Error: ${error}`, 'assertive');
      },

      announceSuccess: (message: string) => {
        this.liveRegionManager.announce(`Success: ${message}`, 'polite');
      }
    };
  }

  // High Contrast Mode Detection
  isHighContrastMode(): boolean {
    const testElement = document.createElement('div');
    testElement.style.cssText = `
      position: absolute;
      left: -9999px;
      background-color: rgb(31, 41, 55);
      border: 1px solid rgb(31, 41, 55);
    `;
    document.body.appendChild(testElement);

    const computedStyle = window.getComputedStyle(testElement);
    const isHighContrast = computedStyle.backgroundColor === computedStyle.borderTopColor;

    document.body.removeChild(testElement);
    return isHighContrast;
  }

  // Reduced Motion Detection
  prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Color Scheme Detection
  prefersDarkMode(): boolean {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  // Cleanup
  destroy(): void {
    if (this.liveRegion && this.liveRegion.parentNode) {
      this.liveRegion.parentNode.removeChild(this.liveRegion);
    }

    document.removeEventListener('keydown', this.handleGlobalKeydown);

    // Clear keyboard handlers
    this.keyboardHandlers.clear();

    console.log('[Accessibility] Manager destroyed');
  }
}

// Export singleton instance
export const accessibilityManager = new AccessibilityManager();

// Utility functions for common accessibility patterns
export const a11y = {
  // Generate unique IDs
  generateId: (prefix: string = 'a11y') => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,

  // Set up ARIA attributes for expandable content
  setupExpandable: (button: HTMLElement, content: HTMLElement, expanded: boolean = false) => {
    const id = a11y.generateId('expandable');
    content.id = id;
    button.setAttribute('aria-expanded', expanded.toString());
    button.setAttribute('aria-controls', id);

    return {
      toggle: () => {
        const isExpanded = button.getAttribute('aria-expanded') === 'true';
        button.setAttribute('aria-expanded', (!isExpanded).toString());
        accessibilityManager.screenReader.announceAction(
          isExpanded ? 'collapsed' : 'expanded',
          button.textContent || 'content'
        );
      }
    };
  },

  // Set up ARIA attributes for modal dialogs
  setupModal: (modal: HTMLElement, titleId?: string) => {
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    if (titleId) {
      modal.setAttribute('aria-labelledby', titleId);
    }

    // Focus trap
    const cleanup = accessibilityManager.focusManager.trap(modal);

    return {
      cleanup,
      announce: (message: string) => {
        accessibilityManager.screenReader.announceStatus(message);
      }
    };
  },

  // Set up ARIA attributes for progress indicators
  setupProgress: (element: HTMLElement, value: number, max: number = 100, label?: string) => {
    element.setAttribute('role', 'progressbar');
    element.setAttribute('aria-valuenow', value.toString());
    element.setAttribute('aria-valuemax', max.toString());

    if (label) {
      element.setAttribute('aria-label', label);
    }

    return {
      update: (newValue: number) => {
        element.setAttribute('aria-valuenow', newValue.toString());
        accessibilityManager.screenReader.announceStatus(
          `${label || 'Progress'}: ${Math.round((newValue / max) * 100)}% complete`
        );
      }
    };
  },

  // Set up ARIA attributes for status messages
  announceStatus: (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    accessibilityManager.liveRegionManager.announce(message, priority);
  },

  // Check if user prefers high contrast
  isHighContrast: () => accessibilityManager.isHighContrastMode(),

  // Check if user prefers reduced motion
  prefersReducedMotion: () => accessibilityManager.prefersReducedMotion(),

  // Check if user prefers dark mode
  prefersDarkMode: () => accessibilityManager.prefersDarkMode()
};

export default accessibilityManager;