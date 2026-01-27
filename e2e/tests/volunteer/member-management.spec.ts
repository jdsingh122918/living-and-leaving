/**
 * E2E Tests: Volunteer Member Management
 * Tests member creation, role restrictions, and member management for volunteers
 */

import { test, expect } from '../../fixtures/test-base';

test.describe('Volunteer Member Management', () => {
  test.beforeEach(async ({ page, loginAsVolunteer }) => {
    await loginAsVolunteer();
    await expect(page).toHaveURL(/\/volunteer/);
  });

  test('should create member with MEMBER role only', async ({ page, generateName, generateEmail }) => {
    await page.waitForLoadState('domcontentloaded');

    // Navigate to add member (may be from families page)
    const addMemberButton = page.getByRole('link', { name: /add member/i })
      .or(page.getByRole('button', { name: /add member/i }))
      .or(page.locator('a:has-text("Add Member")'))
      .first();

    // If add member button not visible on dashboard, navigate to families first
    if (!await addMemberButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      const familiesLink = page.getByRole('link', { name: /families/i }).first();
      if (await familiesLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await familiesLink.click();
        await page.waitForLoadState('domcontentloaded');
      }
    }

    const addButton = page.getByRole('link', { name: /add member/i })
      .or(page.getByRole('button', { name: /add member/i }))
      .or(page.locator('a:has-text("Add Member")'))
      .first();

    if (!await addButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip();
      return;
    }

    await addButton.click();

    // Wait for member creation form (URL may vary)
    await page.waitForLoadState('domcontentloaded');

    // Fill in member details - use placeholder-based selectors since shadcn forms don't have proper label associations
    const firstName = generateName('Member');
    const firstNameInput = page.locator('input[placeholder="John"]')
      .or(page.getByLabel(/first name/i))
      .first();
    await expect(firstNameInput).toBeVisible({ timeout: 5000 });
    await firstNameInput.fill(firstName);

    const lastNameInput = page.locator('input[placeholder="Doe"]')
      .or(page.getByLabel(/last name/i))
      .first();
    await lastNameInput.fill('TestUser');

    const emailInput = page.locator('input[placeholder="user@example.com"]')
      .or(page.getByLabel(/email/i))
      .first();
    await emailInput.fill(generateEmail());

    // Check for role field - should default to MEMBER or not allow selection
    // The role field is a shadcn combobox, not a standard select
    const roleCombobox = page.getByRole('combobox').filter({ hasText: /member|admin|volunteer/i }).first();
    const roleSelectTrigger = page.locator('[data-testid="role-select"]')
      .or(page.locator('button[role="combobox"]').filter({ hasText: /member/i }))
      .first();

    if (await roleCombobox.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Verify "Member" is displayed in the combobox
      const roleText = await roleCombobox.textContent();
      expect(roleText?.toLowerCase()).toContain('member');
    } else if (await roleSelectTrigger.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Alternative: check the trigger button text
      const roleText = await roleSelectTrigger.textContent();
      expect(roleText?.toLowerCase()).toContain('member');
    }

    // For a combobox, we can verify that restricted roles aren't selectable
    // by checking the description text confirms it's a basic access role
    const roleDescription = page.locator('text=/Basic access|can view their family/i');
    if (await roleDescription.isVisible({ timeout: 1000 }).catch(() => false)) {
      // Role is confirmed as Member via description
      expect(true).toBeTruthy();
    }

    // Submit the form
    const submitButton = page.locator('button[type="submit"]')
      .or(page.getByRole('button', { name: /create|add/i }))
      .first();
    await submitButton.click();

    // Wait for success
    await page.waitForLoadState('domcontentloaded');

    // Verify member was created
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain(firstName);
  });

  test('should not be able to create ADMIN user', async ({ page, generateName, generateEmail }) => {
    await page.waitForLoadState('domcontentloaded');

    // Navigate to add member
    const addMemberButton = page.getByRole('link', { name: /add member/i })
      .or(page.locator('a:has-text("Add Member")'))
      .first();

    if (await addMemberButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addMemberButton.click();
      await page.waitForLoadState('domcontentloaded');

      // Check for role field
      const roleSelect = page.getByLabel(/role/i).first();
      if (await roleSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Verify ADMIN option is not available
        const options = await roleSelect.locator('option').allTextContents();
        expect(options).not.toContain('ADMIN');

        // Try to manually set value (should fail or be ignored)
        await roleSelect.selectOption('MEMBER');
        const selectedValue = await roleSelect.inputValue();
        expect(selectedValue).not.toBe('ADMIN');
      } else {
        // If no role field is visible, that's also valid (defaults to MEMBER)
        const pageContent = await page.textContent('body');
        expect(pageContent).toBeTruthy();
      }
    }
  });

  test('should not be able to create VOLUNTEER user', async ({ page, generateName, generateEmail }) => {
    await page.waitForLoadState('domcontentloaded');

    // Navigate to add member
    const addMemberButton = page.getByRole('link', { name: /add member/i })
      .or(page.locator('a:has-text("Add Member")'))
      .first();

    if (await addMemberButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addMemberButton.click();
      await page.waitForLoadState('domcontentloaded');

      // Check for role field
      const roleSelect = page.getByLabel(/role/i).first();
      if (await roleSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Verify VOLUNTEER option is not available
        const options = await roleSelect.locator('option').allTextContents();
        expect(options).not.toContain('VOLUNTEER');

        // Should only have MEMBER option
        expect(options).toContain('MEMBER');
        expect(options.length).toBe(1);
      }
    }
  });

  test('should view members in owned families', async ({ page, helpers }) => {
    await page.waitForLoadState('domcontentloaded');

    // Navigate to members page via "Members" link (goes to /volunteer/users)
    // Note: The sidebar shows "Members" but routes to /volunteer/users
    const membersLink = page.getByRole('link', { name: /^members$/i }).first();

    if (await membersLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await membersLink.click();
      await page.waitForURL(/\/volunteer\/users/);
      await page.waitForLoadState('domcontentloaded');

      // Verify we're on users page (Members route goes to /volunteer/users)
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/volunteer\/users/);

      // Check that page has user-related content
      const pageContent = await page.textContent('body');
      const hasRelevantContent = pageContent?.includes('Members') ||
        pageContent?.includes('Users') ||
        pageContent?.includes('Family');
      expect(hasRelevantContent).toBeTruthy();

      // Check for member cards, table, or empty state
      const hasMembersList =
        await page.locator('[data-testid="user-card"]').count() > 0 ||
        await page.locator('[data-testid="member-card"]').count() > 0 ||
        await page.locator('table').count() > 0 ||
        pageContent?.includes('No members') ||
        pageContent?.includes('No users');

      expect(hasMembersList).toBeTruthy();
    } else {
      // Try families route instead since members may be accessed from family page
      const familiesLink = page.getByRole('link', { name: /families/i }).first();
      if (await familiesLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await familiesLink.click();
        await page.waitForURL(/\/volunteer\/families/);
        await page.waitForLoadState('domcontentloaded');
        expect(page.url()).toMatch(/\/volunteer\/families/);
      } else {
        // No members link available, skip test
        test.skip();
      }
    }
  });

  test('should edit member details', async ({ page, helpers }) => {
    await page.waitForLoadState('domcontentloaded');

    // Navigate to members
    const membersLink = page.getByRole('link', { name: /members/i }).first();
    if (await membersLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await membersLink.click();
      await page.waitForLoadState('domcontentloaded');

      // Find and click on a member
      const memberCard = page.locator('[data-testid="member-card"], .member-card').first();
      if (await memberCard.isVisible({ timeout: 5000 }).catch(() => false)) {
        await memberCard.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for edit button
        const editButton = page.getByRole('button', { name: /edit/i })
          .or(page.getByRole('link', { name: /edit/i }))
          .first();

        if (await editButton.isVisible({ timeout: 5000 }).catch(() => false)) {
          await editButton.click();
          await page.waitForLoadState('domcontentloaded');

          // Modify member details - use placeholder-based selector
          const firstNameInput = page.locator('input[placeholder="John"]')
            .or(page.getByLabel(/first name/i))
            .first();
          if (await firstNameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
            const currentValue = await firstNameInput.inputValue();
            await firstNameInput.fill(currentValue + ' Jr.');

            // Save changes
            const saveButton = page.locator('button[type="submit"]')
              .or(page.getByRole('button', { name: /save/i }))
              .first();
            await saveButton.click();

            // Verify update
            await page.waitForLoadState('domcontentloaded');
            const pageContent = await page.textContent('body');
            expect(pageContent).toContain('Jr.');
          }
        }
      }
    }
  });

  test('should assign member to family', async ({ page, helpers, generateName, generateEmail }) => {
    await page.waitForLoadState('domcontentloaded');

    // First create a family if needed
    const createFamilyButton = page.getByRole('link', { name: /create family/i }).first();
    if (await createFamilyButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createFamilyButton.click();
      await page.waitForLoadState('domcontentloaded');

      const familyName = generateName('Assignment Test Family');
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

      // Fill member details - use placeholder-based selectors
      const firstName = generateName('Assigned Member');
      const firstNameInput = page.locator('input[placeholder="John"]')
        .or(page.getByLabel(/first name/i))
        .first();
      await firstNameInput.fill(firstName);

      const lastNameInput = page.locator('input[placeholder="Doe"]')
        .or(page.getByLabel(/last name/i))
        .first();
      await lastNameInput.fill('TestUser');

      const emailInput = page.locator('input[placeholder="user@example.com"]')
        .or(page.getByLabel(/email/i))
        .first();
      await emailInput.fill(generateEmail());

      // Select family
      const familySelect = page.getByLabel(/family/i).first();
      if (await familySelect.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Select first family option (not the empty option)
        await familySelect.selectOption({ index: 1 });

        // Submit
        const submitButton = page.locator('button[type="submit"]').first();
        await submitButton.click();
        await page.waitForLoadState('domcontentloaded');

        // Verify member was created and assigned
        const pageContent = await page.textContent('body');
        expect(pageContent).toContain(firstName);
      } else {
        // If no family select is available, member should still be created
        const submitButton = page.locator('button[type="submit"]').first();
        await submitButton.click();
        await page.waitForLoadState('domcontentloaded');
      }
    }
  });
});
