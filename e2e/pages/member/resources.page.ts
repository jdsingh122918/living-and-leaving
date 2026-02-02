/**
 * Member Resources Page Object Model
 * Handles member resource viewing and interaction
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';

export class MemberResourcesPage extends BasePage {
  readonly resourcesList: Locator;
  readonly bookmarkButton: Locator;
  readonly typeFilter: Locator;
  readonly tagFilter: Locator;

  constructor(page: Page) {
    super(page);
    this.resourcesList = page.locator('[data-testid="resources-list"], .resources-grid').first();
    this.bookmarkButton = page.locator('[data-testid="bookmark-button"], button[aria-label*="Bookmark"]').first();
    this.typeFilter = page.locator('select[name="type"], [data-testid="type-filter"]').first();
    this.tagFilter = page.locator('select[name="tag"], [data-testid="tag-filter"]').first();
  }

  /**
   * Navigate to member resources page
   */
  async goto(): Promise<void> {
    await super.goto('/member/resources');
  }

  /**
   * View a resource by title
   */
  async viewResource(title: string): Promise<void> {
    const resourceCard = this.page.locator(`[data-testid="resource-card"]:has-text("${title}"), article:has-text("${title}")`).first();
    await resourceCard.click();
    await this.waitForPageLoad();
  }

  /**
   * Bookmark a resource by title
   */
  async bookmarkResource(title: string): Promise<void> {
    const resourceCard = this.page.locator(`[data-testid="resource-card"]:has-text("${title}"), article:has-text("${title}")`).first();
    const bookmarkButton = resourceCard.locator('[data-testid="bookmark-button"], button[aria-label*="Bookmark"]').first();
    await bookmarkButton.click();
    await this.expectSuccessToast();
  }

  /**
   * Get resource card by title
   */
  async getResourceCard(title: string): Promise<Locator> {
    const card = this.page.locator(`[data-testid="resource-card"]:has-text("${title}"), article:has-text("${title}")`).first();
    await expect(card).toBeVisible({ timeout: 5000 });
    return card;
  }

  /**
   * Check if resource is bookmarked
   */
  async isResourceBookmarked(title: string): Promise<boolean> {
    const resourceCard = await this.getResourceCard(title);
    const bookmarkButton = resourceCard.locator('[data-testid="bookmark-button"], button[aria-label*="Bookmark"]').first();
    const ariaLabel = await bookmarkButton.getAttribute('aria-label');
    return ariaLabel?.toLowerCase().includes('bookmarked') || false;
  }

  /**
   * Filter resources by type
   */
  async filterByType(type: string): Promise<void> {
    await this.typeFilter.selectOption(type);
    await this.waitForPageLoad();
  }

  /**
   * Filter resources by tag
   */
  async filterByTag(tag: string): Promise<void> {
    await this.tagFilter.selectOption(tag);
    await this.waitForPageLoad();
  }

  /**
   * Get all visible resources
   */
  async getAllResources(): Promise<Array<{
    title: string;
    type: string;
    isBookmarked: boolean;
  }>> {
    const cards = this.resourcesList.locator('[data-testid="resource-card"], article');
    const count = await cards.count();
    const resources: Array<{ title: string; type: string; isBookmarked: boolean }> = [];

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const title = await card.locator('[data-testid="resource-title"], h3, h4').textContent() || '';
      const type = await card.locator('[data-testid="resource-type"]').textContent() || '';
      const bookmarkButton = card.locator('[data-testid="bookmark-button"]');
      const ariaLabel = await bookmarkButton.getAttribute('aria-label');
      const isBookmarked = ariaLabel?.toLowerCase().includes('bookmarked') || false;

      resources.push({
        title: title.trim(),
        type: type.trim(),
        isBookmarked,
      });
    }

    return resources;
  }

  /**
   * Search for resources
   */
  async searchResources(query: string): Promise<void> {
    await this.search(query);
  }

  /**
   * Clear all filters
   */
  async clearFilters(): Promise<void> {
    await this.typeFilter.selectOption('');
    await this.tagFilter.selectOption('');
    await this.waitForPageLoad();
  }

  /**
   * Check if resource exists
   */
  async hasResource(title: string): Promise<boolean> {
    const card = this.page.locator(`[data-testid="resource-card"]:has-text("${title}")`).first();
    return card.isVisible({ timeout: 2000 }).catch(() => false);
  }
}
