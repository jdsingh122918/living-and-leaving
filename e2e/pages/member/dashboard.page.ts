/**
 * Member Dashboard Page Object Model
 * Handles member dashboard interactions
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';

export class MemberDashboardPage extends BasePage {
  readonly quickAccessCards: Locator;
  readonly templateAssignments: Locator;
  readonly familyInfo: Locator;
  readonly recentActivity: Locator;

  constructor(page: Page) {
    super(page);
    this.quickAccessCards = page.locator('[data-testid="quick-access"], [class*="quick-access"]');
    this.templateAssignments = page.locator('[data-testid="template-assignments"], [class*="template-assignments"]').first();
    this.familyInfo = page.locator('[data-testid="family-info"], [class*="family-info"]').first();
    this.recentActivity = page.locator('[data-testid="recent-activity"]').first();
  }

  /**
   * Navigate to member dashboard
   */
  async goto(): Promise<void> {
    await super.goto('/member/dashboard');
  }

  /**
   * Click on a quick access card
   */
  async clickQuickAccessCard(cardName: string): Promise<void> {
    const card = this.page.locator(`[data-testid="quick-access-card"]:has-text("${cardName}"), article:has-text("${cardName}")`).first();
    await card.click();
    await this.waitForPageLoad();
  }

  /**
   * Get template assignments
   */
  async getTemplateAssignments(): Promise<Array<{
    name: string;
    status: string;
    dueDate?: string;
  }>> {
    const assignmentCards = this.templateAssignments.locator('[data-testid="assignment-card"], .assignment-card');
    const count = await assignmentCards.count();
    const assignments: Array<{ name: string; status: string; dueDate?: string }> = [];

    for (let i = 0; i < count; i++) {
      const card = assignmentCards.nth(i);
      const name = await card.locator('[data-testid="assignment-name"], h3, h4').textContent() || '';
      const status = await card.locator('[data-testid="assignment-status"], .badge').textContent() || '';
      const dueDateElement = card.locator('[data-testid="due-date"]');
      const dueDate = await dueDateElement.isVisible() ? await dueDateElement.textContent() : undefined;

      assignments.push({
        name: name.trim(),
        status: status.trim(),
        dueDate: dueDate?.trim(),
      });
    }

    return assignments;
  }

  /**
   * Get family information
   */
  async getFamilyInfo(): Promise<{
    familyName: string;
    memberCount: string;
    volunteer?: string;
  }> {
    const familyName = await this.familyInfo.locator('[data-testid="family-name"]').textContent() || '';
    const memberCount = await this.familyInfo.locator('[data-testid="member-count"]').textContent() || '';
    const volunteerElement = this.familyInfo.locator('[data-testid="volunteer-name"]');
    const volunteer = await volunteerElement.isVisible() ? await volunteerElement.textContent() : undefined;

    return {
      familyName: familyName.trim(),
      memberCount: memberCount.trim(),
      volunteer: volunteer?.trim(),
    };
  }

  /**
   * Click on template assignment
   */
  async clickTemplateAssignment(assignmentName: string): Promise<void> {
    const card = this.page.locator(`[data-testid="assignment-card"]:has-text("${assignmentName}")`).first();
    await card.click();
    await this.waitForPageLoad();
  }

  /**
   * Check if template assignment exists
   */
  async hasTemplateAssignment(assignmentName: string): Promise<boolean> {
    const card = this.page.locator(`[data-testid="assignment-card"]:has-text("${assignmentName}")`).first();
    return card.isVisible({ timeout: 2000 }).catch(() => false);
  }

  /**
   * Get quick access cards
   */
  async getQuickAccessCards(): Promise<string[]> {
    const cards = this.quickAccessCards.locator('[data-testid="quick-access-card"], article');
    const count = await cards.count();
    const cardNames: string[] = [];

    for (let i = 0; i < count; i++) {
      const name = await cards.nth(i).locator('h3, h4, [data-testid="card-title"]').textContent();
      if (name) cardNames.push(name.trim());
    }

    return cardNames;
  }

  /**
   * Get recent activity items
   */
  async getRecentActivityItems(): Promise<string[]> {
    const items = this.recentActivity.locator('li, [data-testid="activity-item"]');
    const count = await items.count();
    const activities: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await items.nth(i).textContent();
      if (text) activities.push(text.trim());
    }

    return activities;
  }

  /**
   * Wait for dashboard to load
   */
  async waitForDashboardLoad(): Promise<void> {
    await this.waitForPageLoad();
    await expect(this.familyInfo).toBeVisible({ timeout: 10000 });
  }
}
