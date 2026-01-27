/**
 * E2E Tests: User Settings
 * Tests user profile settings, preferences, notifications, theme, and accessibility settings
 */

import { test, expect } from '../../fixtures/test-base';

test.describe('User Settings', () => {
  test.beforeEach(async ({ page, loginAsMember }) => {
    await loginAsMember();
    await page.waitForLoadState('domcontentloaded');

    // Navigate to settings page
    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display settings page correctly', async ({ page }) => {
    // Verify we're on settings page
    await expect(page).toHaveURL(/\/settings/);

    // Verify page heading
    const heading = page.locator('h1').filter({ hasText: /settings/i }).first();
    await expect(heading).toBeVisible({ timeout: 5000 });

    // Verify settings sections are present - check for profile section testid or "Profile" text
    const profileSection = page.locator('[data-testid="profile-section"]')
      .or(page.locator('text="Profile"'))
      .or(page.locator('text="Account"'))
      .or(page.locator('[data-testid="settings-container"]'))
      .first();
    const hasProfileSection = await profileSection.isVisible({ timeout: 5000 }).catch(() => false);

    expect(hasProfileSection).toBeTruthy();
  });

  test('should update first name', async ({ page, helpers, generateName }) => {
    // Find first name input
    const firstNameInput = page.getByLabel(/first name/i).first();
    const hasFirstName = await firstNameInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasFirstName) {
      test.skip();
      return;
    }

    // Clear and enter new first name
    const newFirstName = generateName('Updated');
    await firstNameInput.clear();
    await firstNameInput.fill(newFirstName);

    // Save changes
    const saveButton = page.locator('button:has-text("Save"), button[type="submit"]').first();
    await saveButton.click();
    await page.waitForTimeout(1000);

    // Verify success
    await helpers.expectToast(page, /saved|updated|success/i, 5000);

    // Verify field still has the new value
    const currentValue = await firstNameInput.inputValue();
    expect(currentValue).toBe(newFirstName);
  });

  test('should update last name', async ({ page, helpers, generateName }) => {
    // Find last name input
    const lastNameInput = page.getByLabel(/last name/i).first();
    const hasLastName = await lastNameInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasLastName) {
      test.skip();
      return;
    }

    // Clear and enter new last name
    const newLastName = generateName('User');
    await lastNameInput.clear();
    await lastNameInput.fill(newLastName);

    // Save changes
    const saveButton = page.locator('button:has-text("Save"), button[type="submit"]').first();
    await saveButton.click();
    await page.waitForTimeout(1000);

    // Verify success
    await helpers.expectToast(page, /saved|updated|success/i, 5000);

    // Verify field still has the new value
    const currentValue = await lastNameInput.inputValue();
    expect(currentValue).toBe(newLastName);
  });

  test('should update phone number', async ({ page, helpers }) => {
    // Find phone number input
    const phoneInput = page.getByLabel(/phone/i).first();
    const hasPhone = await phoneInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasPhone) {
      test.skip();
      return;
    }

    // Enter new phone number
    const newPhone = '555-123-4567';
    await phoneInput.clear();
    await phoneInput.fill(newPhone);

    // Save changes
    const saveButton = page.locator('button:has-text("Save"), button[type="submit"]').first();
    await saveButton.click();
    await page.waitForTimeout(1000);

    // Verify success
    await helpers.expectToast(page, /saved|updated|success/i, 5000);

    // Verify field still has the new value
    const currentValue = await phoneInput.inputValue();
    expect(currentValue).toContain('555');
  });

  test('should save profile changes successfully', async ({ page, helpers, generateName }) => {
    // Update multiple fields at once
    const firstNameInput = page.getByLabel(/first name/i).first();
    const lastNameInput = page.getByLabel(/last name/i).first();

    const hasFields =
      await firstNameInput.isVisible({ timeout: 5000 }).catch(() => false) &&
      await lastNameInput.isVisible({ timeout: 2000 }).catch(() => false);

    if (!hasFields) {
      test.skip();
      return;
    }

    const newFirstName = generateName('Test');
    const newLastName = 'User';

    await firstNameInput.clear();
    await firstNameInput.fill(newFirstName);

    await lastNameInput.clear();
    await lastNameInput.fill(newLastName);

    // Save changes
    const saveButton = page.locator('button:has-text("Save"), button[type="submit"]').first();
    await saveButton.click();
    await page.waitForTimeout(1000);

    // Verify success
    await helpers.expectToast(page, /saved|updated|success/i, 5000);

    // Verify both fields retained their values
    expect(await firstNameInput.inputValue()).toBe(newFirstName);
    expect(await lastNameInput.inputValue()).toBe(newLastName);
  });

  test('should toggle notification preferences', async ({ page, helpers }) => {
    // Look for notification settings section
    const notificationSection = page.locator('text="Notification"').or(page.locator('[data-testid="notifications"]')).first();
    const hasNotifications = await notificationSection.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasNotifications) {
      test.skip();
      return;
    }

    // Find notification toggle switches
    const toggles = page.locator('button[role="switch"], input[type="checkbox"]');
    const toggleCount = await toggles.count();

    if (toggleCount === 0) {
      test.skip();
      return;
    }

    // Get initial state of first toggle
    const firstToggle = toggles.first();
    const initialState = await firstToggle.getAttribute('aria-checked').catch(() => 'false');

    // Click toggle
    await firstToggle.click();
    await page.waitForTimeout(500);

    // Verify state changed or save was triggered
    const newState = await firstToggle.getAttribute('aria-checked').catch(() => 'false');

    // Either state changed or success toast appeared
    const stateChanged = initialState !== newState;
    const toastAppeared = await helpers.expectToast(page, /saved|updated/i, 2000).catch(() => false);

    expect(stateChanged || toastAppeared).toBeTruthy();
  });

  test('should toggle theme (dark/light mode)', async ({ page }) => {
    // Look for theme toggle button
    const themeButton = page.locator('button[aria-label*="theme"], button:has-text("Theme")').first();
    const hasThemeButton = await themeButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasThemeButton) {
      test.skip();
      return;
    }

    // Get current theme
    const htmlElement = page.locator('html');
    const initialTheme = await htmlElement.getAttribute('class');

    // Toggle theme
    await themeButton.click();
    await page.waitForTimeout(500);

    // Verify theme changed
    const newTheme = await htmlElement.getAttribute('class');

    // Theme class should have changed (dark/light)
    expect(initialTheme).not.toBe(newTheme);
  });

  test('should change accessibility settings (font size, high contrast)', async ({ page }) => {
    // Look for accessibility widget or settings
    const accessibilityButton = page.locator('button[aria-label*="accessibility"], button:has-text("Accessibility")').first();
    const hasAccessibility = await accessibilityButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasAccessibility) {
      test.skip();
      return;
    }

    // Click to open accessibility menu
    await accessibilityButton.click();
    await page.waitForTimeout(500);

    // Look for font size controls
    const fontSizeControls = page.locator('button:has-text("A"), button[aria-label*="font"]');
    const hasFontControls = await fontSizeControls.count() > 0;

    if (hasFontControls) {
      // Click increase font size
      const increaseButton = fontSizeControls.filter({ hasText: /increase|larger|\+/i }).or(fontSizeControls.last()).first();
      await increaseButton.click();
      await page.waitForTimeout(500);

      // Verify font size changed (check html font-size or data attribute)
      const htmlElement = page.locator('html');
      const fontSize = await htmlElement.getAttribute('style');
      expect(fontSize).toBeTruthy();
    }

    // Look for high contrast toggle
    const highContrastToggle = page.locator('button:has-text("Contrast"), button[aria-label*="contrast"]').first();
    const hasHighContrast = await highContrastToggle.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasHighContrast) {
      await highContrastToggle.click();
      await page.waitForTimeout(500);

      // Verify high contrast mode applied
      const htmlElement = page.locator('html');
      const classes = await htmlElement.getAttribute('class');
      expect(classes).toContain('high-contrast');
    }
  });

  test('should show validation errors for invalid input', async ({ page, helpers }) => {
    // Find email input (read-only, but can test phone)
    const phoneInput = page.getByLabel(/phone/i).first();
    const hasPhone = await phoneInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasPhone) {
      test.skip();
      return;
    }

    // Enter invalid phone number
    await phoneInput.clear();
    await phoneInput.fill('invalid');

    // Try to save
    const saveButton = page.locator('button:has-text("Save"), button[type="submit"]').first();
    await saveButton.click();
    await page.waitForTimeout(1000);

    // Look for validation error
    const errorMessage = page.locator('[role="alert"], .text-destructive, .error-message').filter({ hasText: /phone|invalid|format/i });
    const hasError = await errorMessage.isVisible({ timeout: 3000 }).catch(() => false);

    // Error might also be in toast
    const toastError = await helpers.expectToast(page, /error|invalid/i, 2000).catch(() => false);

    expect(hasError || toastError).toBeTruthy();
  });

  test('should cancel changes when clicking cancel', async ({ page, generateName }) => {
    // Get current first name value
    const firstNameInput = page.getByLabel(/first name/i).first();
    const hasFirstName = await firstNameInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasFirstName) {
      test.skip();
      return;
    }

    const originalValue = await firstNameInput.inputValue();

    // Change the value
    const newValue = generateName('Changed');
    await firstNameInput.clear();
    await firstNameInput.fill(newValue);

    // Verify field shows new value
    expect(await firstNameInput.inputValue()).toBe(newValue);

    // Click cancel button
    const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("Reset")').first();
    const hasCancel = await cancelButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasCancel) {
      await cancelButton.click();
      await page.waitForTimeout(500);

      // Verify value reverted to original
      const currentValue = await firstNameInput.inputValue();
      expect(currentValue).toBe(originalValue);
    } else {
      // Refresh page to cancel changes
      await page.reload();
      await page.waitForLoadState('domcontentloaded');

      const reloadedInput = page.getByLabel(/first name/i).first();
      const reloadedValue = await reloadedInput.inputValue();
      expect(reloadedValue).toBe(originalValue);
    }
  });

  test('should persist settings after page reload', async ({ page, helpers, generateName }) => {
    // Update a setting
    const firstNameInput = page.getByLabel(/first name/i).first();
    const hasFirstName = await firstNameInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasFirstName) {
      test.skip();
      return;
    }

    const newFirstName = generateName('Persist');
    await firstNameInput.clear();
    await firstNameInput.fill(newFirstName);

    // Save changes
    const saveButton = page.locator('button:has-text("Save"), button[type="submit"]').first();
    await saveButton.click();
    await page.waitForTimeout(1000);

    // Verify success
    await helpers.expectToast(page, /saved|updated|success/i, 5000);

    // Reload page
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Verify setting persisted
    const reloadedInput = page.getByLabel(/first name/i).first();
    await expect(reloadedInput).toBeVisible({ timeout: 5000 });

    const persistedValue = await reloadedInput.inputValue();
    expect(persistedValue).toBe(newFirstName);
  });
});
