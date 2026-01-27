/**
 * Base Page Object Model
 * Provides common functionality for all page objects
 */

import { Page, Locator, expect } from '@playwright/test';

export class BasePage {
  readonly page: Page;

  // Common locators
  readonly sidebar: Locator;
  readonly breadcrumb: Locator;
  readonly userMenu: Locator;
  readonly toast: Locator;
  readonly loadingSpinner: Locator;
  readonly dialog: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = page.locator('[data-testid="sidebar"], nav[role="navigation"]');
    this.breadcrumb = page.locator('[data-testid="breadcrumb"], nav[aria-label="Breadcrumb"]');
    this.userMenu = page.locator('[data-testid="user-button"], [data-testid="user-menu"]');
    this.toast = page.locator('[data-testid="toast"], [role="status"]');
    this.loadingSpinner = page.locator('[data-testid="loading"], .animate-spin');
    this.dialog = page.locator('[role="dialog"], [data-testid="dialog"]');
    this.searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
  }

  /**
   * Navigate to a specific path
   */
  async goto(path: string): Promise<void> {
    await this.page.goto(path);
    await this.waitForPageLoad();
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Wait for loading spinners to disappear
   */
  async waitForLoadingComplete(timeout = 10000): Promise<void> {
    await expect(this.loadingSpinner).not.toBeVisible({ timeout });
  }

  /**
   * Click a sidebar navigation link
   */
  async clickSidebarLink(text: string): Promise<void> {
    const link = this.sidebar.getByRole('link', { name: text }).first();
    await link.click();
    await this.waitForPageLoad();
  }

  /**
   * Check if sidebar link exists
   */
  async hasSidebarLink(text: string): Promise<boolean> {
    const link = this.sidebar.getByRole('link', { name: text }).first();
    return link.isVisible({ timeout: 2000 }).catch(() => false);
  }

  /**
   * Get current page title from breadcrumb
   */
  async getBreadcrumbTitle(): Promise<string> {
    const lastCrumb = this.breadcrumb.locator('span, a').last();
    return (await lastCrumb.textContent()) || '';
  }

  /**
   * Open user menu dropdown
   */
  async openUserMenu(): Promise<void> {
    await this.userMenu.click();
  }

  /**
   * Sign out via user menu
   */
  async signOut(): Promise<void> {
    await this.openUserMenu();
    const signOutButton = this.page.locator('button:has-text("Sign out"), a:has-text("Sign out")').first();
    await signOutButton.click();
    await this.page.waitForURL('/sign-in');
  }

  /**
   * Expect a toast notification with specific text
   */
  async expectToast(message: string | RegExp, timeout = 5000): Promise<void> {
    const toastWithMessage = this.toast.filter({ hasText: message });
    await expect(toastWithMessage).toBeVisible({ timeout });
  }

  /**
   * Expect success toast
   */
  async expectSuccessToast(timeout = 5000): Promise<void> {
    const successToast = this.toast.filter({ hasText: /success|created|saved|updated|deleted/i });
    await expect(successToast).toBeVisible({ timeout });
  }

  /**
   * Expect error toast
   */
  async expectErrorToast(timeout = 5000): Promise<void> {
    const errorToast = this.toast.filter({ hasText: /error|failed|invalid/i });
    await expect(errorToast).toBeVisible({ timeout });
  }

  /**
   * Confirm a dialog
   */
  async confirmDialog(): Promise<void> {
    await expect(this.dialog).toBeVisible();
    const confirmButton = this.dialog.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")').first();
    await confirmButton.click();
    await expect(this.dialog).not.toBeVisible({ timeout: 5000 });
  }

  /**
   * Cancel a dialog
   */
  async cancelDialog(): Promise<void> {
    await expect(this.dialog).toBeVisible();
    const cancelButton = this.dialog.locator('button:has-text("Cancel"), button:has-text("No")').first();
    await cancelButton.click();
    await expect(this.dialog).not.toBeVisible({ timeout: 5000 });
  }

  /**
   * Check if dialog is visible
   */
  async isDialogVisible(): Promise<boolean> {
    return this.dialog.isVisible({ timeout: 2000 }).catch(() => false);
  }

  /**
   * Search for something
   */
  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.waitForPageLoad();
  }

  /**
   * Clear search
   */
  async clearSearch(): Promise<void> {
    await this.searchInput.clear();
    await this.waitForPageLoad();
  }

  /**
   * Fill a form field by label
   */
  async fillField(label: string, value: string): Promise<void> {
    const field = this.page.getByLabel(label).first();
    await field.fill(value);
  }

  /**
   * Select option in a dropdown by label
   */
  async selectOption(label: string, value: string): Promise<void> {
    const select = this.page.getByLabel(label).first();
    await select.selectOption(value);
  }

  /**
   * Click a button by text
   */
  async clickButton(text: string): Promise<void> {
    const button = this.page.getByRole('button', { name: text }).first();
    await button.click();
  }

  /**
   * Click a link by text
   */
  async clickLink(text: string): Promise<void> {
    const link = this.page.getByRole('link', { name: text }).first();
    await link.click();
    await this.waitForPageLoad();
  }

  /**
   * Check if element with text exists
   */
  async hasText(text: string): Promise<boolean> {
    const element = this.page.getByText(text).first();
    return element.isVisible({ timeout: 2000 }).catch(() => false);
  }

  /**
   * Wait for text to appear
   */
  async waitForText(text: string, timeout = 10000): Promise<void> {
    const element = this.page.getByText(text).first();
    await expect(element).toBeVisible({ timeout });
  }

  /**
   * Get current URL path
   */
  getPath(): string {
    return new URL(this.page.url()).pathname;
  }

  /**
   * Check if on specific path
   */
  isOnPath(path: string): boolean {
    return this.getPath() === path;
  }

  /**
   * Wait for navigation to path
   */
  async waitForPath(path: string | RegExp, timeout = 10000): Promise<void> {
    await this.page.waitForURL(path, { timeout });
  }

  /**
   * Take a screenshot for debugging
   */
  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png` });
  }
}
