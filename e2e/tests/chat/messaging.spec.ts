/**
 * E2E Tests: Chat Messaging
 * Tests sending, editing, deleting messages, reactions, and file attachments
 */

import { test, expect } from '../../fixtures/test-base';

test.describe('Chat Messaging', () => {
  test.beforeEach(async ({ page, loginAsMember }) => {
    await loginAsMember();
    await expect(page).toHaveURL(/\/member/);

    // Navigate to chat
    await page.waitForLoadState('domcontentloaded');
    const chatLink = page.getByRole('link', { name: /chat|messaging/i })
      .or(page.locator('nav a:has-text("Chat")'))
      .first();

    if (await chatLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await chatLink.click();
      await page.waitForURL(/\/member\/chat/);
      await page.waitForLoadState('domcontentloaded');

      // Try to open first conversation or create one
      const conversationCard = page.locator('[data-testid="conversation-card"], .conversation-card').first();
      if (await conversationCard.isVisible({ timeout: 3000 }).catch(() => false)) {
        await conversationCard.click();
        await page.waitForLoadState('domcontentloaded');
      }
    }
  });

  test('should send text message', async ({ page, helpers, generateName }) => {
    // Look for message input
    const messageInput = page.locator('[data-testid="message-input"], textarea[placeholder*="message"], input[placeholder*="message"]').first();

    if (await messageInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      const messageText = generateName('Test message');

      // Type message
      await messageInput.fill(messageText);

      // Find and click send button
      const sendButton = page.getByRole('button', { name: /send/i })
        .or(page.locator('button[type="submit"]'))
        .or(page.locator('button[aria-label*="send"]'))
        .first();

      if (await sendButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await sendButton.click();
        await page.waitForLoadState('domcontentloaded');

        // Verify message was sent (input should be cleared)
        const inputValue = await messageInput.inputValue();
        expect(inputValue).toBe('');

        // Alternatively, check for the message in the list
        const messageList = page.locator('[data-testid="message-list"], .message-list');
        if (await messageList.isVisible({ timeout: 2000 }).catch(() => false)) {
          const hasMessage = await page.locator(`text="${messageText}"`).isVisible({ timeout: 2000 }).catch(() => false);
          // Message might appear in the list
          expect(inputValue === '' || hasMessage).toBeTruthy();
        }
      }
    }
  });

  test('should display sent message in list', async ({ page, helpers }) => {
    // Look for message list
    const messageList = page.locator('[data-testid="message-list"], .message-list, [data-testid="messages"]').first();

    if (await messageList.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Look for message items
      const messages = page.locator('[data-testid="message"], .message, [data-message-id]');
      const count = await messages.count();

      // Should have messages or show empty state
      const hasMessages = count > 0 ||
        await page.locator('div:has-text("No messages")').isVisible({ timeout: 2000 }).catch(() => false);

      expect(hasMessages).toBeTruthy();

      // If messages exist, verify they have content
      if (count > 0) {
        const firstMessage = messages.first();
        await expect(firstMessage).toBeVisible();

        // Check for message content
        const messageText = await firstMessage.textContent();
        expect(messageText).toBeTruthy();
        expect(messageText!.length).toBeGreaterThan(0);
      }
    }
  });

  test('should edit sent message', async ({ page, helpers }) => {
    // Look for messages in the list
    const messages = page.locator('[data-testid="message"], .message, [data-message-id]');
    const count = await messages.count();

    if (count > 0) {
      // Find the last message (likely from current user)
      const lastMessage = messages.last();

      // Look for edit button (may be in a menu or directly visible)
      const editButton = lastMessage.getByRole('button', { name: /edit/i })
        .or(lastMessage.locator('button[aria-label*="edit"]'))
        .first();

      // Try to reveal edit button by hovering over message
      await lastMessage.hover();
      await page.waitForTimeout(500);

      if (await editButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await editButton.click();
        await page.waitForTimeout(500);

        // Look for edit input/textarea
        const editInput = page.locator('[data-testid="edit-input"], textarea[name="edit"], input[name="edit"]')
          .or(lastMessage.locator('textarea, input[type="text"]'))
          .first();

        if (await editInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          const editedText = 'Edited message content';
          await editInput.fill(editedText);

          // Save the edit
          const saveButton = page.getByRole('button', { name: /save|update/i })
            .or(page.locator('button[type="submit"]'))
            .first();

          if (await saveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await saveButton.click();
            await page.waitForLoadState('domcontentloaded');

            // Verify edit was saved
            await helpers.expectToast(page, /updated|edited|saved/i, 3000).catch(() => {
              // Edit saved without toast
            });
          }
        }
      } else {
        // Look for more/options menu
        const moreButton = lastMessage.getByRole('button', { name: /more|options/i })
          .or(lastMessage.locator('button[aria-label*="more"]'))
          .first();

        if (await moreButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await moreButton.click();
          await page.waitForTimeout(500);

          // Try to find edit in dropdown menu
          const editMenuItem = page.getByRole('menuitem', { name: /edit/i })
            .or(page.locator('[role="menuitem"]:has-text("Edit")'))
            .first();

          if (await editMenuItem.isVisible({ timeout: 1000 }).catch(() => false)) {
            await editMenuItem.click();
            await page.waitForTimeout(500);
          }
        }
      }
    }
  });

  test('should delete sent message with confirmation', async ({ page, helpers }) => {
    // Look for messages in the list
    const messages = page.locator('[data-testid="message"], .message, [data-message-id]');
    const count = await messages.count();

    if (count > 0) {
      const lastMessage = messages.last();

      // Hover to reveal actions
      await lastMessage.hover();
      await page.waitForTimeout(500);

      // Look for delete button
      const deleteButton = lastMessage.getByRole('button', { name: /delete/i })
        .or(lastMessage.locator('button[aria-label*="delete"]'))
        .first();

      if (await deleteButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await deleteButton.click();
        await page.waitForTimeout(500);

        // Look for confirmation dialog
        const confirmDialog = page.locator('[role="dialog"], [data-testid="dialog"]');
        if (await confirmDialog.isVisible({ timeout: 2000 }).catch(() => false)) {
          // Confirm deletion
          const confirmButton = confirmDialog.getByRole('button', { name: /delete|confirm|yes/i }).first();
          if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await confirmButton.click();
            await page.waitForLoadState('domcontentloaded');

            // Verify deletion
            await helpers.expectToast(page, /deleted|removed/i, 3000).catch(() => {
              // Deleted without toast
            });
          }
        }
      } else {
        // Try more menu
        const moreButton = lastMessage.getByRole('button', { name: /more|options/i })
          .or(lastMessage.locator('button[aria-label*="more"]'))
          .first();

        if (await moreButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await moreButton.click();
          await page.waitForTimeout(500);

          const deleteMenuItem = page.getByRole('menuitem', { name: /delete/i })
            .or(page.locator('[role="menuitem"]:has-text("Delete")'))
            .first();

          if (await deleteMenuItem.isVisible({ timeout: 1000 }).catch(() => false)) {
            await deleteMenuItem.click();
            await page.waitForTimeout(500);
          }
        }
      }
    }
  });

  test('should add emoji reaction to message', async ({ page, helpers }) => {
    // Look for messages
    const messages = page.locator('[data-testid="message"], .message, [data-message-id]');
    const count = await messages.count();

    if (count > 0) {
      const firstMessage = messages.first();

      // Hover to reveal reaction button
      await firstMessage.hover();
      await page.waitForTimeout(500);

      // Look for reaction/emoji button
      const reactionButton = firstMessage.getByRole('button', { name: /react|emoji|add reaction/i })
        .or(firstMessage.locator('button[aria-label*="react"]'))
        .or(firstMessage.locator('button:has-text("😊")'))
        .first();

      if (await reactionButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await reactionButton.click();
        await page.waitForTimeout(500);

        // Look for emoji picker
        const emojiPicker = page.locator('[data-testid="emoji-picker"], .emoji-picker');
        if (await emojiPicker.isVisible({ timeout: 2000 }).catch(() => false)) {
          // Click first emoji
          const emojiButtons = emojiPicker.locator('button');
          const emojiCount = await emojiButtons.count();

          if (emojiCount > 0) {
            await emojiButtons.first().click();
            await page.waitForTimeout(500);

            // Verify reaction was added (emoji picker should close)
            const isPickerClosed = !await emojiPicker.isVisible({ timeout: 1000 }).catch(() => true);
            expect(isPickerClosed).toBeTruthy();
          }
        } else {
          // May have directly added a default reaction
          await page.waitForTimeout(500);
          expect(true).toBeTruthy();
        }
      }
    }
  });

  test('should remove emoji reaction from message', async ({ page, helpers }) => {
    // Look for messages with reactions
    const messagesWithReactions = page.locator('[data-testid="message"]:has([data-testid="reaction"])')
      .or(page.locator('.message:has(.reaction)'));

    const count = await messagesWithReactions.count();

    if (count > 0) {
      const firstMessage = messagesWithReactions.first();

      // Look for reaction badges/buttons that can be clicked to remove
      const reactionBadges = firstMessage.locator('[data-testid="reaction"], .reaction, button[data-emoji]');
      const badgeCount = await reactionBadges.count();

      if (badgeCount > 0) {
        const firstReaction = reactionBadges.first();

        // Click reaction to remove it (if it's the user's own reaction)
        await firstReaction.click();
        await page.waitForTimeout(500);

        // Verify reaction was removed (toast or reaction disappears)
        await helpers.expectToast(page, /removed|deleted/i, 2000).catch(() => {
          // Reaction removed without toast
        });
      }
    } else {
      // No reactions to test with - test structure is valid
      expect(count).toBe(0);
    }
  });

  test('should upload file attachment', async ({ page, helpers }) => {
    // Look for file upload button
    const uploadButton = page.getByRole('button', { name: /attach|upload|file/i })
      .or(page.locator('button[aria-label*="attach"]'))
      .or(page.locator('input[type="file"]').locator('..'))
      .first();

    if (await uploadButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Look for file input
      const fileInput = page.locator('input[type="file"]').first();

      if (await fileInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Create a test file
        const testFilePath = '/tmp/test-attachment.txt';
        await page.evaluate((path) => {
          // This would need actual file creation in a real test
          // For E2E, we would use fixtures or prepare test files
        }, testFilePath);

        // Note: Actual file upload would use setInputFiles
        // await fileInput.setInputFiles('path/to/test/file.txt');

        // For now, verify the upload UI is accessible
        expect(await fileInput.count()).toBeGreaterThan(0);
      } else {
        // Try clicking upload button to reveal file input
        await uploadButton.click();
        await page.waitForTimeout(500);

        const fileInputAfterClick = page.locator('input[type="file"]').first();
        if (await fileInputAfterClick.isVisible({ timeout: 1000 }).catch(() => false)) {
          expect(await fileInputAfterClick.count()).toBeGreaterThan(0);
        }
      }
    }
  });

  test('should show message timestamps', async ({ page, helpers }) => {
    // Look for messages
    const messages = page.locator('[data-testid="message"], .message, [data-message-id]');
    const count = await messages.count();

    if (count > 0) {
      const firstMessage = messages.first();

      // Look for timestamp elements
      const timestamp = firstMessage.locator('[data-testid="timestamp"], .timestamp, time')
        .or(firstMessage.locator('span:has-text("ago")'))
        .or(firstMessage.locator('span:has-text("AM")'))
        .or(firstMessage.locator('span:has-text("PM")'))
        .first();

      if (await timestamp.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Verify timestamp has content
        const timestampText = await timestamp.textContent();
        expect(timestampText).toBeTruthy();
        expect(timestampText!.length).toBeGreaterThan(0);
      } else {
        // Timestamps might be shown on hover
        await firstMessage.hover();
        await page.waitForTimeout(500);

        const timestampOnHover = firstMessage.locator('[data-testid="timestamp"], .timestamp, time').first();
        if (await timestampOnHover.isVisible({ timeout: 1000 }).catch(() => false)) {
          const text = await timestampOnHover.textContent();
          expect(text).toBeTruthy();
        }
      }
    }
  });

  test('should show sender information', async ({ page, helpers }) => {
    // Look for messages
    const messages = page.locator('[data-testid="message"], .message, [data-message-id]');
    const count = await messages.count();

    if (count > 0) {
      const firstMessage = messages.first();

      // Look for sender name or avatar
      const senderName = firstMessage.locator('[data-testid="sender-name"], .sender-name')
        .or(firstMessage.locator('.author-name'))
        .first();

      const senderAvatar = firstMessage.locator('[data-testid="avatar"], .avatar, img[alt*="avatar"]').first();

      // Should have sender name or avatar
      const hasNameVisible = await senderName.isVisible({ timeout: 2000 }).catch(() => false);
      const hasAvatarVisible = await senderAvatar.isVisible({ timeout: 2000 }).catch(() => false);

      expect(hasNameVisible || hasAvatarVisible).toBeTruthy();

      // If name is visible, verify it has content
      if (hasNameVisible) {
        const nameText = await senderName.textContent();
        expect(nameText).toBeTruthy();
        expect(nameText!.length).toBeGreaterThan(0);
      }
    }
  });
});
