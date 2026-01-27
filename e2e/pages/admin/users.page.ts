/**
 * Admin Users Page Object Model
 * Handles user management operations
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';

export class AdminUsersPage extends BasePage {
  readonly usersList: Locator;
  readonly newUserButton: Locator;
  readonly roleFilter: Locator;
  readonly userTable: Locator;

  constructor(page: Page) {
    super(page);
    this.usersList = page.locator('[data-testid="users-list"], table tbody').first();
    this.newUserButton = page.getByRole('button', { name: /new user|add user|create user/i }).first();
    this.roleFilter = page.locator('select[name="role"], [data-testid="role-filter"]').first();
    this.userTable = page.locator('table, [data-testid="users-table"]').first();
  }

  /**
   * Navigate to users page
   */
  async goto(): Promise<void> {
    await super.goto('/admin/users');
  }

  /**
   * Create a new user
   */
  async createUser(userData: {
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  }): Promise<void> {
    await this.newUserButton.click();
    await this.fillField('Email', userData.email);
    await this.fillField('First Name', userData.firstName);
    await this.fillField('Last Name', userData.lastName);
    await this.selectOption('Role', userData.role);
    await this.clickButton('Create');
    await this.expectSuccessToast();
  }

  /**
   * Edit a user by email
   */
  async editUser(email: string, updates: Partial<{
    firstName: string;
    lastName: string;
    role: string;
  }>): Promise<void> {
    const userRow = await this.getUserRow(email);
    const editButton = userRow.locator('button:has-text("Edit"), [aria-label="Edit"]').first();
    await editButton.click();

    if (updates.firstName) await this.fillField('First Name', updates.firstName);
    if (updates.lastName) await this.fillField('Last Name', updates.lastName);
    if (updates.role) await this.selectOption('Role', updates.role);

    await this.clickButton('Save');
    await this.expectSuccessToast();
  }

  /**
   * Delete a user by email
   */
  async deleteUser(email: string): Promise<void> {
    const userRow = await this.getUserRow(email);
    const deleteButton = userRow.locator('button:has-text("Delete"), [aria-label="Delete"]').first();
    await deleteButton.click();
    await this.confirmDialog();
    await this.expectSuccessToast();
  }

  /**
   * Filter users by role
   */
  async filterByRole(role: string): Promise<void> {
    await this.roleFilter.selectOption(role);
    await this.waitForPageLoad();
  }

  /**
   * Get user row by email
   */
  async getUserRow(email: string): Promise<Locator> {
    const row = this.userTable.locator(`tr:has-text("${email}")`).first();
    await expect(row).toBeVisible({ timeout: 5000 });
    return row;
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<{
    email: string;
    name: string;
    role: string;
  } | null> {
    try {
      const row = await this.getUserRow(email);
      const cells = row.locator('td');
      const name = await cells.nth(0).textContent() || '';
      const userEmail = await cells.nth(1).textContent() || '';
      const role = await cells.nth(2).textContent() || '';

      return {
        email: userEmail.trim(),
        name: name.trim(),
        role: role.trim(),
      };
    } catch {
      return null;
    }
  }

  /**
   * Check if user exists
   */
  async hasUser(email: string): Promise<boolean> {
    const row = this.userTable.locator(`tr:has-text("${email}")`).first();
    return row.isVisible({ timeout: 2000 }).catch(() => false);
  }

  /**
   * Get all visible users
   */
  async getAllUsers(): Promise<Array<{ email: string; name: string; role: string }>> {
    const rows = this.userTable.locator('tbody tr');
    const count = await rows.count();
    const users: Array<{ email: string; name: string; role: string }> = [];

    for (let i = 0; i < count; i++) {
      const cells = rows.nth(i).locator('td');
      const name = await cells.nth(0).textContent() || '';
      const email = await cells.nth(1).textContent() || '';
      const role = await cells.nth(2).textContent() || '';

      users.push({
        email: email.trim(),
        name: name.trim(),
        role: role.trim(),
      });
    }

    return users;
  }

  /**
   * Search for users
   */
  async searchUsers(query: string): Promise<void> {
    await this.search(query);
  }

  /**
   * Clear role filter
   */
  async clearRoleFilter(): Promise<void> {
    await this.roleFilter.selectOption('');
    await this.waitForPageLoad();
  }
}
