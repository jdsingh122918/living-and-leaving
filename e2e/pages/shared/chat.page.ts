/**
 * Chat Page Object Model
 * Handles chat and messaging interactions
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';

export class ChatPage extends BasePage {
  readonly conversationList: Locator;
  readonly messageInput: Locator;
  readonly sendButton: Locator;
  readonly reactionButtons: Locator;
  readonly messagesList: Locator;
  readonly newConversationButton: Locator;
  readonly typingIndicator: Locator;

  constructor(page: Page) {
    super(page);
    this.conversationList = page.locator('[data-testid="conversation-list"], [class*="conversations"]').first();
    this.messageInput = page.locator('textarea[placeholder*="message"], input[placeholder*="message"]').first();
    this.sendButton = page.locator('button[type="submit"], button[aria-label*="Send"]').first();
    this.reactionButtons = page.locator('[data-testid="reaction-buttons"], [class*="reactions"]').first();
    this.messagesList = page.locator('[data-testid="messages-list"], [class*="messages"]').first();
    this.newConversationButton = page.getByRole('button', { name: /new conversation|new chat/i }).first();
    this.typingIndicator = page.locator('[data-testid="typing-indicator"]').first();
  }

  /**
   * Navigate to chat page
   */
  async goto(): Promise<void> {
    await super.goto('/chat');
  }

  /**
   * Select a conversation by participant name
   */
  async selectConversation(participantName: string): Promise<void> {
    const conversation = this.conversationList.locator(`[data-testid="conversation"]:has-text("${participantName}"), li:has-text("${participantName}")`).first();
    await conversation.click();
    await this.waitForPageLoad();
  }

  /**
   * Send a message
   */
  async sendMessage(message: string): Promise<void> {
    await this.messageInput.fill(message);
    await this.sendButton.click();
    // Wait for message to appear in list
    await this.page.waitForTimeout(500);
  }

  /**
   * Add reaction to a message
   */
  async addReaction(messageText: string, emoji: string): Promise<void> {
    const messageElement = this.messagesList.locator(`[data-testid="message"]:has-text("${messageText}")`).first();
    await messageElement.hover();
    const reactionButton = messageElement.locator(`[data-testid="reaction-${emoji}"], button[aria-label*="${emoji}"]`).first();
    await reactionButton.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Create new conversation
   */
  async createConversation(participants: string[]): Promise<void> {
    await this.newConversationButton.click();

    // Select participants
    for (const participant of participants) {
      const checkbox = this.page.locator(`input[type="checkbox"][value*="${participant}"]`).first();
      await checkbox.check();
    }

    await this.clickButton('Create');
    await this.expectSuccessToast();
  }

  /**
   * Get all messages in current conversation
   */
  async getMessages(): Promise<Array<{
    sender: string;
    text: string;
    timestamp: string;
  }>> {
    const messages = this.messagesList.locator('[data-testid="message"]');
    const count = await messages.count();
    const messageList: Array<{ sender: string; text: string; timestamp: string }> = [];

    for (let i = 0; i < count; i++) {
      const message = messages.nth(i);
      const sender = await message.locator('[data-testid="sender-name"]').textContent() || '';
      const text = await message.locator('[data-testid="message-text"]').textContent() || '';
      const timestamp = await message.locator('[data-testid="message-timestamp"]').textContent() || '';

      messageList.push({
        sender: sender.trim(),
        text: text.trim(),
        timestamp: timestamp.trim(),
      });
    }

    return messageList;
  }

  /**
   * Get conversations list
   */
  async getConversations(): Promise<Array<{
    participant: string;
    lastMessage: string;
    unreadCount?: number;
  }>> {
    const conversations = this.conversationList.locator('[data-testid="conversation"], li');
    const count = await conversations.count();
    const conversationList: Array<{ participant: string; lastMessage: string; unreadCount?: number }> = [];

    for (let i = 0; i < count; i++) {
      const conversation = conversations.nth(i);
      const participant = await conversation.locator('[data-testid="participant-name"]').textContent() || '';
      const lastMessage = await conversation.locator('[data-testid="last-message"]').textContent() || '';
      const unreadBadge = conversation.locator('[data-testid="unread-count"]');
      const unreadText = await unreadBadge.isVisible() ? await unreadBadge.textContent() : undefined;
      const unreadCount = unreadText ? parseInt(unreadText) : undefined;

      conversationList.push({
        participant: participant.trim(),
        lastMessage: lastMessage.trim(),
        unreadCount,
      });
    }

    return conversationList;
  }

  /**
   * Check if conversation exists
   */
  async hasConversation(participantName: string): Promise<boolean> {
    const conversation = this.conversationList.locator(`[data-testid="conversation"]:has-text("${participantName}")`).first();
    return conversation.isVisible({ timeout: 2000 }).catch(() => false);
  }

  /**
   * Check if typing indicator is visible
   */
  async isTypingIndicatorVisible(): Promise<boolean> {
    return this.typingIndicator.isVisible({ timeout: 1000 }).catch(() => false);
  }

  /**
   * Wait for message to appear
   */
  async waitForMessage(messageText: string, timeout = 5000): Promise<void> {
    const message = this.messagesList.locator(`[data-testid="message"]:has-text("${messageText}")`).first();
    await expect(message).toBeVisible({ timeout });
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageText: string): Promise<void> {
    const messageElement = this.messagesList.locator(`[data-testid="message"]:has-text("${messageText}")`).first();
    await messageElement.hover();
    const deleteButton = messageElement.locator('button[aria-label*="Delete"]').first();
    await deleteButton.click();
    await this.confirmDialog();
  }

  /**
   * Search messages
   */
  async searchMessages(query: string): Promise<void> {
    await this.search(query);
  }
}
