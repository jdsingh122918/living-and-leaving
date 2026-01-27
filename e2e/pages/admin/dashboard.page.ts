/**
 * Admin Dashboard Page Object Model
 * Handles admin dashboard interactions
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';

export class AdminDashboardPage extends BasePage {
  readonly statCards: Locator;
  readonly recentActivity: Locator;
  readonly quickActions: Locator;

  constructor(page: Page) {
    super(page);
    this.statCards = page.locator('[data-testid="stat-card"], .stat-card, [class*="stats"] > div').first();
    this.recentActivity = page.locator('[data-testid="recent-activity"], [class*="recent-activity"]').first();
    this.quickActions = page.locator('[data-testid="quick-actions"], [class*="quick-actions"]').first();
  }

  /**
   * Navigate to admin dashboard
   */
  async goto(): Promise<void> {
    await super.goto('/admin/dashboard');
  }

  /**
   * Get stat card by label
   */
  getStatCard(label: string): Locator {
    return this.page.locator(`[data-testid="stat-card"]:has-text("${label}"), div:has-text("${label}")`).first();
  }

  /**
   * Get stat value by label
   */
  async getStatValue(label: string): Promise<string> {
    const card = this.getStatCard(label);
    const valueElement = card.locator('[data-testid="stat-value"], .text-2xl, .text-3xl, .text-4xl').first();
    return (await valueElement.textContent()) || '';
  }

  /**
   * Click on a stat card (if clickable)
   */
  async clickStatCard(label: string): Promise<void> {
    const card = this.getStatCard(label);
    await card.click();
    await this.waitForPageLoad();
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
   * Click quick action button
   */
  async clickQuickAction(text: string): Promise<void> {
    const button = this.page.getByRole('button', { name: text }).first();
    await button.click();
    await this.waitForPageLoad();
  }

  /**
   * Check if stat card exists
   */
  async hasStatCard(label: string): Promise<boolean> {
    const card = this.getStatCard(label);
    return card.isVisible({ timeout: 2000 }).catch(() => false);
  }

  /**
   * Wait for dashboard to load with stats
   */
  async waitForDashboardLoad(): Promise<void> {
    await this.waitForPageLoad();
    await expect(this.statCards).toBeVisible({ timeout: 10000 });
  }

  /**
   * Get all stat values as object
   */
  async getAllStats(): Promise<Record<string, string>> {
    const stats: Record<string, string> = {};
    const cards = this.page.locator('[data-testid="stat-card"]');
    const count = await cards.count();

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const label = await card.locator('[data-testid="stat-label"]').textContent();
      const value = await card.locator('[data-testid="stat-value"]').textContent();
      if (label && value) {
        stats[label.trim()] = value.trim();
      }
    }

    return stats;
  }
}
