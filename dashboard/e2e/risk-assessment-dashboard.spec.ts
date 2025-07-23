import { test, expect } from '@playwright/test';
import { loginAsUser, mockAPIResponses, waitForAIContent, checkAccessibility, testKeyboardNavigation, testConfidenceIndicator } from './utils/test-helpers';

test.describe('AI Risk Assessment Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await mockAPIResponses(page);
    await loginAsUser(page, 'manager');
  });

  test('should display summary metrics and applicant list', async ({ page }) => {
    await page.goto('/risk-assessment');
    
    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="risk-assessment-dashboard"]');
    
    // Check summary metrics
    const summaryMetrics = page.locator('[data-testid="summary-metrics"]');
    await expect(summaryMetrics).toBeVisible();
    
    // Verify metric cards
    await expect(summaryMetrics.locator('[data-testid="total-applicants"]')).toContainText('15');
    await expect(summaryMetrics.locator('[data-testid="low-risk-count"]')).toContainText('8');
    await expect(summaryMetrics.locator('[data-testid="medium-risk-count"]')).toContainText('5');
    await expect(summaryMetrics.locator('[data-testid="high-risk-count"]')).toContainText('2');
    
    // Check applicant list
    const applicantList = page.locator('[data-testid="applicant-list"]');
    await expect(applicantList).toBeVisible();
    
    // Verify color-coded risk indicators
    const applicantRow = applicantList.locator('[data-testid="applicant-row"]').first();
    await expect(applicantRow).toBeVisible();
    
    const riskIndicator = applicantRow.locator('[data-testid="risk-indicator"]');
    await expect(riskIndicator).toBeVisible();
    await expect(riskIndicator).toHaveClass(/low-risk|medium-risk|high-risk/);
  });

  test('should open detailed risk factor breakdown', async ({ page }) => {
    await page.goto('/risk-assessment');
    await page.waitForSelector('[data-testid="risk-assessment-dashboard"]');
    
    // Click on an applicant to view details
    const applicantRow = page.locator('[data-testid="applicant-row"]').first();
    await applicantRow.click();
    
    // Check detailed breakdown modal/drawer
    const detailsView = page.locator('[data-testid="risk-factor-breakdown"]');
    await expect(detailsView).toBeVisible();
    
    // Verify risk factors are displayed
    const riskFactors = detailsView.locator('[data-testid="risk-factor"]');
    await expect(riskFactors).toHaveCount(2); // Based on mock data
    
    // Check individual risk factor details
    const creditScoreFactor = riskFactors.filter({ hasText: 'Credit Score' });
    await expect(creditScoreFactor).toBeVisible();
    await expect(creditScoreFactor.locator('[data-testid="factor-value"]')).toContainText('750');
    await expect(creditScoreFactor.locator('[data-testid="factor-impact"]')).toHaveClass(/positive/);
    
    // Test confidence indicator
    await testConfidenceIndicator(page, '[data-testid="overall-confidence"]');
    
    // Check explanation text
    const explanation = detailsView.locator('[data-testid="risk-explanation"]');
    await expect(explanation).toBeVisible();
  });

  test('should support applicant comparison', async ({ page }) => {
    await page.goto('/risk-assessment');
    await page.waitForSelector('[data-testid="risk-assessment-dashboard"]');
    
    // Select multiple applicants for comparison
    const firstApplicant = page.locator('[data-testid="applicant-checkbox"]').first();
    const secondApplicant = page.locator('[data-testid="applicant-checkbox"]').nth(1);
    
    await firstApplicant.check();
    await secondApplicant.check();
    
    // Open comparison view
    const compareButton = page.locator('[data-testid="compare-applicants"]');
    await expect(compareButton).toBeVisible();
    await compareButton.click();
    
    // Check comparison interface
    const comparisonView = page.locator('[data-testid="applicant-comparison"]');
    await expect(comparisonView).toBeVisible();
    
    // Verify multi-column layout
    const comparisonColumns = comparisonView.locator('[data-testid="comparison-column"]');
    await expect(comparisonColumns).toHaveCount(2);
    
    // Check risk factor comparison table
    const comparisonTable = comparisonView.locator('[data-testid="comparison-table"]');
    await expect(comparisonTable).toBeVisible();
    
    // Verify color-coded comparison
    const riskFactorRows = comparisonTable.locator('[data-testid="factor-row"]');
    await expect(riskFactorRows.first()).toBeVisible();
  });

  test('should display fair housing compliance disclaimers', async ({ page }) => {
    await page.goto('/risk-assessment');
    await page.waitForSelector('[data-testid="risk-assessment-dashboard"]');
    
    // Check for fair housing disclaimer
    const fairHousingDisclaimer = page.locator('[data-testid="fair-housing-disclaimer"]');
    await expect(fairHousingDisclaimer).toBeVisible();
    await expect(fairHousingDisclaimer).toContainText('Fair Housing');
    
    // Check disclaimer in detailed view
    const applicantRow = page.locator('[data-testid="applicant-row"]').first();
    await applicantRow.click();
    
    const detailsDisclaimer = page.locator('[data-testid="details-fair-housing-disclaimer"]');
    await expect(detailsDisclaimer).toBeVisible();
  });

  test('should be fully accessible via keyboard', async ({ page }) => {
    await page.goto('/risk-assessment');
    await page.waitForSelector('[data-testid="risk-assessment-dashboard"]');
    
    // Test keyboard navigation through applicant list
    await testKeyboardNavigation(page, '[data-testid="applicant-row"]:first-child', [
      '[data-testid="applicant-checkbox"]:first-child',
      '[data-testid="view-details-button"]:first-child',
      '[data-testid="applicant-row"]:nth-child(2)'
    ]);
    
    // Test keyboard access to comparison features
    await page.keyboard.press('Tab');
    const compareButton = page.locator(':focus');
    await expect(compareButton).toHaveAttribute('data-testid', 'compare-applicants');
    
    // Test Enter key activation
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="applicant-comparison"]')).toBeVisible();
  });

  test('should pass comprehensive accessibility audit', async ({ page }) => {
    await page.goto('/risk-assessment');
    await page.waitForSelector('[data-testid="risk-assessment-dashboard"]');
    
    // Run accessibility check on main dashboard
    await checkAccessibility(page, {
      tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
      include: ['[data-testid="risk-assessment-dashboard"]']
    });
    
    // Open detailed view and check accessibility
    const applicantRow = page.locator('[data-testid="applicant-row"]').first();
    await applicantRow.click();
    
    await checkAccessibility(page, {
      tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
      include: ['[data-testid="risk-factor-breakdown"]']
    });
  });

  test('should handle high contrast mode', async ({ page }) => {
    // Enable high contrast mode
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    
    await page.goto('/risk-assessment');
    await page.waitForSelector('[data-testid="risk-assessment-dashboard"]');
    
    // Verify high contrast text is visible
    const riskIndicators = page.locator('[data-testid="risk-indicator"]');
    
    for (let i = 0; i < await riskIndicators.count(); i++) {
      const indicator = riskIndicators.nth(i);
      
      // Check that text has sufficient contrast
      const textColor = await indicator.evaluate(el => getComputedStyle(el).color);
      const backgroundColor = await indicator.evaluate(el => getComputedStyle(el).backgroundColor);
      
      // Basic check that colors are different (more sophisticated contrast checking would require additional libraries)
      expect(textColor).not.toBe(backgroundColor);
    }
  });

  test('should handle screen reader announcements', async ({ page }) => {
    await page.goto('/risk-assessment');
    await page.waitForSelector('[data-testid="risk-assessment-dashboard"]');
    
    // Check ARIA labels and descriptions
    const applicantList = page.locator('[data-testid="applicant-list"]');
    await expect(applicantList).toHaveAttribute('role', 'table');
    await expect(applicantList).toHaveAttribute('aria-label');
    
    // Check risk indicators have proper ARIA attributes
    const riskIndicators = page.locator('[data-testid="risk-indicator"]');
    
    for (let i = 0; i < await riskIndicators.count(); i++) {
      const indicator = riskIndicators.nth(i);
      await expect(indicator).toHaveAttribute('aria-label');
    }
    
    // Check confidence indicators have explanations
    const confidenceIndicators = page.locator('[data-testid="confidence-indicator"]');
    
    for (let i = 0; i < await confidenceIndicators.count(); i++) {
      const indicator = confidenceIndicators.nth(i);
      await expect(indicator).toHaveAttribute('aria-describedby');
    }
  });

  test('should filter and sort applicants', async ({ page }) => {
    await page.goto('/risk-assessment');
    await page.waitForSelector('[data-testid="risk-assessment-dashboard"]');
    
    // Test risk level filter
    const riskFilter = page.locator('[data-testid="risk-level-filter"]');
    await riskFilter.selectOption('high');
    
    // Verify filtered results
    const applicantRows = page.locator('[data-testid="applicant-row"]');
    const visibleRows = await applicantRows.count();
    
    // Should show only high-risk applicants (2 based on mock data)
    expect(visibleRows).toBeLessThanOrEqual(2);
    
    // Test sorting
    const sortButton = page.locator('[data-testid="sort-by-risk"]');
    await sortButton.click();
    
    // Verify sort order changed
    const firstApplicantRisk = await page.locator('[data-testid="applicant-row"]').first()
      .locator('[data-testid="risk-indicator"]').getAttribute('class');
    
    expect(firstApplicantRisk).toContain('high-risk');
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/risk-assessment/**', route => {
      route.fulfill({
        status: 500,
        json: { error: 'Internal server error' }
      });
    });
    
    await page.goto('/risk-assessment');
    
    // Check error boundary or error message
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('error');
    
    // Check retry functionality
    const retryButton = page.locator('[data-testid="retry-button"]');
    if (await retryButton.isVisible()) {
      await retryButton.click();
    }
  });
});