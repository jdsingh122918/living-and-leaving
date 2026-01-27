/**
 * Base test configuration with all fixtures
 * Use this as the foundation for all E2E tests
 */

import { test as authTest, expect, TEST_USERS } from './auth.fixture';
import type { UserRole } from './auth.fixture';
import { Page, Locator } from '@playwright/test';

// Common test data generators
export const generateUniqueId = () => `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
export const generateEmail = () => `test-${Date.now()}@test.firefly.local`;
export const generateName = (prefix: string) => `${prefix} ${Date.now()}`;

// Common selectors
export const SELECTORS = {
  // Navigation
  sidebar: '[data-testid="sidebar"], nav[role="navigation"], aside, [class*="sidebar"]',
  breadcrumb: '[data-testid="breadcrumb"], nav[aria-label="Breadcrumb"]',
  userMenu: '[data-testid="user-button"], [data-testid="user-menu"]',

  // Forms
  submitButton: 'button[type="submit"]',
  cancelButton: 'button:has-text("Cancel")',
  saveButton: 'button:has-text("Save")',
  deleteButton: 'button:has-text("Delete")',
  editButton: 'button:has-text("Edit"), a:has-text("Edit")',

  // Feedback
  toast: '[data-testid="toast"], [role="status"]',
  errorMessage: '[data-testid="error"], .text-destructive, [role="alert"]',
  loadingSpinner: '[data-testid="loading"], .animate-spin',

  // Dialogs
  dialog: '[role="dialog"], [data-testid="dialog"]',
  dialogConfirm: '[role="dialog"] button:has-text("Confirm"), [role="dialog"] button:has-text("Yes")',
  dialogCancel: '[role="dialog"] button:has-text("Cancel"), [role="dialog"] button:has-text("No")',

  // Lists
  searchInput: 'input[placeholder*="Search"], input[type="search"]',
  emptyState: '[data-testid="empty-state"], .empty-state',
  listItem: '[data-testid="list-item"], .list-item',

  // Cards
  card: '[data-testid="card"], [data-testid="stat-card"], [data-slot="card"], .card, [class*="rounded-xl"][class*="border"], [class*="rounded-lg"][class*="border"]',
  cardTitle: '[data-testid="card-title"], [data-slot="card-title"], .card-title',
};

// Helper functions for common interactions
export const helpers = {
  /**
   * Dismiss the cookie banner if it appears
   * Useful as a safety net if cookie consent wasn't pre-set
   */
  async dismissCookieBanner(page: Page): Promise<void> {
    const banner = page.locator('.fixed.bottom-0').filter({ hasText: /cookies/i }).first();
    const acceptButton = banner.getByRole('button', { name: 'Accept Cookies' });

    if (await acceptButton.isVisible({ timeout: 500 }).catch(() => false)) {
      await acceptButton.click();
      await banner.waitFor({ state: 'hidden', timeout: 1000 });
    }
  },

  /**
   * Wait for a toast notification and verify its message
   */
  async expectToast(page: Page, message: string | RegExp, timeout = 5000): Promise<void> {
    const toast = page.locator(SELECTORS.toast).filter({ hasText: message });
    await expect(toast).toBeVisible({ timeout });
  },

  /**
   * Fill a form field by label (with fallback strategies for shadcn/ui forms)
   */
  async fillFormField(page: Page, label: string, value: string): Promise<void> {
    // Normalize label for name/testid matching
    const normalizedName = label.toLowerCase().replace(/\s+/g, '');
    const normalizedTestId = label.toLowerCase().replace(/\s+/g, '-');

    // Try multiple strategies - shadcn/ui forms don't always have proper label associations
    const field = page.getByLabel(label)
      .or(page.getByLabel(new RegExp(label, 'i')))
      .or(page.locator(`input[name="${normalizedName}"]`))
      .or(page.locator(`textarea[name="${normalizedName}"]`))
      .or(page.locator(`[data-testid="${normalizedTestId}-input"]`))
      .first();
    await field.fill(value);
  },

  /**
   * Select an option from a dropdown by label
   */
  async selectOption(page: Page, label: string, value: string): Promise<void> {
    const select = page.getByLabel(label).first();
    await select.selectOption(value);
  },

  /**
   * Click a button by text
   */
  async clickButton(page: Page, text: string): Promise<void> {
    const button = page.getByRole('button', { name: text }).first();
    await button.click();
  },

  /**
   * Click a link by text
   */
  async clickLink(page: Page, text: string): Promise<void> {
    const link = page.getByRole('link', { name: text }).first();
    await link.click();
  },

  /**
   * Navigate via sidebar menu
   */
  async navigateViaSidebar(page: Page, menuItem: string): Promise<void> {
    const sidebar = page.locator(SELECTORS.sidebar);
    const link = sidebar.getByRole('link', { name: menuItem }).first();
    await link.click();
    await page.waitForLoadState('domcontentloaded');
  },

  /**
   * Confirm a dialog
   */
  async confirmDialog(page: Page): Promise<void> {
    const dialog = page.locator(SELECTORS.dialog);
    await expect(dialog).toBeVisible();
    await page.locator(SELECTORS.dialogConfirm).click();
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  },

  /**
   * Cancel a dialog
   */
  async cancelDialog(page: Page): Promise<void> {
    const dialog = page.locator(SELECTORS.dialog);
    await expect(dialog).toBeVisible();
    await page.locator(SELECTORS.dialogCancel).click();
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  },

  /**
   * Wait for loading to complete
   */
  async waitForLoading(page: Page, timeout = 10000): Promise<void> {
    const spinner = page.locator(SELECTORS.loadingSpinner);
    // Wait for spinner to appear (if it does)
    await page.waitForTimeout(500);
    // Wait for spinner to disappear
    await expect(spinner).not.toBeVisible({ timeout });
  },

  /**
   * Search in a list
   */
  async searchInList(page: Page, query: string): Promise<void> {
    const searchInput = page.locator(SELECTORS.searchInput).first();
    await searchInput.fill(query);
    await page.waitForLoadState('domcontentloaded');
  },

  /**
   * Check if empty state is shown
   */
  async isEmptyState(page: Page): Promise<boolean> {
    const emptyState = page.locator(SELECTORS.emptyState);
    return emptyState.isVisible({ timeout: 2000 }).catch(() => false);
  },

  /**
   * Get count of list items
   */
  async getListItemCount(page: Page): Promise<number> {
    const items = page.locator(SELECTORS.listItem);
    return items.count();
  },

  /**
   * Wait for page to be ready by checking for content elements
   * More deterministic than waitForURL() which can timeout with SSE connections
   */
  async waitForPageReady(page: Page, textPatterns: string[]): Promise<void> {
    const selectors = textPatterns.map(t => `text="${t}"`);
    const combined = selectors.map(s => page.locator(s));

    // Wait for any of the text patterns to be visible
    let locator = combined[0];
    for (let i = 1; i < combined.length; i++) {
      locator = locator.or(combined[i]);
    }

    await locator.first().waitFor({ state: 'visible', timeout: 10000 });
  },
};

// Extended test with helpers
type ExtendedFixtures = {
  helpers: typeof helpers;
  selectors: typeof SELECTORS;
  generateId: () => string;
  generateEmail: () => string;
  generateName: (prefix: string) => string;
};

export const test = authTest.extend<ExtendedFixtures>({
  helpers: async ({}, use) => {
    await use(helpers);
  },
  selectors: async ({}, use) => {
    await use(SELECTORS);
  },
  generateId: async ({}, use) => {
    await use(generateUniqueId);
  },
  generateEmail: async ({}, use) => {
    await use(generateEmail);
  },
  generateName: async ({}, use) => {
    await use(generateName);
  },
});

export { expect, TEST_USERS };
export type { UserRole };
