/**
 * Admin Families Page Object Model
 * Handles family management operations
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';

export class AdminFamiliesPage extends BasePage {
  readonly familiesList: Locator;
  readonly newFamilyButton: Locator;
  readonly familyTable: Locator;

  constructor(page: Page) {
    super(page);
    this.familiesList = page.locator('[data-testid="families-list"], table tbody').first();
    this.newFamilyButton = page.getByRole('button', { name: /new family|add family|create family/i }).first();
    this.familyTable = page.locator('table, [data-testid="families-table"]').first();
  }

  /**
   * Navigate to families page
   */
  async goto(): Promise<void> {
    await super.goto('/admin/families');
  }

  /**
   * Create a new family
   */
  async createFamily(familyData: {
    name: string;
    description?: string;
  }): Promise<void> {
    await this.newFamilyButton.click();
    await this.fillField('Family Name', familyData.name);
    if (familyData.description) {
      await this.fillField('Description', familyData.description);
    }
    await this.clickButton('Create');
    await this.expectSuccessToast();
  }

  /**
   * Edit a family by name
   */
  async editFamily(familyName: string, updates: {
    name?: string;
    description?: string;
  }): Promise<void> {
    const familyRow = await this.getFamilyRow(familyName);
    const editButton = familyRow.locator('button:has-text("Edit"), [aria-label="Edit"]').first();
    await editButton.click();

    if (updates.name) await this.fillField('Family Name', updates.name);
    if (updates.description) await this.fillField('Description', updates.description);

    await this.clickButton('Save');
    await this.expectSuccessToast();
  }

  /**
   * Delete a family by name
   */
  async deleteFamily(familyName: string): Promise<void> {
    const familyRow = await this.getFamilyRow(familyName);
    const deleteButton = familyRow.locator('button:has-text("Delete"), [aria-label="Delete"]').first();
    await deleteButton.click();
    await this.confirmDialog();
    await this.expectSuccessToast();
  }

  /**
   * Assign volunteer to family
   */
  async assignVolunteer(familyName: string, volunteerEmail: string): Promise<void> {
    const familyRow = await this.getFamilyRow(familyName);
    const assignButton = familyRow.locator('button:has-text("Assign"), [aria-label="Assign Volunteer"]').first();
    await assignButton.click();

    // Select volunteer from dropdown or search
    await this.page.locator('input[placeholder*="volunteer"], select').first().fill(volunteerEmail);
    await this.page.keyboard.press('Enter');

    await this.clickButton('Assign');
    await this.expectSuccessToast();
  }

  /**
   * Get family row by name
   */
  async getFamilyRow(familyName: string): Promise<Locator> {
    const row = this.familyTable.locator(`tr:has-text("${familyName}")`).first();
    await expect(row).toBeVisible({ timeout: 5000 });
    return row;
  }

  /**
   * Get family by name
   */
  async getFamilyByName(familyName: string): Promise<{
    name: string;
    memberCount: string;
    volunteer?: string;
  } | null> {
    try {
      const row = await this.getFamilyRow(familyName);
      const cells = row.locator('td');
      const name = await cells.nth(0).textContent() || '';
      const memberCount = await cells.nth(1).textContent() || '';
      const volunteer = await cells.nth(2).textContent() || '';

      return {
        name: name.trim(),
        memberCount: memberCount.trim(),
        volunteer: volunteer.trim() || undefined,
      };
    } catch {
      return null;
    }
  }

  /**
   * Check if family exists
   */
  async hasFamily(familyName: string): Promise<boolean> {
    const row = this.familyTable.locator(`tr:has-text("${familyName}")`).first();
    return row.isVisible({ timeout: 2000 }).catch(() => false);
  }

  /**
   * Get all visible families
   */
  async getAllFamilies(): Promise<Array<{
    name: string;
    memberCount: string;
    volunteer?: string;
  }>> {
    const rows = this.familyTable.locator('tbody tr');
    const count = await rows.count();
    const families: Array<{ name: string; memberCount: string; volunteer?: string }> = [];

    for (let i = 0; i < count; i++) {
      const cells = rows.nth(i).locator('td');
      const name = await cells.nth(0).textContent() || '';
      const memberCount = await cells.nth(1).textContent() || '';
      const volunteer = await cells.nth(2).textContent() || '';

      families.push({
        name: name.trim(),
        memberCount: memberCount.trim(),
        volunteer: volunteer.trim() || undefined,
      });
    }

    return families;
  }

  /**
   * View family details
   */
  async viewFamilyDetails(familyName: string): Promise<void> {
    const familyRow = await this.getFamilyRow(familyName);
    const viewButton = familyRow.locator('button:has-text("View"), [aria-label="View Details"], a').first();
    await viewButton.click();
    await this.waitForPageLoad();
  }

  /**
   * Search for families
   */
  async searchFamilies(query: string): Promise<void> {
    await this.search(query);
  }
}
