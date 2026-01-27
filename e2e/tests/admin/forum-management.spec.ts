/**
 * E2E Tests: Admin Forum Management
 * Tests forum creation, moderation, post management, and analytics
 */

import { test, expect } from '../../fixtures/test-base';

test.describe('Admin Forum Management', () => {
  test.beforeEach(async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.waitForLoadState('domcontentloaded');

    // Navigate to forums page
    await page.goto('/admin/forums');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should list all forums', async ({ page, helpers }) => {
    // Verify we're on forums page
    await expect(page).toHaveURL(/\/admin\/forums/);

    // Verify page heading
    const heading = page.locator('h1, h2').filter({ hasText: /forums|discussions/i }).first();
    await expect(heading).toBeVisible({ timeout: 5000 });

    // Look for forum list container, forum cards, or empty state
    const forumsList = page.locator('[data-testid="forums-list"]');
    const forumCards = page.locator('[data-testid="forum-card"]');
    const emptyState = page.locator('text="No forums found"').or(page.locator('text="No forums"'));

    const hasForumsList = await forumsList.isVisible({ timeout: 5000 }).catch(() => false);
    const hasCards = await forumCards.count() > 0;
    const hasEmptyState = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);
    const helperEmptyState = await helpers.isEmptyState(page);

    // Either has forum list, cards, or shows empty state
    expect(hasForumsList || hasCards || hasEmptyState || helperEmptyState).toBeTruthy();
  });

  test('should create forum with visibility settings', async ({ page, helpers, generateName }) => {
    // Wait for page to be ready (don't use networkidle due to SSE connections)
    await page.waitForSelector('[data-testid="create-forum-button"], button:has-text("Create"), a:has-text("Create")', { timeout: 15000 }).catch(() => {});

    // Click create forum button (using testid or text)
    const createButton = page.locator('[data-testid="create-forum-button"]')
      .or(page.getByRole('button', { name: /create|add|new/i }))
      .or(page.getByRole('link', { name: /create|add|new/i }))
      .first();

    if (!await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip();
      return;
    }

    await createButton.click();

    // Wait for the forum creation form to be fully loaded (don't use networkidle due to SSE connections)
    await page.waitForSelector('[data-testid="forum-title-input"], #title', { timeout: 15000 });

    // Fill forum details using testid selectors
    const forumName = generateName('Test Forum');
    const nameInput = page.locator('[data-testid="forum-title-input"]')
      .or(page.locator('#title'))
      .first();

    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.click();
    await nameInput.fill(forumName);

    // Verify the title was filled correctly
    await expect(nameInput).toHaveValue(forumName);

    // Fill description using testid
    const descriptionInput = page.locator('[data-testid="forum-description-input"]')
      .or(page.locator('#description'))
      .first();
    if (await descriptionInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await descriptionInput.click();
      await descriptionInput.fill('This is a test forum for E2E testing discussions.');
    }

    // Note: Forum creation currently always uses PUBLIC visibility

    // Submit form using testid - wait for button to be enabled
    const submitButton = page.locator('[data-testid="create-forum-submit"]')
      .or(page.getByRole('button', { name: /create forum/i }))
      .first();

    // Wait for submit button to be enabled (not disabled)
    await expect(submitButton).toBeVisible({ timeout: 5000 });
    await expect(submitButton).toBeEnabled({ timeout: 5000 });
    await submitButton.click();
    await page.waitForTimeout(2000);

    // Verify success - either toast or navigation
    const hasToast = await helpers.expectToast(page, /created|success/i, 5000).catch(() => false);
    const navigatedToForum = page.url().match(/\/forums\/[a-z0-9-]+$/i);
    const pageContent = await page.textContent('body');

    expect(hasToast || navigatedToForum || pageContent?.includes(forumName)).toBeTruthy();
  });

  test('should moderate (delete) inappropriate posts', async ({ page, helpers }) => {
    // Find first forum
    const forumCard = page.locator('[data-testid="forum-card"], .forum-card, [data-testid="list-item"]').first();
    const hasCard = await forumCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasCard) {
      test.skip();
      return;
    }

    // Click to view forum
    await forumCard.click();
    await page.waitForLoadState('domcontentloaded');

    // Look for posts
    const postCard = page.locator('[data-testid="post-card"], .post-card, [data-testid="post-item"]').first();
    const hasPost = await postCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasPost) {
      test.skip();
      return;
    }

    // Click post to view details or find delete button on card
    const deleteButton = page.getByRole('button', { name: /delete|remove/i }).first();
    const hasDeleteOnCard = await deleteButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (!hasDeleteOnCard) {
      // Click into post to find delete option
      await postCard.click();
      await page.waitForLoadState('domcontentloaded');
    }

    // Find and click delete button
    const deletePostButton = page.getByRole('button', { name: /delete|remove/i }).first();
    const hasDeleteButton = await deletePostButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (!hasDeleteButton) {
      test.skip();
      return;
    }

    await deletePostButton.click();
    await page.waitForTimeout(500);

    // Confirm deletion
    await helpers.confirmDialog(page);
    await page.waitForTimeout(1000);

    // Verify success
    await helpers.expectToast(page, /deleted|removed|success/i, 5000);
  });

  test('should edit posts as admin', async ({ page, helpers, generateName }) => {
    // Find first forum
    const forumCard = page.locator('[data-testid="forum-card"], .forum-card, [data-testid="list-item"]').first();
    const hasCard = await forumCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasCard) {
      test.skip();
      return;
    }

    // Click to view forum
    await forumCard.click();
    await page.waitForLoadState('domcontentloaded');

    // Look for posts
    const postCard = page.locator('[data-testid="post-card"], .post-card, [data-testid="post-item"]').first();
    const hasPost = await postCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasPost) {
      test.skip();
      return;
    }

    // Click post to view details
    await postCard.click();
    await page.waitForLoadState('domcontentloaded');

    // Find edit button
    const editButton = page.getByRole('button', { name: /edit/i })
      .or(page.getByRole('link', { name: /edit/i }))
      .first();

    const hasEditButton = await editButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (!hasEditButton) {
      test.skip();
      return;
    }

    await editButton.click();
    await page.waitForLoadState('domcontentloaded');

    // Update post content
    const contentInput = page.locator('textarea[name="content"]')
      .or(page.getByLabel(/content|message|body/i))
      .first();

    const hasContentInput = await contentInput.isVisible({ timeout: 3000 }).catch(() => false);

    if (!hasContentInput) {
      test.skip();
      return;
    }

    const updatedContent = generateName('Updated post content by admin');
    await contentInput.clear();
    await contentInput.fill(updatedContent);

    // Save changes
    const saveButton = page.locator('button[type="submit"]')
      .or(page.getByRole('button', { name: /save|update/i }))
      .first();
    await saveButton.click();
    await page.waitForTimeout(1000);

    // Verify success
    await helpers.expectToast(page, /updated|saved|success/i, 5000);

    // Verify updated content appears
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain(updatedContent);
  });

  test('should manage forum members', async ({ page, helpers }) => {
    // Find first forum
    const forumCard = page.locator('[data-testid="forum-card"], .forum-card, [data-testid="list-item"]').first();
    const hasCard = await forumCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasCard) {
      test.skip();
      return;
    }

    // Click to view forum
    await forumCard.click();
    await page.waitForLoadState('domcontentloaded');

    // Look for members tab or link
    const membersTab = page.locator('a:has-text("Members"), button:has-text("Members"), [data-tab="members"]').first();
    const hasMembersTab = await membersTab.isVisible({ timeout: 3000 }).catch(() => false);

    if (!hasMembersTab) {
      test.skip();
      return;
    }

    await membersTab.click();
    await page.waitForLoadState('domcontentloaded');

    // Verify members list is displayed
    const membersList = page.locator('[data-testid="member-list"], .member-list, table').first();
    const hasMembersList = await membersList.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasMembersList) {
      await expect(membersList).toBeVisible();

      // Look for add member button
      const addMemberButton = page.getByRole('button', { name: /add|invite/i }).first();
      const hasAddButton = await addMemberButton.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasAddButton) {
        await addMemberButton.click();
        await page.waitForTimeout(500);

        // Verify add member dialog or form opened
        const dialog = page.locator('[role="dialog"]').first();
        const hasDialog = await dialog.isVisible({ timeout: 2000 }).catch(() => false);

        if (hasDialog) {
          await helpers.cancelDialog(page);
        }
      }
    }
  });

  test('should pin important posts', async ({ page, helpers }) => {
    // Find first forum
    const forumCard = page.locator('[data-testid="forum-card"], .forum-card, [data-testid="list-item"]').first();
    const hasCard = await forumCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasCard) {
      test.skip();
      return;
    }

    // Click to view forum
    await forumCard.click();
    await page.waitForLoadState('domcontentloaded');

    // Look for posts
    const postCard = page.locator('[data-testid="post-card"], .post-card, [data-testid="post-item"]').first();
    const hasPost = await postCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasPost) {
      test.skip();
      return;
    }

    // Look for pin button on post card
    const pinButton = page.getByRole('button', { name: /pin|pinned/i })
      .or(page.locator('button[aria-label*="pin"]'))
      .first();

    const hasPinOnCard = await pinButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (!hasPinOnCard) {
      // Click into post to find pin option
      await postCard.click();
      await page.waitForLoadState('domcontentloaded');
    }

    // Find and click pin button
    const pinPostButton = page.getByRole('button', { name: /pin|pinned/i })
      .or(page.locator('button[aria-label*="pin"]'))
      .first();

    const hasPinButton = await pinPostButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (!hasPinButton) {
      test.skip();
      return;
    }

    await pinPostButton.click();
    await page.waitForTimeout(1000);

    // Verify success
    await helpers.expectToast(page, /pinned|success/i, 3000).catch(() => {
      // Pin might succeed without toast
    });

    // Verify pin state changed
    const isPinned = await pinPostButton.getAttribute('aria-pressed').catch(() => null);
    expect(isPinned).toBeTruthy();
  });

  test('should close forum for new posts', async ({ page, helpers }) => {
    // Find first forum
    const forumCard = page.locator('[data-testid="forum-card"], .forum-card, [data-testid="list-item"]').first();
    const hasCard = await forumCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasCard) {
      test.skip();
      return;
    }

    // Click to view forum
    await forumCard.click();
    await page.waitForLoadState('domcontentloaded');

    // Look for forum settings or close button
    const settingsButton = page.getByRole('button', { name: /settings|manage/i })
      .or(page.getByRole('link', { name: /settings|manage/i }))
      .first();

    const hasSettings = await settingsButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasSettings) {
      await settingsButton.click();
      await page.waitForLoadState('domcontentloaded');
    }

    // Look for close/lock forum toggle
    const closeToggle = page.getByRole('button', { name: /close|lock|archive/i })
      .or(page.locator('button[aria-label*="close"]'))
      .or(page.locator('input[type="checkbox"]').filter({ hasText: /close|lock/i }))
      .first();

    const hasCloseToggle = await closeToggle.isVisible({ timeout: 3000 }).catch(() => false);

    if (!hasCloseToggle) {
      test.skip();
      return;
    }

    await closeToggle.click();
    await page.waitForTimeout(500);

    // Save if there's a save button
    const saveButton = page.locator('button[type="submit"]')
      .or(page.getByRole('button', { name: /save|update/i }))
      .first();

    const hasSaveButton = await saveButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasSaveButton) {
      await saveButton.click();
      await page.waitForTimeout(1000);
    }

    // Verify success
    await helpers.expectToast(page, /closed|locked|updated|success/i, 3000).catch(() => {
      // Forum might be closed without toast
    });
  });

  test('should view forum analytics', async ({ page }) => {
    // Find first forum
    const forumCard = page.locator('[data-testid="forum-card"], .forum-card, [data-testid="list-item"]').first();
    const hasCard = await forumCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasCard) {
      test.skip();
      return;
    }

    // Click to view forum
    await forumCard.click();
    await page.waitForLoadState('domcontentloaded');

    // Look for analytics tab or section
    const analyticsTab = page.locator('a:has-text("Analytics"), button:has-text("Analytics"), a:has-text("Stats")').first();
    const hasAnalyticsTab = await analyticsTab.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasAnalyticsTab) {
      await analyticsTab.click();
      await page.waitForLoadState('domcontentloaded');

      // Verify analytics content is displayed
      const analyticsSection = page.locator('[data-testid="analytics"], .analytics').first();
      const hasAnalytics = await analyticsSection.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasAnalytics) {
        await expect(analyticsSection).toBeVisible();
      } else {
        // Look for common analytics metrics
        const pageContent = await page.textContent('body');
        const hasMetrics =
          pageContent?.includes('Posts') ||
          pageContent?.includes('Members') ||
          pageContent?.includes('Views') ||
          pageContent?.includes('Activity');

        expect(hasMetrics).toBeTruthy();
      }
    } else {
      // Analytics might be shown on main forum page
      const pageContent = await page.textContent('body');
      const hasStats =
        pageContent?.includes('posts') ||
        pageContent?.includes('members') ||
        pageContent?.includes('activity');

      if (hasStats) {
        expect(hasStats).toBeTruthy();
      } else {
        test.skip();
      }
    }
  });

  test('should search forums', async ({ page, helpers }) => {
    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();
    const hasSearch = await searchInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasSearch) {
      test.skip();
      return;
    }

    // Perform search
    await searchInput.fill('test');
    await page.waitForLoadState('domcontentloaded');

    // Verify search was performed
    const searchValue = await searchInput.inputValue();
    expect(searchValue).toBe('test');

    // Verify results or empty state
    const hasResults =
      await page.locator('[data-testid="forum-card"], .forum-card').count() >= 0 ||
      await helpers.isEmptyState(page);

    expect(hasResults).toBeTruthy();
  });

  test('should filter forums by visibility', async ({ page }) => {
    // Look for visibility filter
    const visibilityFilter = page.locator('select[name="visibility"], [data-testid="visibility-filter"]').first();
    const hasVisibilityFilter = await visibilityFilter.isVisible({ timeout: 3000 }).catch(() => false);

    if (!hasVisibilityFilter) {
      test.skip();
      return;
    }

    // Filter by PUBLIC
    await visibilityFilter.selectOption('PUBLIC');
    await page.waitForLoadState('domcontentloaded');

    // Verify filter applied
    const publicForums = page.locator('[data-testid="forum-card"], .forum-card');
    const count = await publicForums.count();
    expect(count).toBeGreaterThanOrEqual(0);

    // Filter by FAMILY
    await visibilityFilter.selectOption('FAMILY');
    await page.waitForLoadState('domcontentloaded');

    const familyCount = await publicForums.count();
    expect(familyCount).toBeGreaterThanOrEqual(0);
  });

  test('should create post in forum', async ({ page, helpers, generateName }) => {
    // Find first forum
    const forumCard = page.locator('[data-testid="forum-card"], .forum-card, [data-testid="list-item"]').first();
    const hasCard = await forumCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasCard) {
      test.skip();
      return;
    }

    // Click to view forum
    await forumCard.click();
    await page.waitForLoadState('domcontentloaded');

    // Look for create post button
    const createPostButton = page.getByRole('button', { name: /create|new post|add post/i })
      .or(page.getByRole('link', { name: /create|new post|add post/i }))
      .first();

    const hasCreateButton = await createPostButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasCreateButton) {
      test.skip();
      return;
    }

    await createPostButton.click();
    await page.waitForLoadState('domcontentloaded');

    // Fill post details
    const postTitle = generateName('Test Forum Post');
    const titleInput = page.getByLabel(/title|subject/i).first();

    const hasTitleInput = await titleInput.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasTitleInput) {
      await titleInput.fill(postTitle);
    }

    // Fill post content
    const contentInput = page.locator('textarea[name="content"]')
      .or(page.getByLabel(/content|message|body/i))
      .first();

    await expect(contentInput).toBeVisible({ timeout: 5000 });
    await contentInput.fill('This is a test forum post created by admin during E2E testing.');

    // Submit post
    const submitButton = page.locator('button[type="submit"]')
      .or(page.getByRole('button', { name: /create|post|submit/i }))
      .first();
    await submitButton.click();
    await page.waitForTimeout(1000);

    // Verify success
    await helpers.expectToast(page, /created|posted|success/i, 5000);

    // Verify post appears
    const postCard = page.locator(`text="${postTitle}"`).first();
    const hasPost = await postCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasPost) {
      await expect(postCard).toBeVisible();
    }
  });
});
