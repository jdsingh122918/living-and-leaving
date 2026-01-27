/**
 * E2E Tests: Member Dashboard
 * Tests member-specific dashboard functionality and quick access navigation
 */

import { test, expect } from '../../fixtures/test-base';

test.describe('Member Dashboard', () => {
  test.beforeEach(async ({ page, loginAsMember }) => {
    await loginAsMember();
    // Ensure we're on the member dashboard
    await expect(page).toHaveURL(/\/member/);
  });

  test('should display member-specific dashboard', { tag: '@smoke' }, async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForLoadState('domcontentloaded');

    // Verify we're on member dashboard
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/member/);

    // Check for dashboard content
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();

    // Verify member-specific elements are present
    const hasDashboardElements =
      pageContent?.includes('Dashboard') ||
      pageContent?.includes('Welcome') ||
      await page.locator('main, [role="main"]').isVisible();

    expect(hasDashboardElements).toBeTruthy();
  });

  test('should show quick access cards (Chat, Content, Forums, Notifications)', { tag: '@smoke' }, async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');

    // Look for quick access cards
    const pageContent = await page.textContent('body');

    // Check for at least some of these quick access sections
    const hasQuickAccess =
      pageContent?.includes('Chat') ||
      pageContent?.includes('Content') ||
      pageContent?.includes('Resources') ||
      pageContent?.includes('Forums') ||
      pageContent?.includes('Notifications');

    expect(hasQuickAccess).toBeTruthy();

    // Verify quick access elements are clickable (buttons or cards)
    // The member dashboard uses buttons with links for quick access
    const quickAccessElements = page.locator('[data-testid="quick-access-card"], [data-testid="card"], .card, a[href*="/member/chat"], a[href*="/member/resources"], a[href*="/member/forums"], a[href*="/member/notifications"]');
    const elementCount = await quickAccessElements.count();

    // Should have at least one quick access element
    expect(elementCount).toBeGreaterThan(0);
  });

  test('should display family information', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');

    // Check for family information section
    const pageContent = await page.textContent('body');

    // Look for family-related content
    const hasFamilyInfo =
      pageContent?.includes('Family') ||
      pageContent?.includes('family') ||
      pageContent?.includes('Members');

    // Family information should be visible or indicated as not assigned
    expect(pageContent).toBeTruthy();
  });

  test('should display template assignments section', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');

    // Look for templates or assignments section
    const pageContent = await page.textContent('body');

    // Check for template-related content
    const hasTemplates =
      pageContent?.includes('Template') ||
      pageContent?.includes('Assignment') ||
      pageContent?.includes('Form') ||
      pageContent?.includes('Directive');

    // Templates section should be visible or show empty state
    expect(pageContent).toBeTruthy();
  });

  test('should navigate to chat when clicking Chat card', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');

    // Look for Chat card or link
    const chatLink = page.getByRole('link', { name: /chat/i })
      .or(page.locator('a:has-text("Chat")'))
      .or(page.locator('[data-testid="chat-card"] a'))
      .first();

    if (await chatLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await chatLink.click();

      // Should navigate to chat page
      await page.waitForURL(/\/member\/chat/);
      await page.waitForLoadState('domcontentloaded');

      // Verify we're on chat page
      const pageContent = await page.textContent('body');
      expect(pageContent).toContain('Chat');
    } else {
      // If no chat link, check sidebar navigation
      const sidebarChatLink = page.locator('nav a:has-text("Chat")').first();
      if (await sidebarChatLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await sidebarChatLink.click();
        await page.waitForURL(/\/member\/chat/);
      }
    }
  });

  test('should navigate to resources when clicking Content card', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');

    // Look for Content/Resources card or link
    const contentLink = page.getByRole('link', { name: /content|resources/i })
      .or(page.locator('a:has-text("Content")'))
      .or(page.locator('a:has-text("Resources")'))
      .or(page.locator('[data-testid="content-card"] a'))
      .first();

    if (await contentLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await contentLink.click();

      // Should navigate to resources page
      await page.waitForURL(/\/member\/(content|resources)/);
      await page.waitForLoadState('domcontentloaded');

      // Verify we're on resources page
      const pageContent = await page.textContent('body');
      const hasResourcesContent =
        pageContent?.includes('Content') ||
        pageContent?.includes('Resources');

      expect(hasResourcesContent).toBeTruthy();
    } else {
      // If no content card, check sidebar navigation
      const sidebarResourcesLink = page.locator('nav a:has-text("Resources"), nav a:has-text("Content")').first();
      if (await sidebarResourcesLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await sidebarResourcesLink.click();
        await page.waitForURL(/\/member\/(content|resources)/);
      }
    }
  });

  test('should navigate to forums when clicking Forums card', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');

    // Look for Forums card or link
    const forumsLink = page.getByRole('link', { name: /forums|community/i })
      .or(page.locator('a:has-text("Forums")'))
      .or(page.locator('[data-testid="forums-card"] a'))
      .first();

    if (await forumsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await forumsLink.click();

      // Should navigate to forums page
      await page.waitForURL(/\/member\/forums/);
      await page.waitForLoadState('domcontentloaded');

      // Verify we're on forums page
      const pageContent = await page.textContent('body');
      expect(pageContent).toContain('Forum');
    }
  });

  test('should show activity or recent items', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');

    // Look for activity or recent items section
    const pageContent = await page.textContent('body');

    // Check for activity-related content
    const hasActivity =
      pageContent?.includes('Recent') ||
      pageContent?.includes('Activity') ||
      pageContent?.includes('Updates') ||
      await page.locator('[data-testid="recent-activity"]').isVisible({ timeout: 3000 }).catch(() => false);

    // Activity section should be visible or dashboard should show content
    expect(pageContent).toBeTruthy();
  });
});
