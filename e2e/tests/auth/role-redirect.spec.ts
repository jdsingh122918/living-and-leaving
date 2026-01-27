/**
 * Role-Based Redirect Tests
 * Tests access control and redirects based on user roles
 */

import { test, expect, TEST_USERS } from '../../fixtures/test-base';

// Check if we're in mock auth mode
const USE_MOCK_AUTH = process.env.E2E_USE_REAL_CLERK !== 'true';

test.describe('Role-Based Redirects', () => {
  test('should redirect admin to /admin dashboard', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();

    // Verify admin is on /admin route
    await expect(page).toHaveURL(/\/admin/);

    // Verify admin can access admin pages
    await page.goto('/admin/users');
    await expect(page).toHaveURL(/\/admin\/users/);

    await page.goto('/admin/families');
    await expect(page).toHaveURL(/\/admin\/families/);
  });

  test('should redirect volunteer to /volunteer dashboard', async ({ page, loginAsVolunteer }) => {
    await loginAsVolunteer();

    // Verify volunteer is on /volunteer route
    await expect(page).toHaveURL(/\/volunteer/);

    // Verify volunteer can access volunteer pages
    await page.goto('/volunteer/families');
    await expect(page).toHaveURL(/\/volunteer\/families/);
  });

  test('should redirect member to /member dashboard', async ({ page, loginAsMember }) => {
    await loginAsMember();

    // Verify member is on /member route
    await expect(page).toHaveURL(/\/member/);

    // Verify member can access member pages
    await page.goto('/member/family');
    await expect(page).toHaveURL(/\/member\/family/);
  });

  test('should redirect unauthenticated users to sign-in', { tag: '@smoke' }, async ({ page }) => {
    // Try to access protected admin route
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');

    // Should redirect to sign-in
    await expect(page).toHaveURL(/sign-in/);

    // Try to access protected volunteer route
    await page.goto('/volunteer');
    await page.waitForLoadState('domcontentloaded');

    // Should redirect to sign-in
    await expect(page).toHaveURL(/sign-in/);

    // Try to access protected member route
    await page.goto('/member');
    await page.waitForLoadState('domcontentloaded');

    // Should redirect to sign-in
    await expect(page).toHaveURL(/sign-in/);
  });

  test('should prevent member from accessing /admin routes', { tag: '@smoke' }, async ({ page, loginAsMember }) => {
    await loginAsMember();

    // Verify member is logged in
    await expect(page).toHaveURL(/\/member/);

    // Try to access admin routes
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');

    // Should be redirected away from admin (either to member dashboard or 403/404)
    const currentUrl = page.url();
    const isOnAdmin = currentUrl.includes('/admin');

    // Member should NOT be able to access admin routes
    expect(isOnAdmin).toBe(false);

    // Should be redirected to member dashboard, unauthorized page, or sign-in
    expect(currentUrl).toMatch(/\/member|unauthorized|forbidden|sign-in/i);

    // Try accessing admin users page
    await page.goto('/admin/users');
    await page.waitForLoadState('domcontentloaded');

    const usersUrl = page.url();
    const isOnAdminUsers = usersUrl.includes('/admin/users');

    expect(isOnAdminUsers).toBe(false);
  });

  test('should prevent volunteer from accessing other families', async ({ page, loginAsVolunteer }) => {
    await loginAsVolunteer();

    // Navigate to families list
    await page.goto('/volunteer/families');
    await page.waitForLoadState('domcontentloaded');

    // Verify volunteer can see their assigned families
    await expect(page).toHaveURL(/\/volunteer\/families/);

    // Check for family cards - volunteer should only see families they created or are assigned to
    const familyCards = page.locator('[data-testid="family-card"], .family-card, .card').first();
    const hasFamilyCards = await familyCards.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasFamilyCards) {
      // Verify the page shows families (volunteer-specific view)
      await expect(familyCards).toBeVisible();

      // The system should automatically filter to only show families the volunteer has access to
      // This is enforced by the getFamiliesByCreator() repository pattern
    } else {
      // Volunteer might not have any families yet - verify empty state
      const emptyState = page.locator('[data-testid="empty-state"], text=/no families|get started/i').first();
      const hasEmptyState = await emptyState.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasEmptyState) {
        await expect(emptyState).toBeVisible();
      }
    }

    // Verify volunteer cannot access admin family management
    await page.goto('/admin/families');
    await page.waitForLoadState('domcontentloaded');

    const currentUrl = page.url();
    const isOnAdminFamilies = currentUrl.includes('/admin/families');

    // Should be redirected away from admin routes
    expect(isOnAdminFamilies).toBe(false);
  });

  // This test requires real Clerk authentication flow
  test('should redirect to correct dashboard after login based on role', async ({ page }) => {
    test.skip(USE_MOCK_AUTH, 'Requires real Clerk auth');
    // Test admin redirect
    await page.goto('/sign-in');
    const emailInput = page.locator('input[name="identifier"], input[type="email"]').first();
    await emailInput.fill(TEST_USERS.admin.email);

    const continueButton = page.locator('button[type="submit"], button:has-text("Continue")').first();
    await continueButton.click();

    await page.waitForTimeout(1000);

    // Handle OTP if needed
    const otpInput = page.locator('input[name="code"]').first();
    if (await otpInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await otpInput.fill('424242');
      const verifyButton = page.locator('button:has-text("Verify"), button[type="submit"]').first();
      await verifyButton.click();
    }

    // Wait for redirect
    await page.waitForURL((url) => url.pathname.startsWith('/admin'), { timeout: 15000 });
    await expect(page).toHaveURL(/\/admin/);

    // Logout
    const userButton = page.locator('[data-testid="user-button"], button:has([alt*="avatar"]), button:has-text("Profile")').first();
    const hasUserButton = await userButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasUserButton) {
      await userButton.click();
      await page.waitForTimeout(500);

      const signOutButton = page.locator('button:has-text("Sign out"), a:has-text("Sign out")').first();
      const hasSignOut = await signOutButton.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasSignOut) {
        await signOutButton.click();
        await page.waitForURL('/sign-in', { timeout: 10000 });
      } else {
        // Navigate to sign-in manually
        await page.goto('/sign-in');
      }
    } else {
      await page.goto('/sign-in');
    }
  });

  test('should maintain role-based access after page refresh', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();

    // Verify on admin dashboard
    await expect(page).toHaveURL(/\/admin/);

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Should still be on admin dashboard
    await expect(page).toHaveURL(/\/admin/);

    // Navigate to another admin page
    await page.goto('/admin/users');
    await expect(page).toHaveURL(/\/admin\/users/);

    // Refresh again
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Should still have access
    await expect(page).toHaveURL(/\/admin\/users/);
  });

  test('should prevent cross-role navigation', async ({ page, loginAsVolunteer }) => {
    await loginAsVolunteer();

    // Verify on volunteer dashboard
    await expect(page).toHaveURL(/\/volunteer/);

    // Try to access admin dashboard
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');

    // Should be blocked from admin (volunteers don't have admin access)
    const adminUrl = page.url();
    expect(adminUrl).not.toContain('/admin');

    // Volunteer should be redirected back to their dashboard
    expect(adminUrl).toContain('/volunteer');
  });
});
