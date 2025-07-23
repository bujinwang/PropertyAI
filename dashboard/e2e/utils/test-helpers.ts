import { Page, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Helper utilities for E2E tests
 */

/**
 * Login helper - simulates user authentication
 */
export async function loginAsUser(page: Page, userType: 'manager' | 'tenant' = 'manager') {
  // Navigate to login page
  await page.goto('/login');
  
  // Mock authentication for testing
  await page.evaluate((type) => {
    localStorage.setItem('auth_token', 'mock_token_' + type);
    localStorage.setItem('user_role', type);
    localStorage.setItem('user_id', 'test_user_' + type);
  }, userType);
  
  // Navigate to dashboard
  await page.goto('/dashboard');
  
  // Wait for dashboard to load
  await page.waitForSelector('[data-testid="dashboard-container"]', { timeout: 10000 });
}

/**
 * Wait for AI content to load
 */
export async function waitForAIContent(page: Page, selector: string) {
  // Wait for loading state to disappear
  await page.waitForSelector(`${selector} [data-testid="loading-indicator"]`, { state: 'detached', timeout: 15000 });
  
  // Wait for AI content to appear
  await page.waitForSelector(`${selector} [data-testid="ai-generated-content"]`, { timeout: 10000 });
}

/**
 * Check accessibility with axe-core
 */
export async function checkAccessibility(page: Page, options?: {
  include?: string[];
  exclude?: string[];
  tags?: string[];
}) {
  const axeBuilder = new AxeBuilder({ page });
  
  if (options?.include) {
    axeBuilder.include(options.include);
  }
  
  if (options?.exclude) {
    axeBuilder.exclude(options.exclude);
  }
  
  if (options?.tags) {
    axeBuilder.withTags(options.tags);
  }
  
  const accessibilityScanResults = await axeBuilder.analyze();
  
  expect(accessibilityScanResults.violations).toEqual([]);
  
  return accessibilityScanResults;
}

/**
 * Test keyboard navigation
 */
export async function testKeyboardNavigation(page: Page, startSelector: string, expectedStops: string[]) {
  // Focus on the starting element
  await page.focus(startSelector);
  
  // Tab through expected elements
  for (const expectedSelector of expectedStops) {
    await page.keyboard.press('Tab');
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toHaveAttribute('data-testid', expectedSelector.replace('[data-testid="', '').replace('"]', ''));
  }
}

/**
 * Mock API responses for testing
 */
export async function mockAPIResponses(page: Page) {
  // Mock AI communication training endpoints
  await page.route('**/api/ai/communication-training/**', async route => {
    const url = route.request().url();
    
    if (url.includes('/scenarios')) {
      await route.fulfill({
        json: {
          scenarios: [
            {
              id: '1',
              title: 'After Hours Inquiry',
              description: 'Tenant asks about maintenance after business hours',
              aiSuggestion: 'Thank you for contacting us. We have received your maintenance request and will respond during business hours.',
              confidence: 0.85
            }
          ]
        }
      });
    } else if (url.includes('/settings')) {
      await route.fulfill({
        json: {
          triggers: ['After Hours', 'Common Questions'],
          delay: 5,
          escalationRules: []
        }
      });
    }
  });

  // Mock risk assessment endpoints
  await page.route('**/api/risk-assessment/**', async route => {
    await route.fulfill({
      json: {
        applicants: [
          {
            id: '1',
            name: 'John Doe',
            riskLevel: 'low',
            overallScore: 85,
            confidence: 0.92,
            factors: [
              { name: 'Credit Score', value: 750, weight: 0.4, impact: 'positive' },
              { name: 'Income Verification', value: 'Verified', weight: 0.3, impact: 'positive' }
            ]
          }
        ],
        summary: {
          totalApplicants: 15,
          lowRisk: 8,
          mediumRisk: 5,
          highRisk: 2
        }
      }
    });
  });

  // Mock emergency response endpoints
  await page.route('**/api/emergency-response/**', async route => {
    await route.fulfill({
      json: {
        alerts: [
          {
            id: '1',
            type: 'Fire',
            location: 'Building A, Unit 101',
            status: 'active',
            priority: 'critical',
            timestamp: new Date().toISOString()
          }
        ],
        contacts: [
          {
            id: '1',
            name: 'Fire Department',
            phone: '911',
            type: 'emergency'
          }
        ]
      }
    });
  });

  // Mock personalization endpoints
  await page.route('**/api/personalization/**', async route => {
    await route.fulfill({
      json: {
        recommendations: [
          {
            id: '1',
            category: 'Local Services',
            title: 'Best Pizza Nearby',
            description: 'Highly rated pizza place within 2 miles',
            confidence: 0.78,
            reasoning: 'Based on your location and dining preferences'
          }
        ]
      }
    });
  });

  // Mock document verification endpoints
  await page.route('**/api/document-verification/**', async route => {
    await route.fulfill({
      json: {
        status: 'in_review',
        currentStep: 2,
        totalSteps: 4,
        confidence: 0.85,
        estimatedCompletion: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        requiredActions: [
          {
            id: '1',
            description: 'Upload proof of income',
            priority: 'high'
          }
        ]
      }
    });
  });

  // Mock building health endpoints
  await page.route('**/api/building-health/**', async route => {
    await route.fulfill({
      json: {
        overallScore: 78,
        categories: [
          { name: 'HVAC', score: 85, trend: 'stable' },
          { name: 'Plumbing', score: 72, trend: 'declining' }
        ],
        hotspots: [
          {
            location: 'Building A - 2nd Floor',
            severity: 'medium',
            frequency: 3,
            coordinates: [40.7128, -74.0060]
          }
        ],
        predictiveAlerts: [
          {
            id: '1',
            title: 'HVAC Filter Replacement Due',
            confidence: 0.89,
            priority: 'medium'
          }
        ]
      }
    });
  });

  // Mock AI insights endpoints
  await page.route('**/api/ai-insights/**', async route => {
    await route.fulfill({
      json: {
        insights: [
          {
            id: '1',
            category: 'Financial',
            title: 'Rent Collection Optimization',
            summary: 'Late payments have increased by 15% this quarter',
            confidence: 0.82,
            impact: 'high',
            recommendations: ['Implement automated reminders', 'Offer payment plans']
          }
        ]
      }
    });
  });

  // Mock market intelligence endpoints
  await page.route('**/api/market-intelligence/**', async route => {
    await route.fulfill({
      json: {
        trends: [
          {
            metric: 'Average Rent',
            currentValue: 2500,
            previousValue: 2400,
            change: 4.2,
            trend: 'up'
          }
        ],
        competitors: [
          {
            id: '1',
            name: 'Competitor A',
            location: [40.7128, -74.0060],
            rentRange: [2200, 2800],
            occupancyRate: 0.92
          }
        ]
      }
    });
  });
}

/**
 * Wait for charts to render
 */
export async function waitForChartsToRender(page: Page) {
  // Wait for Chart.js canvases to be present and rendered
  await page.waitForSelector('canvas', { timeout: 10000 });
  
  // Wait a bit more for animations to complete
  await page.waitForTimeout(1000);
}

/**
 * Test AI feedback mechanism
 */
export async function testAIFeedback(page: Page, contentSelector: string) {
  // Find AI generated content
  const aiContent = page.locator(contentSelector);
  await expect(aiContent).toBeVisible();
  
  // Test thumbs up feedback
  const thumbsUp = aiContent.locator('[data-testid="feedback-thumbs-up"]');
  await expect(thumbsUp).toBeVisible();
  await thumbsUp.click();
  
  // Verify feedback was recorded (check for visual feedback)
  await expect(thumbsUp).toHaveClass(/selected|active/);
  
  // Test thumbs down feedback
  const thumbsDown = aiContent.locator('[data-testid="feedback-thumbs-down"]');
  await expect(thumbsDown).toBeVisible();
  await thumbsDown.click();
  
  // Check if comment field appears
  const commentField = aiContent.locator('[data-testid="feedback-comment"]');
  if (await commentField.isVisible()) {
    await commentField.fill('Test feedback comment');
    
    const submitButton = aiContent.locator('[data-testid="feedback-submit"]');
    await submitButton.click();
  }
}

/**
 * Test confidence indicator interactions
 */
export async function testConfidenceIndicator(page: Page, selector: string) {
  const indicator = page.locator(selector);
  await expect(indicator).toBeVisible();
  
  // Check if confidence score is displayed
  const score = indicator.locator('[data-testid="confidence-score"]');
  await expect(score).toBeVisible();
  
  // Test tooltip/explanation if present
  const tooltip = indicator.locator('[data-testid="confidence-explanation"]');
  if (await tooltip.isVisible()) {
    await indicator.hover();
    await expect(tooltip).toBeVisible();
  }
}