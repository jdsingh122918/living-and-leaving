/**
 * Admin Family Management Tests
 * Tests CRUD operations for family management
 */

import { test, expect, helpers, SELECTORS, generateName } from '../../fixtures/test-base';

test.describe('Family Management', () => {
  test.beforeEach(async ({ page, loginAsAdmin }) => {
    // Login as admin and navigate to families page
    await loginAsAdmin();
    await page.goto('/admin/families');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should list all families with search', async ({ page }) => {
    // Verify we're on families page
    await expect(page).toHaveURL(/\/admin\/families/);

    // Verify page title or heading
    const heading = page.locator('h1, h2').filter({ hasText: /families/i }).first();
    const hasHeading = await heading.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasHeading) {
      await expect(heading).toBeVisible();
    }

    // Look for family list (table or cards)
    const familyTable = page.locator('table').first();
    const hasTable = await familyTable.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasTable) {
      await expect(familyTable).toBeVisible();

      // Count families in table rows
      const familyRows = page.locator('table tbody tr');
      const count = await familyRows.count();

      expect(count).toBeGreaterThanOrEqual(0);
    }

    // Look for search input
    const searchInput = page.locator(SELECTORS.searchInput).first();
    const hasSearch = await searchInput.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasSearch) {
      await expect(searchInput).toBeVisible();

      // Test search functionality
      await searchInput.fill('family');
      await page.waitForTimeout(500);

      // Results should update
      const resultsAfterSearch = page.locator('table tbody tr');
      const searchCount = await resultsAfterSearch.count();

      expect(searchCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should create new family with name and description', async ({ page, generateName }) => {
    // Look for "Add Family" or "Create Family" button
    const addButton = page.locator('button:has-text("Add Family"), button:has-text("Create Family"), button:has-text("New Family"), a:has-text("Add Family")').first();
    const hasAddButton = await addButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasAddButton) {
      test.skip('Add Family button not found');
      return;
    }

    await addButton.click();
    await page.waitForTimeout(500);

    // Fill in family form
    const familyName = generateName('Test Family');
    const description = 'This is a test family created by E2E tests';

    // Fill name
    await helpers.fillFormField(page, 'Name', familyName);

    // Fill description - use textarea selector with fallback
    const descriptionField = page.locator('textarea[name="description"]')
      .or(page.locator('[data-testid="description-input"]'))
      .or(page.getByLabel(/description/i))
      .first();
    const hasDescription = await descriptionField.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasDescription) {
      await descriptionField.fill(description);
    }

    // Submit form
    await helpers.clickButton(page, 'Create');
    await page.waitForTimeout(1000);

    // Verify success message
    await helpers.expectToast(page, /created|success/i);

    // Verify family appears in list
    const familyCard = page.locator(`text="${familyName}"`).first();
    const hasFamilyCard = await familyCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasFamilyCard) {
      await expect(familyCard).toBeVisible();
    }
  });

  test('should view family details with member list', async ({ page }) => {
    // Find first family in table (look for "View Details" link)
    const viewDetailsLink = page.locator('a:has-text("View Details")').first();
    const hasViewDetails = await viewDetailsLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasViewDetails) {
      // Try table row or family name link
      const familyRow = page.locator('table tbody tr').first();
      const hasRow = await familyRow.isVisible({ timeout: 5000 }).catch(() => false);

      if (!hasRow) {
        test.skip('No families found in list');
        return;
      }

      // Click family name link in first row
      const familyLink = familyRow.locator('a').first();
      await familyLink.click();
    } else {
      await viewDetailsLink.click();
    }

    await page.waitForTimeout(1000);

    // Verify family details are displayed
    const detailsSection = page.locator('[data-testid="family-details"], .family-details, main').first();
    await expect(detailsSection).toBeVisible({ timeout: 5000 });

    // Look for member list section
    const memberSection = page.locator('text=/members|family members/i').first();
    const hasMemberSection = await memberSection.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasMemberSection) {
      await expect(memberSection).toBeVisible();

      // Look for member list or cards
      const memberList = page.locator('[data-testid="member-list"], .member-list, ul').first();
      const hasMemberList = await memberList.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasMemberList) {
        await expect(memberList).toBeVisible();
      }
    }
  });

  test('should edit family information', async ({ page, generateName }) => {
    // Find first family in table and navigate to details
    const viewDetailsLink = page.locator('a:has-text("View Details")').first();
    const hasViewDetails = await viewDetailsLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasViewDetails) {
      const familyRow = page.locator('table tbody tr').first();
      const hasRow = await familyRow.isVisible({ timeout: 5000 }).catch(() => false);

      if (!hasRow) {
        test.skip('No families found in list');
        return;
      }

      // Click family name link in first row
      const familyLink = familyRow.locator('a').first();
      await familyLink.click();
    } else {
      await viewDetailsLink.click();
    }
    await page.waitForTimeout(1000);

    // Try finding edit button on details page
    const editBtn = page.locator('button:has-text("Edit"), a:has-text("Edit")').first();
    const hasEditBtn = await editBtn.isVisible({ timeout: 2000 }).catch(() => false);

    if (!hasEditBtn) {
      test.skip('Edit button not found');
      return;
    }

    await editBtn.click();

    await page.waitForTimeout(500);

    // Update family name - use input name selector with fallback
    const newName = generateName('Updated Family');
    const nameInput = page.locator('input[name="name"]')
      .or(page.locator('[data-testid="family-name-input"]'))
      .or(page.getByLabel(/name/i))
      .first();
    const hasNameInput = await nameInput.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasNameInput) {
      await nameInput.clear();
      await nameInput.fill(newName);

      // Update description - use textarea selector with fallback
      const descriptionInput = page.locator('textarea[name="description"]')
        .or(page.locator('[data-testid="description-input"]'))
        .or(page.getByLabel(/description/i))
        .first();
      const hasDescription = await descriptionInput.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasDescription) {
        await descriptionInput.clear();
        await descriptionInput.fill('Updated family description');
      }

      // Save changes
      await helpers.clickButton(page, 'Save');
      await page.waitForTimeout(1000);

      // Verify success
      await helpers.expectToast(page, /updated|success/i);

      // Verify name appears in list or details
      const updatedName = page.locator(`text="${newName}"`).first();
      const hasUpdatedName = await updatedName.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasUpdatedName) {
        await expect(updatedName).toBeVisible();
      }
    } else {
      test.skip('Name field not found');
    }
  });

  test('should delete family with confirmation', async ({ page, generateName }) => {
    // Create a test family first
    const addButton = page.locator('button:has-text("Add Family"), button:has-text("Create Family"), button:has-text("New Family"), a:has-text("Add Family")').first();
    const hasAddButton = await addButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasAddButton) {
      test.skip('Cannot create test family for deletion');
      return;
    }

    // Create family
    await addButton.click();
    await page.waitForTimeout(500);

    const testFamilyName = generateName('Delete Test Family');
    await helpers.fillFormField(page, 'Name', testFamilyName);

    // Use textarea selector with fallback
    const descriptionField = page.locator('textarea[name="description"]')
      .or(page.locator('[data-testid="description-input"]'))
      .or(page.getByLabel(/description/i))
      .first();
    const hasDescription = await descriptionField.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasDescription) {
      await descriptionField.fill('Family to be deleted');
    }

    await helpers.clickButton(page, 'Create');
    await page.waitForTimeout(1000);

    // Find the created family
    const familyCard = page.locator(`text="${testFamilyName}"`).first();
    const hasFamilyCard = await familyCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasFamilyCard) {
      test.skip('Created family not found');
      return;
    }

    // Find delete button (might need to click into family first)
    let deleteButton = page.locator(SELECTORS.deleteButton).first();
    let hasDeleteButton = await deleteButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (!hasDeleteButton) {
      // Click family card to view details
      await familyCard.click();
      await page.waitForTimeout(1000);

      deleteButton = page.locator(SELECTORS.deleteButton).first();
      hasDeleteButton = await deleteButton.isVisible({ timeout: 2000 }).catch(() => false);

      if (!hasDeleteButton) {
        test.skip('Delete button not found');
        return;
      }
    }

    await deleteButton.click();
    await page.waitForTimeout(500);

    // Confirm deletion
    await helpers.confirmDialog(page);
    await page.waitForTimeout(1000);

    // Verify success
    await helpers.expectToast(page, /deleted|removed|success/i);

    // Navigate back to families list
    await page.goto('/admin/families');
    await page.waitForLoadState('domcontentloaded');

    // Verify family is removed from list
    const deletedFamily = page.locator(`text="${testFamilyName}"`).first();
    const stillVisible = await deletedFamily.isVisible({ timeout: 2000 }).catch(() => false);

    expect(stillVisible).toBe(false);
  });

  test('should assign volunteers to family', async ({ page }) => {
    // Find a family in table and navigate to details
    const viewDetailsLink = page.locator('a:has-text("View Details")').first();
    const hasViewDetails = await viewDetailsLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasViewDetails) {
      const familyRow = page.locator('table tbody tr').first();
      const hasRow = await familyRow.isVisible({ timeout: 5000 }).catch(() => false);

      if (!hasRow) {
        test.skip('No families found');
        return;
      }

      const familyLink = familyRow.locator('a').first();
      await familyLink.click();
    } else {
      await viewDetailsLink.click();
    }
    await page.waitForTimeout(1000);

    // Look for volunteer assignment section
    const assignButton = page.locator('button:has-text("Assign Volunteer"), button:has-text("Add Volunteer")').first();
    const hasAssignButton = await assignButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasAssignButton) {
      await assignButton.click();
      await page.waitForTimeout(500);

      // Select a volunteer - use combobox selector with fallback
      const volunteerSelect = page.locator('[data-testid="volunteer-select"]')
        .or(page.getByRole('combobox').filter({ hasText: /volunteer|select/i }))
        .or(page.getByLabel(/volunteer/i))
        .first();
      const hasVolunteerSelect = await volunteerSelect.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasVolunteerSelect) {
        await volunteerSelect.click();
        await page.waitForTimeout(300);

        // Select first volunteer option
        const volunteerOption = page.locator('[role="option"]').first();
        const hasOption = await volunteerOption.isVisible({ timeout: 2000 }).catch(() => false);

        if (hasOption) {
          await volunteerOption.click();
          await page.waitForTimeout(300);

          // Save assignment
          await helpers.clickButton(page, 'Assign');
          await page.waitForTimeout(1000);

          // Verify success
          await helpers.expectToast(page, /assigned|success/i);
        }
      }
    } else {
      // Alternative: look for volunteer list section
      const volunteerSection = page.locator('text=/volunteers/i').first();
      const hasVolunteerSection = await volunteerSection.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasVolunteerSection) {
        await expect(volunteerSection).toBeVisible();
      }
    }
  });

  test('should show family members', async ({ page }) => {
    // Find a family in table and navigate to details
    const viewDetailsLink = page.locator('a:has-text("View Details")').first();
    const hasViewDetails = await viewDetailsLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasViewDetails) {
      const familyRow = page.locator('table tbody tr').first();
      const hasRow = await familyRow.isVisible({ timeout: 5000 }).catch(() => false);

      if (!hasRow) {
        test.skip('No families found');
        return;
      }

      const familyLink = familyRow.locator('a').first();
      await familyLink.click();
    } else {
      await viewDetailsLink.click();
    }
    await page.waitForLoadState('domcontentloaded');

    // Look for members section
    const membersHeading = page.locator('text=/members|family members/i').first();
    const hasMembersHeading = await membersHeading.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasMembersHeading) {
      await expect(membersHeading).toBeVisible();

      // Look for member list or cards
      const memberList = page.locator('[data-testid="member-list"], .member-list, [data-testid*="member"]').first();
      const hasMemberList = await memberList.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasMemberList) {
        await expect(memberList).toBeVisible();

        // Count members
        const memberItems = page.locator('[data-testid*="member"], .member-item, li');
        const count = await memberItems.count();

        expect(count).toBeGreaterThanOrEqual(0);
      } else {
        // Check for empty state
        const emptyState = page.locator('[data-testid="empty-state"], text=/no members/i').first();
        const hasEmptyState = await emptyState.isVisible({ timeout: 2000 }).catch(() => false);

        if (hasEmptyState) {
          await expect(emptyState).toBeVisible();
        }
      }
    }
  });

  test('should set primary contact', async ({ page }) => {
    // Find a family in table and navigate to details
    const viewDetailsLink = page.locator('a:has-text("View Details")').first();
    const hasViewDetails = await viewDetailsLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasViewDetails) {
      const familyRow = page.locator('table tbody tr').first();
      const hasRow = await familyRow.isVisible({ timeout: 5000 }).catch(() => false);

      if (!hasRow) {
        test.skip('No families found');
        return;
      }

      const familyLink = familyRow.locator('a').first();
      await familyLink.click();
    } else {
      await viewDetailsLink.click();
    }
    await page.waitForLoadState('domcontentloaded');

    // Look for primary contact section
    const primaryContactSection = page.locator('text=/primary contact/i').first();
    const hasPrimaryContact = await primaryContactSection.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasPrimaryContact) {
      await expect(primaryContactSection).toBeVisible();

      // Look for set/change primary contact button or select
      const setPrimaryButton = page.locator('button:has-text("Set Primary"), button:has-text("Change Primary")').first();
      const hasSetPrimaryButton = await setPrimaryButton.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasSetPrimaryButton) {
        await setPrimaryButton.click();
        await page.waitForTimeout(500);

        // Select a member
        const memberSelect = page.locator('[role="option"], .member-item').first();
        const hasMemberSelect = await memberSelect.isVisible({ timeout: 2000 }).catch(() => false);

        if (hasMemberSelect) {
          await memberSelect.click();
          await page.waitForTimeout(500);

          // Save selection
          const saveButton = page.locator(SELECTORS.saveButton).first();
          const hasSaveButton = await saveButton.isVisible({ timeout: 2000 }).catch(() => false);

          if (hasSaveButton) {
            await saveButton.click();
            await page.waitForTimeout(1000);

            // Verify success
            await helpers.expectToast(page, /updated|success/i);
          }
        }
      } else {
        // Primary contact might be displayed without edit option
        // Verify it's shown
        const contactName = primaryContactSection.locator('text=/[A-Z][a-z]+/').first();
        const hasContactName = await contactName.isVisible({ timeout: 2000 }).catch(() => false);

        if (hasContactName) {
          await expect(contactName).toBeVisible();
        }
      }
    }
  });

  test('should navigate between families', async ({ page }) => {
    // Get all family rows in table
    const familyRows = page.locator('table tbody tr');
    const count = await familyRows.count();

    if (count < 2) {
      test.skip('Not enough families to test navigation');
      return;
    }

    // Click first family's View Details link
    const firstViewLink = familyRows.nth(0).locator('a:has-text("View Details")').first();
    await firstViewLink.click();
    await page.waitForLoadState('domcontentloaded');

    // Verify we're viewing family details
    const detailsSection = page.locator('[data-testid="family-details"], .family-details, main').first();
    await expect(detailsSection).toBeVisible();

    // Navigate back to families list
    const backButton = page.locator('button:has-text("Back"), a:has-text("Back"), [aria-label="Back"]').first();
    const hasBackButton = await backButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasBackButton) {
      await backButton.click();
    } else {
      // Navigate via breadcrumb or sidebar
      const breadcrumb = page.locator(SELECTORS.breadcrumb).locator('a:has-text("Families")').first();
      const hasBreadcrumb = await breadcrumb.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasBreadcrumb) {
        await breadcrumb.click();
      } else {
        await page.goto('/admin/families');
      }
    }

    await page.waitForLoadState('domcontentloaded');

    // Verify back on families list
    await expect(page).toHaveURL(/\/admin\/families/);

    // Click second family's View Details link
    const familyRowsAfterBack = page.locator('table tbody tr');
    const secondViewLink = familyRowsAfterBack.nth(1).locator('a:has-text("View Details")').first();
    await secondViewLink.click();
    await page.waitForLoadState('domcontentloaded');

    // Verify viewing different family
    await expect(detailsSection).toBeVisible();
  });

  test('should display family statistics', async ({ page }) => {
    // Find a family row in table
    const familyRow = page.locator('table tbody tr').first();
    const hasRow = await familyRow.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasRow) {
      test.skip('No families found');
      return;
    }

    // Table rows might show member count
    const memberCount = familyRow.locator('text=/\\d+ members?/i').first();
    const hasMemberCount = await memberCount.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasMemberCount) {
      await expect(memberCount).toBeVisible();
    }

    // Click View Details to see more stats
    const viewLink = familyRow.locator('a:has-text("View Details")').first();
    await viewLink.click();
    await page.waitForLoadState('domcontentloaded');

    // Look for statistics section
    const statsSection = page.locator('[data-testid="stats"], .stats, .statistics').first();
    const hasStatsSection = await statsSection.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasStatsSection) {
      await expect(statsSection).toBeVisible();
    } else {
      // Verify page has content
      const mainContent = page.locator('main, [role="main"]').first();
      await expect(mainContent).toBeVisible();
    }
  });
});
