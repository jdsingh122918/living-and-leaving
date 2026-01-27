/**
 * Admin Resources Page Object Model
 * Handles resource management operations
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';

export class AdminResourcesPage extends BasePage {
  readonly resourcesList: Locator;
  readonly newResourceButton: Locator;
  readonly typeFilter: Locator;
  readonly visibilityFilter: Locator;
  readonly tagFilter: Locator;
  readonly resourceTable: Locator;

  constructor(page: Page) {
    super(page);
    this.resourcesList = page.locator('[data-testid="resources-list"], .resources-grid').first();
    this.newResourceButton = page.getByRole('button', { name: /new resource|add resource|create resource/i }).first();
    this.typeFilter = page.locator('select[name="type"], [data-testid="type-filter"]').first();
    this.visibilityFilter = page.locator('select[name="visibility"], [data-testid="visibility-filter"]').first();
    this.tagFilter = page.locator('select[name="tag"], [data-testid="tag-filter"]').first();
    this.resourceTable = page.locator('table, [data-testid="resources-table"]').first();
  }

  /**
   * Navigate to resources page
   */
  async goto(): Promise<void> {
    await super.goto('/admin/resources');
  }

  /**
   * Create a new resource
   */
  async createResource(resourceData: {
    title: string;
    type: string;
    visibility: string;
    description?: string;
    content?: string;
    tags?: string[];
  }): Promise<void> {
    await this.newResourceButton.click();
    await this.fillField('Title', resourceData.title);
    await this.selectOption('Type', resourceData.type);
    await this.selectOption('Visibility', resourceData.visibility);

    if (resourceData.description) {
      await this.fillField('Description', resourceData.description);
    }

    if (resourceData.content) {
      await this.fillField('Content', resourceData.content);
    }

    if (resourceData.tags && resourceData.tags.length > 0) {
      for (const tag of resourceData.tags) {
        await this.page.locator(`[data-testid="tag-${tag}"], input[value="${tag}"]`).check();
      }
    }

    await this.clickButton('Create');
    await this.expectSuccessToast();
  }

  /**
   * Edit a resource by title
   */
  async editResource(title: string, updates: Partial<{
    title: string;
    type: string;
    visibility: string;
    description: string;
    content: string;
    tags: string[];
  }>): Promise<void> {
    const resourceCard = await this.getResourceCard(title);
    const editButton = resourceCard.locator('button:has-text("Edit"), [aria-label="Edit"]').first();
    await editButton.click();

    if (updates.title) await this.fillField('Title', updates.title);
    if (updates.type) await this.selectOption('Type', updates.type);
    if (updates.visibility) await this.selectOption('Visibility', updates.visibility);
    if (updates.description) await this.fillField('Description', updates.description);
    if (updates.content) await this.fillField('Content', updates.content);

    await this.clickButton('Save');
    await this.expectSuccessToast();
  }

  /**
   * Delete a resource by title
   */
  async deleteResource(title: string): Promise<void> {
    const resourceCard = await this.getResourceCard(title);
    const deleteButton = resourceCard.locator('button:has-text("Delete"), [aria-label="Delete"]').first();
    await deleteButton.click();
    await this.confirmDialog();
    await this.expectSuccessToast();
  }

  /**
   * Approve a resource by title
   */
  async approveResource(title: string): Promise<void> {
    const resourceCard = await this.getResourceCard(title);
    const approveButton = resourceCard.locator('button:has-text("Approve"), [aria-label="Approve"]').first();
    await approveButton.click();
    await this.expectSuccessToast();
  }

  /**
   * Filter resources by type
   */
  async filterByType(type: string): Promise<void> {
    await this.typeFilter.selectOption(type);
    await this.waitForPageLoad();
  }

  /**
   * Filter resources by visibility
   */
  async filterByVisibility(visibility: string): Promise<void> {
    await this.visibilityFilter.selectOption(visibility);
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
   * Get resource card by title
   */
  async getResourceCard(title: string): Promise<Locator> {
    const card = this.page.locator(`[data-testid="resource-card"]:has-text("${title}"), article:has-text("${title}"), tr:has-text("${title}")`).first();
    await expect(card).toBeVisible({ timeout: 5000 });
    return card;
  }

  /**
   * Get resource by title
   */
  async getResourceByTitle(title: string): Promise<{
    title: string;
    type: string;
    visibility: string;
    status?: string;
  } | null> {
    try {
      const card = await this.getResourceCard(title);
      const typeElement = card.locator('[data-testid="resource-type"]').first();
      const visibilityElement = card.locator('[data-testid="resource-visibility"]').first();
      const statusElement = card.locator('[data-testid="resource-status"]').first();

      return {
        title,
        type: await typeElement.textContent() || '',
        visibility: await visibilityElement.textContent() || '',
        status: await statusElement.textContent() || undefined,
      };
    } catch {
      return null;
    }
  }

  /**
   * Check if resource exists
   */
  async hasResource(title: string): Promise<boolean> {
    const card = this.page.locator(`[data-testid="resource-card"]:has-text("${title}"), article:has-text("${title}")`).first();
    return card.isVisible({ timeout: 2000 }).catch(() => false);
  }

  /**
   * View resource details
   */
  async viewResource(title: string): Promise<void> {
    const card = await this.getResourceCard(title);
    await card.click();
    await this.waitForPageLoad();
  }

  /**
   * Clear all filters
   */
  async clearFilters(): Promise<void> {
    await this.typeFilter.selectOption('');
    await this.visibilityFilter.selectOption('');
    await this.tagFilter.selectOption('');
    await this.waitForPageLoad();
  }

  /**
   * Search for resources
   */
  async searchResources(query: string): Promise<void> {
    await this.search(query);
  }

  /**
   * Get pending approval count
   */
  async getPendingApprovalCount(): Promise<number> {
    const pendingBadge = this.page.locator('[data-testid="pending-count"], .badge:has-text("Pending")').first();
    const text = await pendingBadge.textContent();
    return parseInt(text?.match(/\d+/)?.[0] || '0');
  }
}
