/**
 * Forums Page Object Model
 * Handles forum and discussion interactions
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';

export class ForumsPage extends BasePage {
  readonly forumsList: Locator;
  readonly visibilityFilter: Locator;
  readonly newForumButton: Locator;
  readonly joinButton: Locator;
  readonly leaveButton: Locator;
  readonly newPostButton: Locator;

  constructor(page: Page) {
    super(page);
    this.forumsList = page.locator('[data-testid="forums-list"], .forums-grid').first();
    this.visibilityFilter = page.locator('select[name="visibility"], [data-testid="visibility-filter"]').first();
    this.newForumButton = page.getByRole('button', { name: /new forum|create forum/i }).first();
    this.joinButton = page.getByRole('button', { name: /join/i }).first();
    this.leaveButton = page.getByRole('button', { name: /leave/i }).first();
    this.newPostButton = page.getByRole('button', { name: /new post|create post/i }).first();
  }

  /**
   * Navigate to forums page
   */
  async goto(): Promise<void> {
    await super.goto('/forums');
  }

  /**
   * Create a new forum
   */
  async createForum(forumData: {
    title: string;
    description: string;
    visibility: string;
  }): Promise<void> {
    await this.newForumButton.click();
    await this.fillField('Title', forumData.title);
    await this.fillField('Description', forumData.description);
    await this.selectOption('Visibility', forumData.visibility);
    await this.clickButton('Create');
    await this.expectSuccessToast();
  }

  /**
   * Join a forum by title
   */
  async joinForum(forumTitle: string): Promise<void> {
    const forumCard = await this.getForumCard(forumTitle);
    const joinButton = forumCard.locator('button:has-text("Join"), [aria-label="Join"]').first();
    await joinButton.click();
    await this.expectSuccessToast();
  }

  /**
   * Leave a forum by title
   */
  async leaveForum(forumTitle: string): Promise<void> {
    const forumCard = await this.getForumCard(forumTitle);
    const leaveButton = forumCard.locator('button:has-text("Leave"), [aria-label="Leave"]').first();
    await leaveButton.click();
    await this.confirmDialog();
    await this.expectSuccessToast();
  }

  /**
   * Create a new post in a forum
   */
  async createPost(forumTitle: string, postData: {
    title: string;
    content: string;
  }): Promise<void> {
    // First, navigate to the forum
    await this.viewForum(forumTitle);

    // Create new post
    await this.newPostButton.click();
    await this.fillField('Title', postData.title);
    await this.fillField('Content', postData.content);
    await this.clickButton('Post');
    await this.expectSuccessToast();
  }

  /**
   * Vote on a post
   */
  async voteOnPost(postTitle: string, voteType: 'up' | 'down'): Promise<void> {
    const postElement = this.page.locator(`[data-testid="post"]:has-text("${postTitle}"), article:has-text("${postTitle}")`).first();
    const voteButton = postElement.locator(`button[aria-label*="${voteType === 'up' ? 'Upvote' : 'Downvote'}"]`).first();
    await voteButton.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Get forum card by title
   */
  async getForumCard(forumTitle: string): Promise<Locator> {
    const card = this.page.locator(`[data-testid="forum-card"]:has-text("${forumTitle}"), article:has-text("${forumTitle}")`).first();
    await expect(card).toBeVisible({ timeout: 5000 });
    return card;
  }

  /**
   * View forum details
   */
  async viewForum(forumTitle: string): Promise<void> {
    const forumCard = await this.getForumCard(forumTitle);
    await forumCard.click();
    await this.waitForPageLoad();
  }

  /**
   * Filter forums by visibility
   */
  async filterByVisibility(visibility: string): Promise<void> {
    await this.visibilityFilter.selectOption(visibility);
    await this.waitForPageLoad();
  }

  /**
   * Check if forum exists
   */
  async hasForum(forumTitle: string): Promise<boolean> {
    const card = this.page.locator(`[data-testid="forum-card"]:has-text("${forumTitle}")`).first();
    return card.isVisible({ timeout: 2000 }).catch(() => false);
  }

  /**
   * Check if user is member of forum
   */
  async isMemberOfForum(forumTitle: string): Promise<boolean> {
    const forumCard = await this.getForumCard(forumTitle);
    const leaveButton = forumCard.locator('button:has-text("Leave")').first();
    return leaveButton.isVisible({ timeout: 1000 }).catch(() => false);
  }

  /**
   * Get all visible forums
   */
  async getAllForums(): Promise<Array<{
    title: string;
    memberCount: string;
    postCount: string;
    isMember: boolean;
  }>> {
    const cards = this.forumsList.locator('[data-testid="forum-card"], article');
    const count = await cards.count();
    const forums: Array<{ title: string; memberCount: string; postCount: string; isMember: boolean }> = [];

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const title = await card.locator('[data-testid="forum-title"], h3, h4').textContent() || '';
      const memberCount = await card.locator('[data-testid="member-count"]').textContent() || '';
      const postCount = await card.locator('[data-testid="post-count"]').textContent() || '';
      const leaveButton = card.locator('button:has-text("Leave")');
      const isMember = await leaveButton.isVisible().catch(() => false);

      forums.push({
        title: title.trim(),
        memberCount: memberCount.trim(),
        postCount: postCount.trim(),
        isMember,
      });
    }

    return forums;
  }

  /**
   * Get posts in current forum
   */
  async getPosts(): Promise<Array<{
    title: string;
    author: string;
    votes: number;
  }>> {
    const posts = this.page.locator('[data-testid="post"], article.post');
    const count = await posts.count();
    const postList: Array<{ title: string; author: string; votes: number }> = [];

    for (let i = 0; i < count; i++) {
      const post = posts.nth(i);
      const title = await post.locator('[data-testid="post-title"], h3, h4').textContent() || '';
      const author = await post.locator('[data-testid="post-author"]').textContent() || '';
      const votesText = await post.locator('[data-testid="vote-count"]').textContent() || '';
      const votes = parseInt(votesText.match(/-?\d+/)?.[0] || '0');

      postList.push({
        title: title.trim(),
        author: author.trim(),
        votes,
      });
    }

    return postList;
  }

  /**
   * Reply to a post
   */
  async replyToPost(postTitle: string, replyContent: string): Promise<void> {
    const postElement = this.page.locator(`[data-testid="post"]:has-text("${postTitle}")`).first();
    const replyButton = postElement.locator('button:has-text("Reply")').first();
    await replyButton.click();

    await this.fillField('Reply', replyContent);
    await this.clickButton('Post Reply');
    await this.expectSuccessToast();
  }

  /**
   * Search forums
   */
  async searchForums(query: string): Promise<void> {
    await this.search(query);
  }

  /**
   * Clear visibility filter
   */
  async clearVisibilityFilter(): Promise<void> {
    await this.visibilityFilter.selectOption('');
    await this.waitForPageLoad();
  }
}
