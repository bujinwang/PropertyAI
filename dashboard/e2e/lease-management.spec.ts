import { test, expect } from '@playwright/test';

test.describe('Lease Management', () => {
  test('should associate lease to tenant and unit', async ({ page }) => {
    // Navigate to leases page
    await page.goto('/leases');

    // Wait for leases to load
    await page.waitForSelector('[data-testid="leases-table"]');

    // Click associate button on first lease
    await page.click('[data-testid="associate-lease-0"]');

    // Wait for modal to open
    await page.waitForSelector('[data-testid="association-modal"]');

    // Select tenant
    await page.click('[data-testid="tenant-select"]');
    await page.click('[data-testid="tenant-option-0"]');

    // Select unit
    await page.click('[data-testid="unit-select"]');
    await page.click('[data-testid="unit-option-0"]');

    // Submit association
    await page.click('[data-testid="associate-submit"]');

    // Wait for success message
    await page.waitForSelector('[data-testid="success-snackbar"]');
    expect(await page.textContent('[data-testid="success-snackbar"]')).toContain('Lease associated successfully');

    // Verify lease status updated
    await page.waitForSelector('[data-testid="lease-status-active"]');
  });

  test('should renew lease with confirmation', async ({ page }) => {
    // Navigate to lease detail
    await page.goto('/leases/lease-1');

    // Click renew button
    await page.click('[data-testid="renew-lease"]');

    // Wait for modal to open
    await page.waitForSelector('[data-testid="renewal-modal"]');

    // Set new end date
    await page.fill('[data-testid="new-end-date"]', '2024-12-31');

    // Submit renewal
    await page.click('[data-testid="renew-submit"]');

    // Wait for confirmation dialog
    await page.waitForSelector('[data-testid="renewal-confirmation"]');

    // Confirm renewal
    await page.click('[data-testid="confirm-renewal"]');

    // Wait for success message
    await page.waitForSelector('[data-testid="success-snackbar"]');
    expect(await page.textContent('[data-testid="success-snackbar"]')).toContain('Lease renewed successfully');
  });

  test('should track payment history in lease detail', async ({ page }) => {
    // Navigate to lease detail
    await page.goto('/leases/lease-1');

    // Switch to payments tab
    await page.click('[data-testid="payments-tab"]');

    // Wait for payments table to load
    await page.waitForSelector('[data-testid="payments-table"]');

    // Verify payment data is displayed
    await page.waitForSelector('[data-testid="payment-amount"]');
    expect(await page.textContent('[data-testid="payment-amount"]')).toContain('$1,500');

    // Mark a payment as paid
    await page.click('[data-testid="mark-paid-button"]');

    // Wait for success message
    await page.waitForSelector('[data-testid="success-snackbar"]');
    expect(await page.textContent('[data-testid="success-snackbar"]')).toContain('Payment marked as paid');
  });

  test('should show lease information in tenant detail', async ({ page }) => {
    // Navigate to tenant detail
    await page.goto('/tenants/tenant-1');

    // Switch to leases tab
    await page.click('[data-testid="leases-tab"]');

    // Wait for leases table to load
    await page.waitForSelector('[data-testid="tenant-leases-table"]');

    // Verify lease data is displayed
    await page.waitForSelector('[data-testid="lease-rent-amount"]');
    expect(await page.textContent('[data-testid="lease-rent-amount"]')).toContain('$1,500');
  });

  test('should display lease info in property tenant section', async ({ page }) => {
    // Navigate to property detail
    await page.goto('/properties/property-1');

    // Switch to tenants tab
    await page.click('[data-testid="tenants-tab"]');

    // Wait for tenants table to load
    await page.waitForSelector('[data-testid="property-tenants-table"]');

    // Verify lease information is displayed
    await page.waitForSelector('[data-testid="tenant-lease-status"]');
    expect(await page.textContent('[data-testid="tenant-lease-status"]')).toContain('active');
  });
});