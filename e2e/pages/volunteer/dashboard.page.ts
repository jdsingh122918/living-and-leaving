/**
 * Volunteer Dashboard Page Object Model
 * Handles volunteer dashboard interactions
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';

export class VolunteerDashboardPage extends BasePage {
  readonly createFamilyButton: Locator;
  readonly addMemberButton: Locator;
  readonly familyCount: Locator;
  readonly memberCount: Locator;
  readonly myFamiliesList: Locator;
  readonly quickActions: Locator;

  constructor(page: Page) {
    super(page);
    this.createFamilyButton = page.getByRole('button', { name: /create family/i }).first();
    this.addMemberButton = page.getByRole('button', { name: /add member/i }).first();
    this.familyCount = page.locator('[data-testid="family-count"], [class*="family-count"]').first();
    this.memberCount = page.locator('[data-testid="member-count"], [class*="member-count"]').first();
    this.myFamiliesList = page.locator('[data-testid="my-families"], [class*="families-list"]').first();
    this.quickActions = page.locator('[data-testid="quick-actions"]').first();
  }

  /**
   * Navigate to volunteer dashboard
   */
  async goto(): Promise<void> {
    await super.goto('/volunteer/dashboard');
  }

  /**
   * Click create family button
   */
  async clickCreateFamily(): Promise<void> {
    await this.createFamilyButton.click();
    await this.waitForPageLoad();
  }

  /**
   * Click add member button
   */
  async clickAddMember(): Promise<void> {
    await this.addMemberButton.click();
    await this.waitForPageLoad();
  }

  /**
   * Get family count
   */
  async getFamilyCount(): Promise<number> {
    const text = await this.familyCount.textContent();
    return parseInt(text?.match(/\d+/)?.[0] || '0');
  }

  /**
   * Get member count
   */
  async getMemberCount(): Promise<number> {
    const text = await this.memberCount.textContent();
    return parseInt(text?.match(/\d+/)?.[0] || '0');
  }

  /**
   * Get stat value by label
   */
  async getStatValue(label: string): Promise<string> {
    const card = this.page.locator(`[data-testid="stat-card"]:has-text("${label}")`).first();
    const valueElement = card.locator('[data-testid="stat-value"], .text-2xl, .text-3xl').first();
    return (await valueElement.textContent()) || '';
  }

  /**
   * Get list of families
   */
  async getFamilies(): Promise<Array<{ name: string; memberCount: string }>> {
    const familyCards = this.myFamiliesList.locator('[data-testid="family-card"], article, .family-card');
    const count = await familyCards.count();
    const families: Array<{ name: string; memberCount: string }> = [];

    for (let i = 0; i < count; i++) {
      const card = familyCards.nth(i);
      const name = await card.locator('[data-testid="family-name"], h3, h4').textContent() || '';
      const memberCountText = await card.locator('[data-testid="member-count"]').textContent() || '';

      families.push({
        name: name.trim(),
        memberCount: memberCountText.trim(),
      });
    }

    return families;
  }

  /**
   * Click on a family card
   */
  async clickFamilyCard(familyName: string): Promise<void> {
    const card = this.page.locator(`[data-testid="family-card"]:has-text("${familyName}"), article:has-text("${familyName}")`).first();
    await card.click();
    await this.waitForPageLoad();
  }

  /**
   * Check if family exists in list
   */
  async hasFamily(familyName: string): Promise<boolean> {
    const card = this.page.locator(`[data-testid="family-card"]:has-text("${familyName}")`).first();
    return card.isVisible({ timeout: 2000 }).catch(() => false);
  }

  /**
   * Click quick action
   */
  async clickQuickAction(actionName: string): Promise<void> {
    const button = this.quickActions.getByRole('button', { name: actionName }).first();
    await button.click();
    await this.waitForPageLoad();
  }

  /**
   * Wait for dashboard to load
   */
  async waitForDashboardLoad(): Promise<void> {
    await this.waitForPageLoad();
    await expect(this.familyCount).toBeVisible({ timeout: 10000 });
  }
}
