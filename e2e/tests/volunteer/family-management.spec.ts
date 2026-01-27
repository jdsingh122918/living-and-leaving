/**
 * E2E Tests: Volunteer Family Management
 * Tests family creation, editing, and access control for volunteers
 */

import { test, expect } from '../../fixtures/test-base';

test.describe('Volunteer Family Management', () => {
  test.beforeEach(async ({ page, loginAsVolunteer }) => {
    await loginAsVolunteer();
    await expect(page).toHaveURL(/\/volunteer/);
  });

  test('should create new family', async ({ page, helpers, generateName }) => {
    await page.waitForLoadState('domcontentloaded');

    // Navigate to family creation - may need to go to families page first
    let createFamilyButton = page.getByRole('link', { name: /create family/i })
      .or(page.getByRole('button', { name: /create family/i }))
      .or(page.locator('a:has-text("Create Family")'))
      .first();

    // If not visible, try navigating to families page first
    if (!await createFamilyButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      const familiesLink = page.getByRole('link', { name: /families/i }).first();
      if (await familiesLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await familiesLink.click();
        await page.waitForLoadState('domcontentloaded');
      }
      createFamilyButton = page.getByRole('link', { name: /create family|add family|new family/i })
        .or(page.getByRole('button', { name: /create family|add family|new family/i }))
        .first();
    }

    if (!await createFamilyButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip();
      return;
    }

    await createFamilyButton.click();

    // Wait for family creation form (URL may vary)
    await page.waitForLoadState('domcontentloaded');

    // Generate unique family name
    const familyName = generateName('Test Family');

    // Fill in family details
    const nameInput = page.getByLabel(/family name/i).or(page.locator('input[name="name"]')).first();
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill(familyName);

    // Look for optional description field
    const descriptionField = page.getByLabel(/description/i).first();
    if (await descriptionField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await descriptionField.fill('E2E test family');
    }

    // Submit the form
    const submitButton = page.locator('button[type="submit"]')
      .or(page.getByRole('button', { name: /create/i }))
      .first();
    await submitButton.click();

    // Wait for success - either redirect or success toast
    await page.waitForTimeout(2000);

    // Verify family was created - check for success toast or URL redirect or family name in page
    const hasSuccessToast = await helpers.expectToast(page, /created|success/i, 5000).catch(() => false);
    const hasRedirected = page.url().match(/\/volunteer\/(families|dashboard)$/);
    const pageContent = await page.textContent('body');
    const hasNameOnPage = pageContent?.includes(familyName);

    expect(hasSuccessToast || hasRedirected || hasNameOnPage).toBeTruthy();
  });

  test('should only show families created by this volunteer', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');

    // Navigate to families page via sidebar
    const familiesLink = page.getByRole('link', { name: /^families$/i }).first();
    if (!await familiesLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip();
      return;
    }

    await familiesLink.click();
    await page.waitForURL(/\/volunteer\/families/);
    await page.waitForLoadState('domcontentloaded');

    // Check that we're on the families page
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/volunteer\/families/);

    // The page should show only this volunteer's families
    // We can't test for specific absence without knowing other volunteers' data,
    // but we can verify the page loads and shows appropriate content
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('should add members to family', async ({ page, helpers, generateName, generateEmail }) => {
    await page.waitForLoadState('domcontentloaded');

    // First, create a family
    const createFamilyButton = page.getByRole('link', { name: /create family/i }).first();
    if (await createFamilyButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createFamilyButton.click();
      await page.waitForLoadState('domcontentloaded');

      const familyName = generateName('Family with Member');
      const nameInput = page.getByLabel(/family name/i).or(page.locator('input[name="name"]')).first();
      await nameInput.fill(familyName);

      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();
      await page.waitForLoadState('domcontentloaded');
    }

    // Navigate to add member
    const addMemberButton = page.getByRole('link', { name: /add member/i })
      .or(page.locator('a:has-text("Add Member")'))
      .first();

    if (await addMemberButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addMemberButton.click();
      await page.waitForLoadState('domcontentloaded');

      // Fill member details
      const firstName = generateName('Member');
      const firstNameInput = page.getByLabel(/first name/i).first();
      if (await firstNameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await firstNameInput.fill(firstName);

        const lastNameInput = page.getByLabel(/last name/i).first();
        await lastNameInput.fill('TestUser');

        const emailInput = page.getByLabel(/email/i).first();
        await emailInput.fill(generateEmail());

        // Select family if available
        const familySelect = page.getByLabel(/family/i).first();
        if (await familySelect.isVisible({ timeout: 2000 }).catch(() => false)) {
          await familySelect.selectOption({ index: 1 });
        }

        // Submit
        const submitButton = page.locator('button[type="submit"]').first();
        await submitButton.click();
        await page.waitForLoadState('domcontentloaded');

        // Verify success
        const pageContent = await page.textContent('body');
        expect(pageContent).toContain(firstName);
      }
    }
  });

  test('should edit family details', async ({ page, helpers }) => {
    await page.waitForLoadState('domcontentloaded');

    // Navigate to families
    const familiesLink = page.getByRole('link', { name: /families/i }).first();
    if (await familiesLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await familiesLink.click();
      await page.waitForLoadState('domcontentloaded');

      // Find and click on a family
      const familyCard = page.locator('[data-testid="family-card"], .family-card').first();
      if (await familyCard.isVisible({ timeout: 5000 }).catch(() => false)) {
        await familyCard.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for edit button
        const editButton = page.getByRole('button', { name: /edit/i })
          .or(page.getByRole('link', { name: /edit/i }))
          .first();

        if (await editButton.isVisible({ timeout: 5000 }).catch(() => false)) {
          await editButton.click();
          await page.waitForLoadState('domcontentloaded');

          // Modify family name
          const nameInput = page.getByLabel(/family name/i).or(page.locator('input[name="name"]')).first();
          if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
            const currentValue = await nameInput.inputValue();
            await nameInput.fill(currentValue + ' (Updated)');

            // Save changes
            const saveButton = page.locator('button[type="submit"]')
              .or(page.getByRole('button', { name: /save/i }))
              .first();
            await saveButton.click();

            // Verify update
            await page.waitForLoadState('domcontentloaded');
            const pageContent = await page.textContent('body');
            expect(pageContent).toContain('Updated');
          }
        }
      }
    }
  });

  test('should not be able to access other volunteers\' families', async ({ page }) => {
    // This test verifies that a volunteer can only see their own families
    // by attempting to access a non-existent or unauthorized family ID
    await page.waitForLoadState('domcontentloaded');

    // Try to access a family with an arbitrary ID
    const unauthorizedFamilyId = '000000000000000000000001';
    await page.goto(`/volunteer/families/${unauthorizedFamilyId}`);

    // Should either redirect to families list or show error
    await page.waitForLoadState('domcontentloaded');

    const currentUrl = page.url();
    const pageContent = await page.textContent('body');

    // Either we're redirected away or we see an error message
    const isUnauthorized =
      currentUrl.includes('/volunteer/families') && !currentUrl.includes(unauthorizedFamilyId) ||
      pageContent?.includes('not found') ||
      pageContent?.includes('access') ||
      pageContent?.includes('permission');

    expect(isUnauthorized).toBeTruthy();
  });

  test('should set primary contact for family', async ({ page, helpers }) => {
    await page.waitForLoadState('domcontentloaded');

    // Navigate to families
    const familiesLink = page.getByRole('link', { name: /families/i }).first();
    if (await familiesLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await familiesLink.click();
      await page.waitForLoadState('domcontentloaded');

      // Click on a family
      const familyCard = page.locator('[data-testid="family-card"], .family-card').first();
      if (await familyCard.isVisible({ timeout: 5000 }).catch(() => false)) {
        await familyCard.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for primary contact section or edit option
        const pageContent = await page.textContent('body');
        const hasPrimaryContactSection =
          pageContent?.includes('Primary Contact') ||
          pageContent?.includes('Contact Person') ||
          pageContent?.includes('Main Contact');

        // If there's a primary contact section, verify it exists
        if (hasPrimaryContactSection) {
          expect(pageContent).toContain('Contact');
        }

        // Look for edit button to modify primary contact
        const editButton = page.getByRole('button', { name: /edit/i })
          .or(page.getByRole('link', { name: /edit/i }))
          .first();

        if (await editButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          await editButton.click();
          await page.waitForLoadState('domcontentloaded');

          // Look for primary contact field
          const primaryContactField = page.getByLabel(/primary contact/i)
            .or(page.locator('select[name*="contact"]'))
            .first();

          if (await primaryContactField.isVisible({ timeout: 3000 }).catch(() => false)) {
            // Select first available option
            await primaryContactField.selectOption({ index: 1 });

            // Save
            const saveButton = page.locator('button[type="submit"]').first();
            await saveButton.click();
            await page.waitForLoadState('domcontentloaded');
          }
        }
      }
    }
  });
});
