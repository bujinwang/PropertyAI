import { test, expect } from '@playwright/test';
import { loginAsUser, mockAPIResponses, waitForAIContent, checkAccessibility, testKeyboardNavigation, testAIFeedback } from './utils/test-helpers';

test.describe('AI Communication Training Screen', () => {
  test.beforeEach(async ({ page }) => {
    await mockAPIResponses(page);
    await loginAsUser(page, 'manager');
  });

  test('should display automated response settings', async ({ page }) => {
    await page.goto('/ai-communication-training');
    
    // Wait for page to load
    await page.waitForSelector('[data-testid="communication-training-container"]');
    
    // Check automated response settings panel
    const settingsPanel = page.locator('[data-testid="automated-response-settings"]');
    await expect(settingsPanel).toBeVisible();
    
    // Test trigger configuration
    const triggerSelect = settingsPanel.locator('[data-testid="response-triggers"]');
    await expect(triggerSelect).toBeVisible();
    await triggerSelect.click();
    
    // Verify trigger options
    await expect(page.locator('text=After Hours')).toBeVisible();
    await expect(page.locator('text=Common Questions')).toBeVisible();
    await expect(page.locator('text=Maintenance Requests')).toBeVisible();
    
    // Test delay configuration
    const delaySlider = settingsPanel.locator('[data-testid="response-delay-slider"]');
    await expect(delaySlider).toBeVisible();
    
    // Test escalation rules
    const escalationRules = settingsPanel.locator('[data-testid="escalation-rules"]');
    await expect(escalationRules).toBeVisible();
  });

  test('should display and interact with scenario review cards', async ({ page }) => {
    await page.goto('/ai-communication-training');
    
    // Wait for scenarios to load
    await waitForAIContent(page, '[data-testid="scenario-review-section"]');
    
    // Check scenario cards
    const scenarioCard = page.locator('[data-testid="scenario-card"]').first();
    await expect(scenarioCard).toBeVisible();
    
    // Expand scenario card
    const expandButton = scenarioCard.locator('[data-testid="expand-scenario"]');
    await expandButton.click();
    
    // Check AI suggestion content
    const aiSuggestion = scenarioCard.locator('[data-testid="ai-suggestion"]');
    await expect(aiSuggestion).toBeVisible();
    
    // Test action buttons
    const approveButton = scenarioCard.locator('[data-testid="approve-suggestion"]');
    const editButton = scenarioCard.locator('[data-testid="edit-suggestion"]');
    const rejectButton = scenarioCard.locator('[data-testid="reject-suggestion"]');
    
    await expect(approveButton).toBeVisible();
    await expect(editButton).toBeVisible();
    await expect(rejectButton).toBeVisible();
    
    // Test approve action
    await approveButton.click();
    await expect(scenarioCard).toHaveClass(/approved/);
  });

  test('should configure tone and style settings', async ({ page }) => {
    await page.goto('/ai-communication-training');
    
    // Wait for tone style section
    const toneStyleSection = page.locator('[data-testid="tone-style-configuration"]');
    await expect(toneStyleSection).toBeVisible();
    
    // Test tone selection
    const formalTone = toneStyleSection.locator('[data-testid="tone-formal"]');
    const friendlyTone = toneStyleSection.locator('[data-testid="tone-friendly"]');
    const casualTone = toneStyleSection.locator('[data-testid="tone-casual"]');
    
    await expect(formalTone).toBeVisible();
    await expect(friendlyTone).toBeVisible();
    await expect(casualTone).toBeVisible();
    
    // Select friendly tone
    await friendlyTone.click();
    await expect(friendlyTone).toBeChecked();
    
    // Test style selection
    const conciseStyle = toneStyleSection.locator('[data-testid="style-concise"]');
    const detailedStyle = toneStyleSection.locator('[data-testid="style-detailed"]');
    const empatheticStyle = toneStyleSection.locator('[data-testid="style-empathetic"]');
    
    await expect(conciseStyle).toBeVisible();
    await expect(detailedStyle).toBeVisible();
    await expect(empatheticStyle).toBeVisible();
    
    // Select empathetic style
    await empatheticStyle.click();
    await expect(empatheticStyle).toBeChecked();
    
    // Check preview panel updates
    const previewPanel = page.locator('[data-testid="settings-preview"]');
    await expect(previewPanel).toContainText('Friendly');
    await expect(previewPanel).toContainText('Empathetic');
  });

  test('should display template approval workflow for approvers', async ({ page }) => {
    // Mock user with approver role
    await page.evaluate(() => {
      localStorage.setItem('user_role', 'approver');
    });
    
    await page.goto('/ai-communication-training');
    
    // Check template approval queue visibility
    const approvalQueue = page.locator('[data-testid="template-approval-queue"]');
    await expect(approvalQueue).toBeVisible();
    
    // Check pending templates
    const pendingTemplate = approvalQueue.locator('[data-testid="pending-template"]').first();
    await expect(pendingTemplate).toBeVisible();
    
    // Test template review modal
    const reviewButton = pendingTemplate.locator('[data-testid="review-template"]');
    await reviewButton.click();
    
    const reviewModal = page.locator('[data-testid="template-review-modal"]');
    await expect(reviewModal).toBeVisible();
    
    // Test approval actions
    const approveTemplateButton = reviewModal.locator('[data-testid="approve-template"]');
    const rejectTemplateButton = reviewModal.locator('[data-testid="reject-template"]');
    
    await expect(approveTemplateButton).toBeVisible();
    await expect(rejectTemplateButton).toBeVisible();
    
    // Test approval
    await approveTemplateButton.click();
    await expect(reviewModal).not.toBeVisible();
  });

  test('should be accessible via keyboard navigation', async ({ page }) => {
    await page.goto('/ai-communication-training');
    await page.waitForSelector('[data-testid="communication-training-container"]');
    
    // Test keyboard navigation through main elements
    await testKeyboardNavigation(page, '[data-testid="response-triggers"]', [
      '[data-testid="response-delay-slider"]',
      '[data-testid="escalation-rules"]',
      '[data-testid="tone-formal"]',
      '[data-testid="style-concise"]'
    ]);
  });

  test('should pass accessibility audit', async ({ page }) => {
    await page.goto('/ai-communication-training');
    await page.waitForSelector('[data-testid="communication-training-container"]');
    
    // Run accessibility check
    await checkAccessibility(page, {
      tags: ['wcag2a', 'wcag2aa', 'wcag21aa']
    });
  });

  test('should handle AI feedback interactions', async ({ page }) => {
    await page.goto('/ai-communication-training');
    await waitForAIContent(page, '[data-testid="scenario-review-section"]');
    
    // Test AI feedback on suggestions
    await testAIFeedback(page, '[data-testid="ai-suggestion"]');
  });

  test('should save and persist configuration changes', async ({ page }) => {
    await page.goto('/ai-communication-training');
    
    // Configure settings
    await page.locator('[data-testid="tone-friendly"]').click();
    await page.locator('[data-testid="style-empathetic"]').click();
    
    // Save settings
    const saveButton = page.locator('[data-testid="save-settings"]');
    await saveButton.click();
    
    // Verify save confirmation
    await expect(page.locator('[data-testid="save-confirmation"]')).toBeVisible();
    
    // Reload page and verify settings persist
    await page.reload();
    await page.waitForSelector('[data-testid="communication-training-container"]');
    
    await expect(page.locator('[data-testid="tone-friendly"]')).toBeChecked();
    await expect(page.locator('[data-testid="style-empathetic"]')).toBeChecked();
  });
});