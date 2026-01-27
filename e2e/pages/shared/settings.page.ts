/**
 * Settings Page Object Model
 * Handles user settings and preferences
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';

export class SettingsPage extends BasePage {
  readonly profileForm: Locator;
  readonly notificationSettings: Locator;
  readonly themeToggle: Locator;
  readonly saveButton: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;

  constructor(page: Page) {
    super(page);
    this.profileForm = page.locator('form[data-testid="profile-form"], form').first();
    this.notificationSettings = page.locator('[data-testid="notification-settings"]').first();
    this.themeToggle = page.locator('[data-testid="theme-toggle"], button[aria-label*="theme"]').first();
    this.saveButton = page.getByRole('button', { name: /save|update/i }).first();
    this.firstNameInput = page.locator('input[name="firstName"], input[id="firstName"]').first();
    this.lastNameInput = page.locator('input[name="lastName"], input[id="lastName"]').first();
    this.emailInput = page.locator('input[name="email"], input[type="email"]').first();
    this.phoneInput = page.locator('input[name="phone"], input[type="tel"]').first();
  }

  /**
   * Navigate to settings page
   */
  async goto(): Promise<void> {
    await super.goto('/settings');
  }

  /**
   * Update profile information
   */
  async updateProfile(profileData: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  }): Promise<void> {
    if (profileData.firstName) {
      await this.firstNameInput.fill(profileData.firstName);
    }
    if (profileData.lastName) {
      await this.lastNameInput.fill(profileData.lastName);
    }
    if (profileData.email) {
      await this.emailInput.fill(profileData.email);
    }
    if (profileData.phone) {
      await this.phoneInput.fill(profileData.phone);
    }
  }

  /**
   * Toggle a notification setting
   */
  async toggleNotification(notificationName: string): Promise<void> {
    const toggle = this.notificationSettings.locator(`input[type="checkbox"][id*="${notificationName}"], button[role="switch"][aria-label*="${notificationName}"]`).first();
    await toggle.click();
  }

  /**
   * Toggle theme (dark/light mode)
   */
  async toggleTheme(): Promise<void> {
    await this.themeToggle.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Save changes
   */
  async saveChanges(): Promise<void> {
    await this.saveButton.click();
    await this.expectSuccessToast();
  }

  /**
   * Get notification setting state
   */
  async getNotificationState(notificationName: string): Promise<boolean> {
    const toggle = this.notificationSettings.locator(`input[type="checkbox"][id*="${notificationName}"], button[role="switch"][aria-label*="${notificationName}"]`).first();

    // Check if it's a checkbox or switch
    const tagName = await toggle.evaluate(el => el.tagName.toLowerCase());

    if (tagName === 'input') {
      return toggle.isChecked();
    } else {
      const ariaChecked = await toggle.getAttribute('aria-checked');
      return ariaChecked === 'true';
    }
  }

  /**
   * Get current theme
   */
  async getCurrentTheme(): Promise<'light' | 'dark'> {
    const html = this.page.locator('html').first();
    const className = await html.getAttribute('class');
    return className?.includes('dark') ? 'dark' : 'light';
  }

  /**
   * Navigate to specific settings tab
   */
  async goToTab(tabName: string): Promise<void> {
    const tab = this.page.getByRole('tab', { name: tabName }).first();
    await tab.click();
    await this.waitForPageLoad();
  }

  /**
   * Get profile data
   */
  async getProfileData(): Promise<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  }> {
    return {
      firstName: await this.firstNameInput.inputValue(),
      lastName: await this.lastNameInput.inputValue(),
      email: await this.emailInput.inputValue(),
      phone: await this.phoneInput.inputValue(),
    };
  }

  /**
   * Enable all notifications
   */
  async enableAllNotifications(): Promise<void> {
    const toggles = this.notificationSettings.locator('input[type="checkbox"], button[role="switch"]');
    const count = await toggles.count();

    for (let i = 0; i < count; i++) {
      const toggle = toggles.nth(i);
      const isEnabled = await this.isToggleEnabled(toggle);

      if (!isEnabled) {
        await toggle.click();
      }
    }
  }

  /**
   * Disable all notifications
   */
  async disableAllNotifications(): Promise<void> {
    const toggles = this.notificationSettings.locator('input[type="checkbox"], button[role="switch"]');
    const count = await toggles.count();

    for (let i = 0; i < count; i++) {
      const toggle = toggles.nth(i);
      const isEnabled = await this.isToggleEnabled(toggle);

      if (isEnabled) {
        await toggle.click();
      }
    }
  }

  /**
   * Helper to check if toggle is enabled
   */
  private async isToggleEnabled(toggle: Locator): Promise<boolean> {
    const tagName = await toggle.evaluate(el => el.tagName.toLowerCase());

    if (tagName === 'input') {
      return toggle.isChecked();
    } else {
      const ariaChecked = await toggle.getAttribute('aria-checked');
      return ariaChecked === 'true';
    }
  }

  /**
   * Change password (if applicable)
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.fillField('Current Password', currentPassword);
    await this.fillField('New Password', newPassword);
    await this.fillField('Confirm Password', newPassword);
    await this.clickButton('Change Password');
    await this.expectSuccessToast();
  }

  /**
   * Delete account
   */
  async deleteAccount(): Promise<void> {
    const deleteButton = this.page.getByRole('button', { name: /delete account/i }).first();
    await deleteButton.click();
    await this.confirmDialog();
  }

  /**
   * Export user data
   */
  async exportData(): Promise<void> {
    const exportButton = this.page.getByRole('button', { name: /export data/i }).first();
    await exportButton.click();
    await this.expectSuccessToast();
  }
}
