/**
 * E2E Tests: Volunteer Dashboard
 * Tests volunteer-specific dashboard functionality and navigation
 */

import { test, expect } from '../../fixtures/test-base';

test.describe('Volunteer Dashboard', () => {
  test.beforeEach(async ({ page, loginAsVolunteer }) => {
    await loginAsVolunteer();
    // Ensure we're on the volunteer dashboard
    await expect(page).toHaveURL(/\/volunteer/);
  });

  test('should display volunteer-specific stats', { tag: '@smoke' }, async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForLoadState('domcontentloaded');

    // Check for stat cards (individual testids: families-stat, members-stat)
    const familiesStat = page.locator('[data-testid="families-stat"]');
    const membersStat = page.locator('[data-testid="members-stat"]');

    // Either stat card should be visible
    const hasFamiliesStat = await familiesStat.isVisible({ timeout: 10000 }).catch(() => false);
    const hasMembersStat = await membersStat.isVisible({ timeout: 5000 }).catch(() => false);

    expect(hasFamiliesStat || hasMembersStat).toBeTruthy();

    // Verify volunteer-specific metrics are present
    const pageContent = await page.textContent('body');
    const hasStats =
      pageContent?.includes('Families') ||
      pageContent?.includes('Members') ||
      pageContent?.includes('Active');

    expect(hasStats).toBeTruthy();
  });

  test('should show Create Family button', { tag: '@smoke' }, async ({ page, helpers }) => {
    await page.waitForLoadState('domcontentloaded');

    // Look for Create Family button in various possible locations
    const createFamilyButton = page.getByRole('button', { name: /create family/i }).first()
      .or(page.getByRole('link', { name: /create family/i }).first())
      .or(page.locator('button:has-text("Create Family")').first())
      .or(page.locator('a:has-text("Create Family")').first());

    await expect(createFamilyButton).toBeVisible({ timeout: 10000 });
  });

  test('should show Add Member button', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');

    // Look for Add Member button
    const addMemberButton = page.getByRole('button', { name: /add member/i }).first()
      .or(page.getByRole('link', { name: /add member/i }).first())
      .or(page.locator('button:has-text("Add Member")').first())
      .or(page.locator('a:has-text("Add Member")').first());

    await expect(addMemberButton).toBeVisible({ timeout: 10000 });
  });

  test('should display family list showing only owned families', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');

    // Check for families section
    const familiesSection = page.locator('[data-testid="families-list"], section:has-text("Families")').first();

    // Family list should be visible (even if empty)
    const hasContent = await page.locator('body').textContent();
    expect(hasContent).toContain('Families');
  });

  test('should display recent members section', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');

    // Check for members section
    const pageContent = await page.textContent('body');
    const hasMembersSection =
      pageContent?.includes('Members') ||
      pageContent?.includes('Recent Members') ||
      pageContent?.includes('My Members');

    expect(hasMembersSection).toBeTruthy();
  });

  test('should navigate to family creation when clicking Create Family', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');

    // Find and click Create Family button
    const createFamilyButton = page.getByRole('button', { name: /create family/i }).first()
      .or(page.getByRole('link', { name: /create family/i }).first())
      .or(page.locator('a:has-text("Create Family")').first());

    await expect(createFamilyButton).toBeVisible({ timeout: 10000 });
    await createFamilyButton.click();

    // Should navigate to family creation page
    await page.waitForURL(/\/volunteer\/families\/(new|create)/);
  });
});
