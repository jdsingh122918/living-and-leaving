/**
 * Volunteer Families Page Object Model
 * Handles volunteer family management (scoped to their families)
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';

export class VolunteerFamiliesPage extends BasePage {
  readonly familiesList: Locator;
  readonly newFamilyButton: Locator;
  readonly familyCards: Locator;

  constructor(page: Page) {
    super(page);
    this.familiesList = page.locator('[data-testid="families-list"], .families-grid').first();
    this.newFamilyButton = page.getByRole('button', { name: /new family|create family/i }).first();
    this.familyCards = page.locator('[data-testid="family-card"], .family-card');
  }

  /**
   * Navigate to volunteer families page
   */
  async goto(): Promise<void> {
    await super.goto('/volunteer/families');
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
    const familyCard = await this.getFamilyCard(familyName);
    const editButton = familyCard.locator('button:has-text("Edit"), [aria-label="Edit"]').first();
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
    const familyCard = await this.getFamilyCard(familyName);
    const deleteButton = familyCard.locator('button:has-text("Delete"), [aria-label="Delete"]').first();
    await deleteButton.click();
    await this.confirmDialog();
    await this.expectSuccessToast();
  }

  /**
   * Add member to family
   */
  async addMember(familyName: string, memberData: {
    firstName: string;
    lastName: string;
    email: string;
    role?: string;
  }): Promise<void> {
    const familyCard = await this.getFamilyCard(familyName);
    const addMemberButton = familyCard.locator('button:has-text("Add Member"), [aria-label="Add Member"]').first();
    await addMemberButton.click();

    await this.fillField('First Name', memberData.firstName);
    await this.fillField('Last Name', memberData.lastName);
    await this.fillField('Email', memberData.email);
    if (memberData.role) {
      await this.selectOption('Role', memberData.role);
    }

    await this.clickButton('Add');
    await this.expectSuccessToast();
  }

  /**
   * View family details
   */
  async viewFamilyDetails(familyName: string): Promise<void> {
    const familyCard = await this.getFamilyCard(familyName);
    await familyCard.click();
    await this.waitForPageLoad();
  }

  /**
   * Get family card by name
   */
  async getFamilyCard(familyName: string): Promise<Locator> {
    const card = this.page.locator(`[data-testid="family-card"]:has-text("${familyName}"), article:has-text("${familyName}")`).first();
    await expect(card).toBeVisible({ timeout: 5000 });
    return card;
  }

  /**
   * Get family by name
   */
  async getFamilyByName(familyName: string): Promise<{
    name: string;
    memberCount: string;
  } | null> {
    try {
      const card = await this.getFamilyCard(familyName);
      const name = await card.locator('[data-testid="family-name"], h3, h4').textContent() || '';
      const memberCount = await card.locator('[data-testid="member-count"]').textContent() || '';

      return {
        name: name.trim(),
        memberCount: memberCount.trim(),
      };
    } catch {
      return null;
    }
  }

  /**
   * Check if family exists
   */
  async hasFamily(familyName: string): Promise<boolean> {
    const card = this.page.locator(`[data-testid="family-card"]:has-text("${familyName}")`).first();
    return card.isVisible({ timeout: 2000 }).catch(() => false);
  }

  /**
   * Get all visible families
   */
  async getAllFamilies(): Promise<Array<{ name: string; memberCount: string }>> {
    const count = await this.familyCards.count();
    const families: Array<{ name: string; memberCount: string }> = [];

    for (let i = 0; i < count; i++) {
      const card = this.familyCards.nth(i);
      const name = await card.locator('[data-testid="family-name"], h3, h4').textContent() || '';
      const memberCount = await card.locator('[data-testid="member-count"]').textContent() || '';

      families.push({
        name: name.trim(),
        memberCount: memberCount.trim(),
      });
    }

    return families;
  }

  /**
   * Search for families
   */
  async searchFamilies(query: string): Promise<void> {
    await this.search(query);
  }
}
