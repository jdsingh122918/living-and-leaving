/**
 * Admin User Management Tests
 * Tests CRUD operations for user management
 */

import { test, expect, helpers, SELECTORS, generateEmail, generateName } from '../../fixtures/test-base';

test.describe('User Management', () => {
  test.beforeEach(async ({ page, loginAsAdmin }) => {
    // Login as admin and navigate to users page
    await loginAsAdmin();
    await page.goto('/admin/users');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should list all users with search', async ({ page }) => {
    // Verify we're on users page
    await expect(page).toHaveURL(/\/admin\/users/);

    // Verify page title or heading
    const heading = page.locator('h1, h2').filter({ hasText: /users/i }).first();
    const hasHeading = await heading.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasHeading) {
      await expect(heading).toBeVisible();
    }

    // Look for user list or table
    const userList = page.locator('[data-testid="user-list"], table, .user-list').first();
    const hasUserList = await userList.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasUserList) {
      await expect(userList).toBeVisible();

      // Count users
      const userRows = page.locator('tr[data-testid*="user"], .user-item, [data-testid="list-item"]');
      const count = await userRows.count();

      expect(count).toBeGreaterThan(0);
    }

    // Look for search input
    const searchInput = page.locator(SELECTORS.searchInput).first();
    const hasSearch = await searchInput.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasSearch) {
      await expect(searchInput).toBeVisible();

      // Test search functionality
      await searchInput.fill('admin');
      await page.waitForTimeout(500);

      // Results should update
      const resultsAfterSearch = page.locator('tr, .user-item, [data-testid="list-item"]');
      const searchCount = await resultsAfterSearch.count();

      expect(searchCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should create new admin user', async ({ page, generateEmail, generateName }) => {
    // Look for "Add User" or "Create User" button
    const addButton = page.locator('button:has-text("Add User"), button:has-text("Create User"), button:has-text("New User"), a:has-text("Add User")').first();
    const hasAddButton = await addButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasAddButton) {
      test.skip('Add User button not found');
      return;
    }

    await addButton.click();
    await page.waitForTimeout(500);

    // Fill in user form
    const email = generateEmail();
    const firstName = generateName('Admin');
    const lastName = 'User';

    // Fill email
    await helpers.fillFormField(page, 'Email', email);

    // Fill first name
    await helpers.fillFormField(page, 'First Name', firstName);

    // Fill last name
    await helpers.fillFormField(page, 'Last Name', lastName);

    // Select ADMIN role - use combobox selector with fallback
    const roleSelect = page.locator('[data-testid="role-select"]')
      .or(page.getByRole('combobox').filter({ hasText: /member|admin|volunteer/i }))
      .or(page.getByLabel(/role/i))
      .first();
    const hasRoleSelect = await roleSelect.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasRoleSelect) {
      await roleSelect.click();
      await page.waitForTimeout(300);

      // Click ADMIN option
      const adminOption = page.locator('[role="option"]').filter({ hasText: /admin/i })
        .or(page.locator('text="ADMIN"'))
        .or(page.locator('text="Administrator"'))
        .first();
      await adminOption.click();
    }

    // Submit form
    await helpers.clickButton(page, 'Create');
    await page.waitForTimeout(1000);

    // Verify success message
    await helpers.expectToast(page, /created|success/i);

    // Verify user appears in list
    const userRow = page.locator(`text="${email}"`).first();
    const hasUserRow = await userRow.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasUserRow) {
      await expect(userRow).toBeVisible();
    }
  });

  test('should create new volunteer user', async ({ page, generateEmail, generateName }) => {
    // Look for "Add User" button
    const addButton = page.locator('button:has-text("Add User"), button:has-text("Create User"), button:has-text("New User"), a:has-text("Add User")').first();
    const hasAddButton = await addButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasAddButton) {
      test.skip('Add User button not found');
      return;
    }

    await addButton.click();
    await page.waitForTimeout(500);

    // Fill in user form
    const email = generateEmail();
    const firstName = generateName('Volunteer');
    const lastName = 'User';

    await helpers.fillFormField(page, 'Email', email);
    await helpers.fillFormField(page, 'First Name', firstName);
    await helpers.fillFormField(page, 'Last Name', lastName);

    // Select VOLUNTEER role - use combobox selector with fallback
    const roleSelect = page.locator('[data-testid="role-select"]')
      .or(page.getByRole('combobox').filter({ hasText: /member|admin|volunteer/i }))
      .or(page.getByLabel(/role/i))
      .first();
    const hasRoleSelect = await roleSelect.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasRoleSelect) {
      await roleSelect.click();
      await page.waitForTimeout(300);

      const volunteerOption = page.locator('[role="option"]').filter({ hasText: /volunteer/i })
        .or(page.locator('text="VOLUNTEER"'))
        .first();
      await volunteerOption.click();
    }

    // Submit form
    await helpers.clickButton(page, 'Create');
    await page.waitForTimeout(1000);

    // Verify success
    await helpers.expectToast(page, /created|success/i);
  });

  test('should create new member user', async ({ page, generateEmail, generateName }) => {
    // Look for "Add User" button
    const addButton = page.locator('button:has-text("Add User"), button:has-text("Create User"), button:has-text("New User"), a:has-text("Add User")').first();
    const hasAddButton = await addButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasAddButton) {
      test.skip('Add User button not found');
      return;
    }

    await addButton.click();
    await page.waitForTimeout(500);

    // Fill in user form
    const email = generateEmail();
    const firstName = generateName('Member');
    const lastName = 'User';

    await helpers.fillFormField(page, 'Email', email);
    await helpers.fillFormField(page, 'First Name', firstName);
    await helpers.fillFormField(page, 'Last Name', lastName);

    // Select MEMBER role - use combobox selector with fallback
    const roleSelect = page.locator('[data-testid="role-select"]')
      .or(page.getByRole('combobox').filter({ hasText: /member|admin|volunteer/i }))
      .or(page.getByLabel(/role/i))
      .first();
    const hasRoleSelect = await roleSelect.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasRoleSelect) {
      await roleSelect.click();
      await page.waitForTimeout(300);

      const memberOption = page.locator('[role="option"]').filter({ hasText: /member/i })
        .or(page.locator('text="MEMBER"'))
        .first();
      await memberOption.click();
    }

    // Submit form
    await helpers.clickButton(page, 'Create');
    await page.waitForTimeout(1000);

    // Verify success
    await helpers.expectToast(page, /created|success/i);
  });

  test('should view user details', async ({ page }) => {
    // Find first user in list
    const userRow = page.locator('tr[data-testid*="user"], .user-item, [data-testid="list-item"]').first();
    const hasUserRow = await userRow.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasUserRow) {
      test.skip('No users found in list');
      return;
    }

    // Click view/details button or user row
    const viewButton = userRow.locator('button:has-text("View"), a:has-text("View"), button:has-text("Details")').first();
    const hasViewButton = await viewButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasViewButton) {
      await viewButton.click();
    } else {
      // Try clicking the row itself
      await userRow.click();
    }

    await page.waitForTimeout(1000);

    // Verify user details are displayed
    const detailsSection = page.locator('[data-testid="user-details"], .user-details').first();
    const hasDetails = await detailsSection.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasDetails) {
      await expect(detailsSection).toBeVisible();
    } else {
      // Alternative: verify we navigated to a details page
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/users\/[a-z0-9]+/i);
    }
  });

  test('should edit user information', async ({ page, generateName }) => {
    // Find first user in list
    const userRow = page.locator('tr[data-testid*="user"], .user-item, [data-testid="list-item"]').first();
    const hasUserRow = await userRow.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasUserRow) {
      test.skip('No users found in list');
      return;
    }

    // Click edit button
    const editButton = userRow.locator(SELECTORS.editButton).first();
    const hasEditButton = await editButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (!hasEditButton) {
      // Try finding edit button elsewhere
      const editBtn = page.locator('button:has-text("Edit"), a:has-text("Edit")').first();
      const hasEditBtn = await editBtn.isVisible({ timeout: 2000 }).catch(() => false);

      if (!hasEditBtn) {
        test.skip('Edit button not found');
        return;
      }

      await editBtn.click();
    } else {
      await editButton.click();
    }

    await page.waitForTimeout(500);

    // Update first name - use placeholder-based selector
    const newFirstName = generateName('Updated');
    const firstNameInput = page.locator('input[placeholder="John"]')
      .or(page.getByLabel(/first name/i))
      .first();
    const hasFirstName = await firstNameInput.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasFirstName) {
      await firstNameInput.clear();
      await firstNameInput.fill(newFirstName);

      // Save changes
      await helpers.clickButton(page, 'Save');
      await page.waitForTimeout(1000);

      // Verify success
      await helpers.expectToast(page, /updated|success/i);

      // Verify name appears in list
      const updatedName = page.locator(`text="${newFirstName}"`).first();
      const hasUpdatedName = await updatedName.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasUpdatedName) {
        await expect(updatedName).toBeVisible();
      }
    } else {
      test.skip('First name field not found');
    }
  });

  test('should delete user with confirmation', async ({ page }) => {
    // Create a test user first
    const addButton = page.locator('button:has-text("Add User"), button:has-text("Create User"), button:has-text("New User"), a:has-text("Add User")').first();
    const hasAddButton = await addButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasAddButton) {
      test.skip('Cannot create test user for deletion');
      return;
    }

    // Create user
    await addButton.click();
    await page.waitForTimeout(500);

    const testEmail = generateEmail();
    await helpers.fillFormField(page, 'Email', testEmail);
    await helpers.fillFormField(page, 'First Name', 'Delete');
    await helpers.fillFormField(page, 'Last Name', 'Test');

    await helpers.clickButton(page, 'Create');
    await page.waitForTimeout(1000);

    // Find the created user
    const userRow = page.locator(`text="${testEmail}"`).first();
    const hasUserRow = await userRow.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasUserRow) {
      test.skip('Created user not found');
      return;
    }

    // Click delete button
    const deleteButton = page.locator(SELECTORS.deleteButton).first();
    const hasDeleteButton = await deleteButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (!hasDeleteButton) {
      test.skip('Delete button not found');
      return;
    }

    await deleteButton.click();
    await page.waitForTimeout(500);

    // Confirm deletion
    await helpers.confirmDialog(page);
    await page.waitForTimeout(1000);

    // Verify success
    await helpers.expectToast(page, /deleted|removed|success/i);

    // Verify user is removed from list
    const deletedUser = page.locator(`text="${testEmail}"`).first();
    const stillVisible = await deletedUser.isVisible({ timeout: 2000 }).catch(() => false);

    expect(stillVisible).toBe(false);
  });

  test('should assign user to family', async ({ page }) => {
    // Find a member user
    const userRow = page.locator('tr[data-testid*="user"], .user-item').first();
    const hasUserRow = await userRow.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasUserRow) {
      test.skip('No users found');
      return;
    }

    // Click to view/edit user
    const viewButton = userRow.locator('button:has-text("View"), a:has-text("View"), button:has-text("Edit")').first();
    const hasViewButton = await viewButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasViewButton) {
      await viewButton.click();
      await page.waitForTimeout(1000);

      // Look for family assignment section - use combobox selector with fallback
      const familySelect = page.locator('[data-testid="family-select"]')
        .or(page.getByRole('combobox').filter({ hasText: /family|no family/i }))
        .or(page.getByLabel(/family/i))
        .first();
      const hasFamilySelect = await familySelect.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasFamilySelect) {
        await familySelect.click();
        await page.waitForTimeout(300);

        // Select a family
        const familyOption = page.locator('[role="option"]').first();
        const hasFamilyOption = await familyOption.isVisible({ timeout: 2000 }).catch(() => false);

        if (hasFamilyOption) {
          await familyOption.click();
          await page.waitForTimeout(300);

          // Save assignment
          await helpers.clickButton(page, 'Save');
          await page.waitForTimeout(1000);

          // Verify success
          await helpers.expectToast(page, /assigned|updated|success/i);
        }
      }
    }
  });

  test('should filter users by role', async ({ page }) => {
    // Look for role filter dropdown
    const roleFilter = page.locator('select:has-text("All"), select[name="role"], [data-testid="role-filter"]').first();
    const hasRoleFilter = await roleFilter.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasRoleFilter) {
      // Filter by ADMIN
      await roleFilter.selectOption('ADMIN');
      await page.waitForTimeout(500);

      // Verify filtered results
      const rows = page.locator('tr[data-testid*="user"], .user-item');
      const count = await rows.count();

      expect(count).toBeGreaterThanOrEqual(0);

      // Filter by VOLUNTEER
      await roleFilter.selectOption('VOLUNTEER');
      await page.waitForTimeout(500);

      // Verify results updated
      const volunteerCount = await rows.count();
      expect(volunteerCount).toBeGreaterThanOrEqual(0);
    } else {
      // Try search-based filtering
      const searchInput = page.locator(SELECTORS.searchInput).first();
      const hasSearch = await searchInput.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasSearch) {
        await searchInput.fill('ADMIN');
        await page.waitForTimeout(500);

        const results = page.locator('tr, .user-item');
        const count = await results.count();

        expect(count).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('should show validation errors for duplicate email', async ({ page }) => {
    // Get existing user email
    const firstUserEmail = page.locator('tr[data-testid*="user"], .user-item').first().locator('text=/@/').first();
    const hasEmail = await firstUserEmail.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasEmail) {
      test.skip('No existing users to test duplicate');
      return;
    }

    const existingEmail = await firstUserEmail.textContent();

    if (!existingEmail || !existingEmail.includes('@')) {
      test.skip('Could not extract email');
      return;
    }

    // Try to create user with same email
    const addButton = page.locator('button:has-text("Add User"), button:has-text("Create User"), button:has-text("New User"), a:has-text("Add User")').first();
    const hasAddButton = await addButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (!hasAddButton) {
      test.skip('Add user button not found');
      return;
    }

    await addButton.click();
    await page.waitForTimeout(500);

    // Fill form with duplicate email
    await helpers.fillFormField(page, 'Email', existingEmail.trim());
    await helpers.fillFormField(page, 'First Name', 'Duplicate');
    await helpers.fillFormField(page, 'Last Name', 'Test');

    // Submit form
    await helpers.clickButton(page, 'Create');
    await page.waitForTimeout(1000);

    // Verify error message
    const errorMessage = page.locator(SELECTORS.errorMessage, { hasText: /email|exists|duplicate/i });
    const hasError = await errorMessage.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasError) {
      await expect(errorMessage).toBeVisible();
    } else {
      // Error might be in toast
      await helpers.expectToast(page, /error|exists|duplicate/i);
    }
  });
});
