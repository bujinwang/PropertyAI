/**
 * Mobile Compatibility Audit Utility
 * Assesses mobile responsiveness, touch targets, and performance metrics
 */

export interface MobileAuditResult {
  viewport: {
    hasViewportMeta: boolean;
    isResponsive: boolean;
    issues: string[];
  };
  touchTargets: {
    totalElements: number;
    compliantElements: number;
    nonCompliantElements: number;
    issues: Array<{
      element: string;
      size: { width: number; height: number };
      selector: string;
    }>;
  };
  responsiveDesign: {
    breakpoints: {
      mobile: boolean;
      tablet: boolean;
      desktop: boolean;
    };
    fluidTypography: boolean;
    flexibleImages: boolean;
    issues: string[];
  };
  performance: {
    estimatedLoadTime: number;
    bundleSize: number;
    issues: string[];
  };
  accessibility: {
    screenReaderSupport: boolean;
    keyboardNavigation: boolean;
    highContrastSupport: boolean;
    issues: string[];
  };
  overallScore: number;
  recommendations: string[];
}

export class MobileAudit {
  private static readonly MIN_TOUCH_TARGET_SIZE = 44; // WCAG AA requirement
  private static readonly RECOMMENDED_BREAKPOINTS = {
    mobile: 768,
    tablet: 1024,
    desktop: 1200
  };

  /**
   * Comprehensive mobile compatibility audit
   */
  static async performAudit(): Promise<MobileAuditResult> {
    const result: MobileAuditResult = {
      viewport: {
        hasViewportMeta: false,
        isResponsive: false,
        issues: []
      },
      touchTargets: {
        totalElements: 0,
        compliantElements: 0,
        nonCompliantElements: 0,
        issues: []
      },
      responsiveDesign: {
        breakpoints: {
          mobile: false,
          tablet: false,
          desktop: false
        },
        fluidTypography: false,
        flexibleImages: false,
        issues: []
      },
      performance: {
        estimatedLoadTime: 0,
        bundleSize: 0,
        issues: []
      },
      accessibility: {
        screenReaderSupport: false,
        keyboardNavigation: false,
        highContrastSupport: false,
        issues: []
      },
      overallScore: 0,
      recommendations: []
    };

    try {
      // Check viewport meta tag
      result.viewport = this.checkViewportMeta();

      // Analyze touch targets
      result.touchTargets = await this.analyzeTouchTargets();

      // Check responsive design
      result.responsiveDesign = this.checkResponsiveDesign();

      // Performance assessment
      result.performance = await this.assessPerformance();

      // Accessibility check
      result.accessibility = this.checkAccessibility();

      // Calculate overall score
      result.overallScore = this.calculateOverallScore(result);

      // Generate recommendations
      result.recommendations = this.generateRecommendations(result);

    } catch (error) {
      console.error('Mobile audit failed:', error);
      result.recommendations.push('Audit failed - manual review required');
    }

    return result;
  }

  private static checkViewportMeta(): MobileAuditResult['viewport'] {
    const viewport = document.querySelector('meta[name="viewport"]');
    const hasViewportMeta = !!viewport;

    let isResponsive = false;
    const issues: string[] = [];

    if (hasViewportMeta) {
      const content = viewport?.getAttribute('content') || '';
      isResponsive = content.includes('width=device-width') &&
                    content.includes('initial-scale=1');

      if (!isResponsive) {
        issues.push('Viewport meta tag missing responsive configuration');
      }
    } else {
      issues.push('Missing viewport meta tag');
    }

    return { hasViewportMeta, isResponsive, issues };
  }

  private static async analyzeTouchTargets(): Promise<MobileAuditResult['touchTargets']> {
    const interactiveElements = document.querySelectorAll(
      'button, a, input, select, textarea, [role="button"], [onclick], [ontouchstart]'
    );

    const issues: Array<{
      element: string;
      size: { width: number; height: number };
      selector: string;
    }> = [];

    let compliantElements = 0;
    let nonCompliantElements = 0;

    interactiveElements.forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(element);

      // Account for padding and borders
      const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
      const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
      const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
      const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;

      const effectiveWidth = rect.width - paddingLeft - paddingRight;
      const effectiveHeight = rect.height - paddingTop - paddingBottom;

      const isCompliant = effectiveWidth >= this.MIN_TOUCH_TARGET_SIZE &&
                         effectiveHeight >= this.MIN_TOUCH_TARGET_SIZE;

      if (isCompliant) {
        compliantElements++;
      } else {
        nonCompliantElements++;
        issues.push({
          element: element.tagName.toLowerCase(),
          size: { width: effectiveWidth, height: effectiveHeight },
          selector: this.getElementSelector(element)
        });
      }
    });

    return {
      totalElements: interactiveElements.length,
      compliantElements,
      nonCompliantElements,
      issues
    };
  }

  private static checkResponsiveDesign(): MobileAuditResult['responsiveDesign'] {
    const stylesheets = document.styleSheets;
    const breakpoints = { mobile: false, tablet: false, desktop: false };
    const issues: string[] = [];

    // Check for media queries
    for (let i = 0; i < stylesheets.length; i++) {
      try {
        const rules = stylesheets[i].cssRules;
        for (let j = 0; j < rules.length; j++) {
          const rule = rules[j] as CSSMediaRule;
          if (rule.type === CSSRule.MEDIA_RULE) {
            const mediaText = rule.media.mediaText;

            // Check for common breakpoint patterns
            if (mediaText.includes('max-width')) {
              const match = mediaText.match(/max-width:\s*(\d+)px/);
              if (match) {
                const width = parseInt(match[1]);
                if (width <= 768) breakpoints.mobile = true;
                if (width <= 1024) breakpoints.tablet = true;
                if (width > 1024) breakpoints.desktop = true;
              }
            }
          }
        }
      } catch (e) {
        // Ignore cross-origin stylesheet errors
      }
    }

    // Check for fluid typography (clamp, vw units)
    const bodyStyles = window.getComputedStyle(document.body);
    const fontSize = bodyStyles.fontSize;
    const fluidTypography = fontSize.includes('clamp') || fontSize.includes('vw');

    // Check for flexible images
    const images = document.querySelectorAll('img');
    let flexibleImages = true;
    images.forEach(img => {
      const maxWidth = window.getComputedStyle(img).maxWidth;
      if (maxWidth !== '100%' && maxWidth !== 'none') {
        flexibleImages = false;
      }
    });

    // Generate issues
    if (!breakpoints.mobile) {
      issues.push('Missing mobile breakpoint (max-width: 768px)');
    }
    if (!breakpoints.tablet) {
      issues.push('Missing tablet breakpoint (max-width: 1024px)');
    }
    if (!fluidTypography) {
      issues.push('Not using fluid typography (clamp() or viewport units)');
    }
    if (!flexibleImages) {
      issues.push('Images not responsive (missing max-width: 100%)');
    }

    return {
      breakpoints,
      fluidTypography,
      flexibleImages,
      issues
    };
  }

  private static async assessPerformance(): Promise<MobileAuditResult['performance']> {
    const issues: string[] = [];
    let estimatedLoadTime = 0;
    let bundleSize = 0;

    try {
      // Estimate bundle size from performance entries
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      bundleSize = resources
        .filter(r => r.name.includes('.js'))
        .reduce((total, r) => total + (r.transferSize || 0), 0);

      // Estimate load time based on navigation timing
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        estimatedLoadTime = navigation.loadEventEnd - navigation.fetchStart;
      }

      // Performance issues
      if (bundleSize > 500000) { // 500KB
        issues.push(`Large bundle size: ${(bundleSize / 1024 / 1024).toFixed(2)}MB`);
      }
      if (estimatedLoadTime > 3000) { // 3 seconds
        issues.push(`Slow load time: ${(estimatedLoadTime / 1000).toFixed(2)}s`);
      }

    } catch (error) {
      issues.push('Unable to assess performance metrics');
    }

    return {
      estimatedLoadTime,
      bundleSize,
      issues
    };
  }

  private static checkAccessibility(): MobileAuditResult['accessibility'] {
    const issues: string[] = [];

    // Check for ARIA labels
    const interactiveElements = document.querySelectorAll(
      'button, a, input, select, textarea'
    );
    let screenReaderSupport = true;
    let keyboardNavigation = true;

    interactiveElements.forEach(element => {
      const ariaLabel = element.getAttribute('aria-label');
      const ariaLabelledBy = element.getAttribute('aria-labelledby');
      const hasTextContent = element.textContent?.trim();

      if (!ariaLabel && !ariaLabelledBy && !hasTextContent) {
        screenReaderSupport = false;
        issues.push(`Missing accessible label for ${element.tagName.toLowerCase()}`);
      }
    });

    // Check for focus indicators
    const focusableElements = document.querySelectorAll(
      'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusableElements.forEach(element => {
      const focusStyles = window.getComputedStyle(element, ':focus');
      if (!focusStyles.outline || focusStyles.outline === 'none') {
        keyboardNavigation = false;
        issues.push(`Missing focus indicator for ${element.tagName.toLowerCase()}`);
      }
    });

    // High contrast support (basic check)
    const bodyBg = window.getComputedStyle(document.body).backgroundColor;
    const bodyColor = window.getComputedStyle(document.body).color;
    const highContrastSupport = bodyBg !== 'rgba(0, 0, 0, 0)' || bodyColor !== 'rgb(0, 0, 0)';

    return {
      screenReaderSupport,
      keyboardNavigation,
      highContrastSupport,
      issues
    };
  }

  private static calculateOverallScore(result: MobileAuditResult): number {
    let score = 100;

    // Viewport issues
    if (!result.viewport.hasViewportMeta) score -= 20;
    if (!result.viewport.isResponsive) score -= 10;

    // Touch target issues
    const touchCompliance = result.touchTargets.compliantElements / result.touchTargets.totalElements;
    if (touchCompliance < 0.8) score -= Math.round((1 - touchCompliance) * 20);

    // Responsive design issues
    if (!result.responsiveDesign.breakpoints.mobile) score -= 10;
    if (!result.responsiveDesign.breakpoints.tablet) score -= 5;
    if (!result.responsiveDesign.fluidTypography) score -= 5;
    if (!result.responsiveDesign.flexibleImages) score -= 5;

    // Performance issues
    if (result.performance.estimatedLoadTime > 3000) score -= 10;
    if (result.performance.bundleSize > 500000) score -= 10;

    // Accessibility issues
    if (!result.accessibility.screenReaderSupport) score -= 10;
    if (!result.accessibility.keyboardNavigation) score -= 10;
    if (!result.accessibility.highContrastSupport) score -= 5;

    return Math.max(0, Math.min(100, score));
  }

  private static generateRecommendations(result: MobileAuditResult): string[] {
    const recommendations: string[] = [];

    // Viewport recommendations
    if (!result.viewport.hasViewportMeta) {
      recommendations.push('Add viewport meta tag: <meta name="viewport" content="width=device-width, initial-scale=1">');
    }

    // Touch target recommendations
    if (result.touchTargets.nonCompliantElements > 0) {
      recommendations.push(`Fix ${result.touchTargets.nonCompliantElements} touch targets to meet 44px minimum`);
    }

    // Responsive design recommendations
    if (!result.responsiveDesign.breakpoints.mobile) {
      recommendations.push('Add mobile breakpoint (max-width: 768px) with mobile-first design');
    }
    if (!result.responsiveDesign.fluidTypography) {
      recommendations.push('Implement fluid typography using clamp() for better scaling');
    }

    // Performance recommendations
    if (result.performance.estimatedLoadTime > 3000) {
      recommendations.push('Optimize load time: implement code splitting, lazy loading, and caching');
    }
    if (result.performance.bundleSize > 500000) {
      recommendations.push('Reduce bundle size: tree shaking, compression, and progressive loading');
    }

    // Accessibility recommendations
    if (!result.accessibility.screenReaderSupport) {
      recommendations.push('Add ARIA labels and semantic HTML for screen reader support');
    }
    if (!result.accessibility.keyboardNavigation) {
      recommendations.push('Implement visible focus indicators for keyboard navigation');
    }

    return recommendations;
  }

  private static getElementSelector(element: Element): string {
    if (element.id) {
      return `#${element.id}`;
    }

    if (element.className) {
      return `.${element.className.split(' ').join('.')}`;
    }

    let selector = element.tagName.toLowerCase();
    let sibling = element.previousElementSibling;
    let nth = 1;

    while (sibling) {
      if (sibling.tagName === element.tagName) {
        nth++;
      }
      sibling = sibling.previousElementSibling;
    }

    if (nth > 1) {
      selector += `:nth-child(${nth})`;
    }

    return selector;
  }

  /**
   * Export audit results to console
   */
  static logResults(result: MobileAuditResult): void {
    console.group('📱 Mobile Compatibility Audit Results');
    console.log(`Overall Score: ${result.overallScore}/100`);

    console.group('Viewport');
    console.log('Has viewport meta:', result.viewport.hasViewportMeta);
    console.log('Is responsive:', result.viewport.isResponsive);
    if (result.viewport.issues.length > 0) {
      console.log('Issues:', result.viewport.issues);
    }
    console.groupEnd();

    console.group('Touch Targets');
    console.log(`Total: ${result.touchTargets.totalElements}`);
    console.log(`Compliant: ${result.touchTargets.compliantElements}`);
    console.log(`Non-compliant: ${result.touchTargets.nonCompliantElements}`);
    if (result.touchTargets.issues.length > 0) {
      console.log('Issues:', result.touchTargets.issues.slice(0, 5)); // First 5 issues
    }
    console.groupEnd();

    console.group('Responsive Design');
    console.log('Breakpoints:', result.responsiveDesign.breakpoints);
    console.log('Fluid typography:', result.responsiveDesign.fluidTypography);
    console.log('Flexible images:', result.responsiveDesign.flexibleImages);
    if (result.responsiveDesign.issues.length > 0) {
      console.log('Issues:', result.responsiveDesign.issues);
    }
    console.groupEnd();

    console.group('Performance');
    console.log(`Load time: ${(result.performance.estimatedLoadTime / 1000).toFixed(2)}s`);
    console.log(`Bundle size: ${(result.performance.bundleSize / 1024 / 1024).toFixed(2)}MB`);
    if (result.performance.issues.length > 0) {
      console.log('Issues:', result.performance.issues);
    }
    console.groupEnd();

    console.group('Accessibility');
    console.log('Screen reader support:', result.accessibility.screenReaderSupport);
    console.log('Keyboard navigation:', result.accessibility.keyboardNavigation);
    console.log('High contrast support:', result.accessibility.highContrastSupport);
    if (result.accessibility.issues.length > 0) {
      console.log('Issues:', result.accessibility.issues.slice(0, 5)); // First 5 issues
    }
    console.groupEnd();

    console.group('Recommendations');
    result.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
    console.groupEnd();

    console.groupEnd();
  }
}

export default MobileAudit;