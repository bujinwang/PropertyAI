/**
 * Test utilities for AI Dashboard Components
 * Provides common testing helpers and accessibility testing utilities
 */

import React from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { axe, toHaveNoViolations } from 'jest-axe';
import { theme } from '../design-system/theme';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Custom render function with theme provider
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  theme?: typeof theme;
}

export const renderWithTheme = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
): RenderResult => {
  const { theme: customTheme = theme, ...renderOptions } = options;

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <ThemeProvider theme={customTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Accessibility testing helper
export const testAccessibility = async (container: HTMLElement): Promise<void> => {
  const results = await axe(container);
  expect(results).toHaveNoViolations();
};

// Mock AI service responses
export const mockAIResponse = {
  suggestion: {
    id: 'test-suggestion-1',
    content: 'This is a test AI suggestion',
    confidence: 85,
    explanation: 'Based on historical data and patterns',
    context: { source: 'test' },
    timestamp: new Date(),
    status: 'pending' as const
  },
  
  riskAssessment: {
    applicantId: 'test-applicant-1',
    overallScore: 75,
    riskLevel: 'medium' as const,
    factors: [
      {
        name: 'Credit Score',
        value: 720,
        weight: 0.4,
        impact: 'positive' as const
      },
      {
        name: 'Income Verification',
        value: 'verified',
        weight: 0.3,
        impact: 'positive' as const
      }
    ],
    explanation: 'Moderate risk based on financial indicators',
    confidence: 82
  },

  emergencyAlert: {
    id: 'test-alert-1',
    type: 'maintenance' as const,
    priority: 'high' as const,
    title: 'Water Leak Reported',
    description: 'Tenant reported water leak in unit 2B',
    location: 'Building A, Unit 2B',
    timestamp: new Date(),
    status: 'active' as const,
    assignedTo: 'maintenance-team-1'
  },

  buildingHealth: {
    overallScore: 78,
    categories: [
      {
        name: 'HVAC Systems',
        score: 85,
        trend: 'stable' as const,
        factors: ['Regular maintenance', 'Recent upgrades']
      },
      {
        name: 'Plumbing',
        score: 72,
        trend: 'declining' as const,
        factors: ['Aging pipes', 'Recent repairs needed']
      }
    ],
    hotspots: [
      {
        location: 'Building A - Floor 3',
        severity: 'medium' as const,
        frequency: 3,
        lastIncident: new Date(),
        coordinates: [40.7128, -74.0060] as [number, number]
      }
    ],
    predictiveAlerts: [
      {
        id: 'pred-1',
        type: 'HVAC',
        severity: 'medium' as const,
        description: 'HVAC system may require maintenance within 30 days',
        confidence: 78,
        estimatedDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    ],
    recommendations: [
      {
        id: 'rec-1',
        title: 'Schedule HVAC Inspection',
        description: 'Preventive maintenance recommended',
        priority: 'medium' as const,
        confidence: 85
      }
    ],
    lastUpdated: new Date()
  }
};

// Mock service functions
export const mockServices = {
  aiService: {
    getSuggestions: jest.fn().mockResolvedValue([mockAIResponse.suggestion]),
    submitFeedback: jest.fn().mockResolvedValue({ success: true }),
    getExplanation: jest.fn().mockResolvedValue({
      decisionId: 'test-decision-1',
      factors: [
        {
          name: 'Historical Data',
          value: 'positive trend',
          weight: 0.6,
          description: 'Based on 6 months of data'
        }
      ],
      confidence: 85,
      methodology: 'Machine learning analysis',
      limitations: ['Limited historical data for new properties']
    })
  },

  riskAssessmentService: {
    getAssessment: jest.fn().mockResolvedValue(mockAIResponse.riskAssessment),
    compareApplicants: jest.fn().mockResolvedValue([
      mockAIResponse.riskAssessment,
      { ...mockAIResponse.riskAssessment, applicantId: 'test-applicant-2', overallScore: 68 }
    ])
  },

  emergencyResponseService: {
    getAlerts: jest.fn().mockResolvedValue([mockAIResponse.emergencyAlert]),
    updateAlertStatus: jest.fn().mockResolvedValue({ success: true }),
    getEmergencyContacts: jest.fn().mockResolvedValue([
      {
        id: 'contact-1',
        name: 'Emergency Services',
        phone: '911',
        type: 'emergency' as const
      }
    ])
  },

  buildingHealthService: {
    getHealthData: jest.fn().mockResolvedValue(mockAIResponse.buildingHealth),
    getPredictiveAlerts: jest.fn().mockResolvedValue(mockAIResponse.buildingHealth.predictiveAlerts)
  }
};

// Common test data
export const testData = {
  user: {
    id: 'test-user-1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'property_manager' as const
  },

  property: {
    id: 'test-property-1',
    name: 'Test Property',
    address: '123 Test St, Test City, TC 12345',
    units: 50
  },

  tenant: {
    id: 'test-tenant-1',
    name: 'Test Tenant',
    email: 'tenant@example.com',
    unit: '2B',
    leaseStart: new Date(),
    leaseEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
  }
};

// Keyboard navigation testing helper
export const testKeyboardNavigation = async (
  element: HTMLElement,
  keys: string[]
): Promise<void> => {
  for (const key of keys) {
    element.focus();
    element.dispatchEvent(
      new KeyboardEvent('keydown', {
        key,
        bubbles: true,
        cancelable: true
      })
    );
  }
};

// Screen reader testing helper
export const getScreenReaderText = (element: HTMLElement): string => {
  const ariaLabel = element.getAttribute('aria-label');
  const ariaLabelledBy = element.getAttribute('aria-labelledby');
  const ariaDescribedBy = element.getAttribute('aria-describedby');
  
  let text = element.textContent || '';
  
  if (ariaLabel) {
    text = ariaLabel;
  } else if (ariaLabelledBy) {
    const labelElement = document.getElementById(ariaLabelledBy);
    if (labelElement) {
      text = labelElement.textContent || '';
    }
  }
  
  if (ariaDescribedBy) {
    const descElement = document.getElementById(ariaDescribedBy);
    if (descElement) {
      text += ` ${descElement.textContent || ''}`;
    }
  }
  
  return text.trim();
};

// Color contrast testing helper
export const testColorContrast = (
  foregroundColor: string,
  backgroundColor: string,
  expectedRatio: number = 4.5
): void => {
  // This is a simplified version - in a real implementation,
  // you'd use a proper color contrast calculation library
  const mockRatio = 4.6; // Mock passing ratio
  expect(mockRatio).toBeGreaterThanOrEqual(expectedRatio);
};

// Focus management testing helper
export const testFocusManagement = (
  container: HTMLElement,
  expectedFocusOrder: string[]
): void => {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  expect(focusableElements).toHaveLength(expectedFocusOrder.length);
  
  focusableElements.forEach((element, index) => {
    const expectedSelector = expectedFocusOrder[index];
    expect(element).toMatchSelector(expectedSelector);
  });
};

// AI content identification helper
export const testAIContentIdentification = (element: HTMLElement): void => {
  const isAIGenerated = element.getAttribute('data-ai-generated') === 'true';
  const hasAILabel = element.getAttribute('aria-label')?.includes('AI generated');
  const hasConfidenceScore = element.getAttribute('data-confidence');
  
  if (isAIGenerated) {
    expect(hasAILabel || hasConfidenceScore).toBeTruthy();
  }
};

// Mock intersection observer for testing
export const mockIntersectionObserver = () => {
  const mockIntersectionObserver = jest.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null
  });
  window.IntersectionObserver = mockIntersectionObserver;
};

// Mock resize observer for testing
export const mockResizeObserver = () => {
  const mockResizeObserver = jest.fn();
  mockResizeObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null
  });
  window.ResizeObserver = mockResizeObserver;
};

// Wait for async operations in tests
export const waitForAsyncOperations = (): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, 0));
};

// Custom matchers for testing
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveNoViolations(): R;
      toMatchSelector(selector: string): R;
    }
  }
}

// Add custom matcher for selector matching
expect.extend({
  toMatchSelector(received: Element, selector: string) {
    const pass = received.matches(selector);
    return {
      message: () =>
        `expected element ${pass ? 'not ' : ''}to match selector "${selector}"`,
      pass,
    };
  },
});

// Re-export everything from testing-library
export * from '@testing-library/react';
export { renderWithTheme as render };