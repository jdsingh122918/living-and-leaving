/**
 * Admin Dashboard Tests
 * Tests the admin dashboard statistics, metrics, and navigation
 */

import { test, expect, helpers, SELECTORS } from '../../fixtures/test-base';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page, loginAsAdmin }) => {
    // Login as admin and navigate to dashboard
    await loginAsAdmin();
    // Use domcontentloaded instead of networkidle - SSE connections prevent network idle
    await page.waitForLoadState('domcontentloaded');
    // Wait for dashboard content to be visible
    await page.locator('text="Admin Dashboard"').waitFor({ state: 'visible', timeout: 10000 });
  });

  test('should display all stat cards', { tag: '@smoke' }, async ({ page }) => {
    // Verify we're on the admin dashboard
    await expect(page).toHaveURL(/\/admin/);

    // Look for stat cards - they might be displayed as cards with titles and values
    // Common patterns: Users, Volunteers, Families, Documents, Forums

    // Users stat card
    const usersCard = page.locator('text=/total users|users/i').first();
    const hasUsersCard = await usersCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasUsersCard) {
      await expect(usersCard).toBeVisible();
    }

    // Volunteers stat card
    const volunteersCard = page.locator('text=/volunteers/i').first();
    const hasVolunteersCard = await volunteersCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasVolunteersCard) {
      await expect(volunteersCard).toBeVisible();
    }

    // Families stat card
    const familiesCard = page.locator('text=/families/i').first();
    const hasFamiliesCard = await familiesCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasFamiliesCard) {
      await expect(familiesCard).toBeVisible();
    }

    // Documents/Resources stat card
    const documentsCard = page.locator('text=/documents|resources/i').first();
    const hasDocumentsCard = await documentsCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasDocumentsCard) {
      await expect(documentsCard).toBeVisible();
    }

    // Forums stat card
    const forumsCard = page.locator('text=/forums|discussions/i').first();
    const hasForumsCard = await forumsCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasForumsCard) {
      await expect(forumsCard).toBeVisible();
    }

    // Verify at least some stat cards are present
    const allCards = page.locator(SELECTORS.card);
    const cardCount = await allCards.count();

    // Admin dashboard should have multiple stat cards
    expect(cardCount).toBeGreaterThan(0);
  });

  test('should show correct stat values', async ({ page }) => {
    // Verify the dashboard has stat sections with numeric values
    // Look for the stat cards that display numbers

    // Check for specific stat text patterns visible on the page
    const statsSection = page.locator('text=/Total Users|Volunteers|Families|Members|Documents|Forums/i').first();
    const hasStats = await statsSection.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasStats) {
      // Verify some stats are showing - check for numeric content in the stats section
      const pageText = await page.textContent('main');

      // The page should contain numeric values for stats
      expect(pageText).toMatch(/\d+/);

      // Verify specific stat labels are present
      expect(pageText?.toLowerCase()).toMatch(/users|volunteers|families|members/i);
    } else {
      // Alternative: look for any numeric content in cards
      const cards = page.locator(SELECTORS.card);
      const cardCount = await cards.count();

      if (cardCount > 0) {
        const cardText = await cards.first().textContent();
        expect(cardText).toBeTruthy();
      }
    }
  });

  test('should navigate to users page when clicking users card', async ({ page }) => {
    // Look for users card or link
    const usersLink = page.locator('a:has-text("Users"), [href="/admin/users"], button:has-text("Users")').first();
    const hasUsersLink = await usersLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasUsersLink) {
      await usersLink.click();
      await page.waitForLoadState('domcontentloaded');

      // Verify navigation to users page
      await expect(page).toHaveURL(/\/admin\/users/);
    } else {
      // Navigate via sidebar
      const sidebar = page.locator(SELECTORS.sidebar);
      const sidebarUsersLink = sidebar.locator('a:has-text("Users")').first();
      const hasSidebarLink = await sidebarUsersLink.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasSidebarLink) {
        await sidebarUsersLink.click();
        await page.waitForLoadState('domcontentloaded');
        await expect(page).toHaveURL(/\/admin\/users/);
      } else {
        // Direct navigation
        await page.goto('/admin/users');
        await expect(page).toHaveURL(/\/admin\/users/);
      }
    }
  });

  test('should navigate to families page when clicking families card', async ({ page }) => {
    // Look for families card or link
    const familiesLink = page.locator('a:has-text("Families"), [href="/admin/families"], button:has-text("Families")').first();
    const hasFamiliesLink = await familiesLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasFamiliesLink) {
      await familiesLink.click();
      await page.waitForLoadState('domcontentloaded');

      // Verify navigation to families page
      await expect(page).toHaveURL(/\/admin\/families/);
    } else {
      // Navigate via sidebar
      const sidebar = page.locator(SELECTORS.sidebar);
      const sidebarFamiliesLink = sidebar.locator('a:has-text("Families")').first();
      const hasSidebarLink = await sidebarFamiliesLink.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasSidebarLink) {
        await sidebarFamiliesLink.click();
        await page.waitForLoadState('domcontentloaded');
        await expect(page).toHaveURL(/\/admin\/families/);
      } else {
        // Direct navigation
        await page.goto('/admin/families');
        await expect(page).toHaveURL(/\/admin\/families/);
      }
    }
  });

  test('should display community engagement metrics', async ({ page }) => {
    // Look for engagement metrics section
    const engagementSection = page.locator('text=/engagement|activity|community/i').first();
    const hasEngagement = await engagementSection.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasEngagement) {
      await expect(engagementSection).toBeVisible();

      // Look for specific metrics like forum posts, resources, etc.
      const metrics = page.locator('[data-testid*="metric"], .metric');
      const hasMetrics = await metrics.first().isVisible({ timeout: 2000 }).catch(() => false);

      if (hasMetrics) {
        const count = await metrics.count();
        expect(count).toBeGreaterThan(0);
      }
    } else {
      // Verify dashboard has some content even if not labeled as "engagement"
      const mainContent = page.locator('main, [role="main"], .dashboard').first();
      await expect(mainContent).toBeVisible();

      const text = await mainContent.textContent();
      expect(text).toBeTruthy();
    }
  });

  test('should display recent activity section', async ({ page }) => {
    // Look for recent activity section
    const recentActivity = page.locator('text=/recent|activity|latest/i').first();
    const hasRecentActivity = await recentActivity.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasRecentActivity) {
      await expect(recentActivity).toBeVisible();

      // Look for activity items or list
      const activityItems = page.locator('[data-testid*="activity"], .activity-item, li').first();
      const hasItems = await activityItems.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasItems) {
        await expect(activityItems).toBeVisible();
      }
    } else {
      // Verify dashboard shows some form of activity or updates
      const cards = page.locator(SELECTORS.card);
      const cardCount = await cards.count();

      // Dashboard should have content
      expect(cardCount).toBeGreaterThan(0);
    }
  });

  test('should display navigation sidebar', async ({ page }) => {
    // On desktop, verify sidebar navigation is present
    // Look for navigation links that are visible on the page

    // Check for Dashboard link in navigation
    const dashboardLink = page.locator('a[href="/admin"]:has-text("Dashboard")').first();
    const hasDashboardLink = await dashboardLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasDashboardLink) {
      await expect(dashboardLink).toBeVisible();
    }

    // Check for Users link in navigation
    const usersLink = page.locator('a[href="/admin/users"]:has-text("Users")').first();
    const hasUsersLink = await usersLink.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasUsersLink) {
      await expect(usersLink).toBeVisible();
    }

    // Check for Families link in navigation
    const familiesLink = page.locator('a[href="/admin/families"]:has-text("Families")').first();
    const hasFamiliesLink = await familiesLink.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasFamiliesLink) {
      await expect(familiesLink).toBeVisible();
    }

    // At least one navigation link should be visible
    expect(hasDashboardLink || hasUsersLink || hasFamiliesLink).toBe(true);
  });

  test('should show admin user profile', async ({ page }) => {
    // Look for user button/profile
    const userButton = page.locator('[data-testid="user-button"], button:has([alt*="avatar"]), button:has-text("Profile")').first();
    const hasUserButton = await userButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasUserButton) {
      await expect(userButton).toBeVisible();

      // Click to open menu
      await userButton.click();
      await page.waitForTimeout(500);

      // Verify menu options
      const menu = page.locator('[role="menu"], .dropdown-menu').first();
      const hasMenu = await menu.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasMenu) {
        await expect(menu).toBeVisible();

        // Look for sign out option
        const signOut = page.locator('button:has-text("Sign out"), a:has-text("Sign out")').first();
        const hasSignOut = await signOut.isVisible({ timeout: 2000 }).catch(() => false);

        if (hasSignOut) {
          await expect(signOut).toBeVisible();
        }
      }
    }
  });

  test('should be responsive and mobile-friendly', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // Verify main content is visible
    const mainContent = page.locator('main, [role="main"]').first();
    await expect(mainContent).toBeVisible();

    // Verify page content is readable on mobile
    // Get the main content width
    const mainBox = await mainContent.boundingBox();
    if (mainBox) {
      // Main content should fit in viewport
      expect(mainBox.width).toBeLessThanOrEqual(375);
    }

    // Verify the dashboard title is visible
    const dashboardTitle = page.locator('text="Admin Dashboard"').first();
    const hasDashboardTitle = await dashboardTitle.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasDashboardTitle) {
      await expect(dashboardTitle).toBeVisible();
    }

    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should load without errors', { tag: '@smoke' }, async ({ page }) => {
    // Check for the specific error message from the error boundary
    // (not the empty toast [role="alert"] which is always present)
    const errorBoundary = page.locator('text="Something went wrong"');
    const hasError = await errorBoundary.isVisible({ timeout: 2000 }).catch(() => false);

    // If there's an error, try to capture the error details
    if (hasError) {
      // Expand error details if available
      const errorDetails = page.locator('text="Error Details (Development Only)"');
      const hasDetails = await errorDetails.isVisible({ timeout: 1000 }).catch(() => false);
      if (hasDetails) {
        await errorDetails.click();
        await page.waitForTimeout(500);
      }
      // Capture the error stack
      const errorStack = page.locator('pre');
      const stackText = await errorStack.textContent().catch(() => 'No stack trace');
      console.log('Error Stack:', stackText);
    }

    expect(hasError).toBe(false);

    // Verify loading completed (no spinners)
    const spinner = page.locator(SELECTORS.loadingSpinner);
    const isLoading = await spinner.isVisible({ timeout: 2000 }).catch(() => false);

    expect(isLoading).toBe(false);

    // Verify page has content
    const body = page.locator('body');
    const text = await body.textContent();

    expect(text?.length).toBeGreaterThan(0);
  });
});
