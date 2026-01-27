# Page Object Models

This directory contains all Page Object Models (POMs) for the Firefly E2E tests using Playwright.

## Structure

```
e2e/pages/
├── base.page.ts              # Base class with common functionality
├── index.ts                  # Centralized exports
├── auth/
│   └── sign-in.page.ts       # Authentication pages
├── admin/
│   ├── dashboard.page.ts     # Admin dashboard
│   ├── users.page.ts         # User management
│   ├── families.page.ts      # Family management
│   └── resources.page.ts     # Resource management
├── volunteer/
│   ├── dashboard.page.ts     # Volunteer dashboard
│   └── families.page.ts      # Volunteer family management
├── member/
│   ├── dashboard.page.ts     # Member dashboard
│   └── resources.page.ts     # Member resources
└── shared/
    ├── chat.page.ts          # Chat/messaging
    ├── forums.page.ts        # Forum discussions
    └── settings.page.ts      # User settings
```

## Usage

### Import Page Objects

```typescript
import { SignInPage, AdminDashboardPage } from '@/e2e/pages';
// or
import { SignInPage } from '@/e2e/pages/auth/sign-in.page';
```

### Example Test

```typescript
import { test, expect } from '@playwright/test';
import { SignInPage, AdminDashboardPage } from '@/e2e/pages';

test('admin can sign in and view dashboard', async ({ page }) => {
  const signInPage = new SignInPage(page);
  const dashboardPage = new AdminDashboardPage(page);

  await signInPage.goto();
  await signInPage.signIn('admin@example.com', '123456');

  await dashboardPage.waitForDashboardLoad();
  const familyCount = await dashboardPage.getStatValue('Families');
  expect(familyCount).toBeTruthy();
});
```

## Page Object Patterns

### BasePage

All page objects extend `BasePage` which provides:

- Common locators (sidebar, breadcrumb, toast, dialog, etc.)
- Navigation methods (goto, clickSidebarLink, waitForPageLoad)
- Toast verification (expectSuccessToast, expectErrorToast)
- Dialog handling (confirmDialog, cancelDialog)
- Form helpers (fillField, selectOption, clickButton)
- Search functionality

### Role-Based Access

Pages are organized by role to match the application structure:

- **Admin**: Full access to user/family/resource management
- **Volunteer**: Scoped to their created families
- **Member**: Limited to viewing resources and their family data
- **Shared**: Common features accessible to all roles

### Common Patterns

#### Navigation
```typescript
await page.goto();                    // Navigate to page
await page.waitForPageLoad();         // Wait for full load
await page.clickSidebarLink('Users'); // Navigate via sidebar
```

#### Data Operations
```typescript
// Create
await page.createResource({ title: 'Test', type: 'GUIDE' });

// Read
const resource = await page.getResourceByTitle('Test');

// Update
await page.editResource('Test', { title: 'Updated' });

// Delete
await page.deleteResource('Test');
```

#### Filtering & Search
```typescript
await page.filterByType('GUIDE');
await page.filterByVisibility('PUBLIC');
await page.searchResources('healthcare');
await page.clearFilters();
```

#### Verification
```typescript
await page.expectSuccessToast();
await page.expectErrorToast();
await page.waitForText('Success');
const exists = await page.hasResource('Title');
```

## Authentication Pages

### SignInPage

Handles Clerk authentication flows:

```typescript
const signInPage = new SignInPage(page);
await signInPage.goto();
await signInPage.signIn('user@example.com', '123456', '/admin/dashboard');
```

**Methods:**
- `enterEmail(email)` - Fill email input
- `enterOTP(code)` - Fill OTP code
- `submit()` - Submit form
- `waitForRedirect(path?)` - Wait for post-auth redirect
- `signIn(email, otp, expectedPath?)` - Complete flow

## Admin Pages

### AdminDashboardPage

Dashboard statistics and quick actions:

```typescript
const dashboard = new AdminDashboardPage(page);
await dashboard.goto();
const familyCount = await dashboard.getStatValue('Families');
await dashboard.clickStatCard('Users');
const activities = await dashboard.getRecentActivityItems();
```

### AdminUsersPage

User management operations:

```typescript
const usersPage = new AdminUsersPage(page);
await usersPage.createUser({
  email: 'new@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'MEMBER'
});
await usersPage.editUser('new@example.com', { role: 'VOLUNTEER' });
await usersPage.deleteUser('new@example.com');
await usersPage.filterByRole('ADMIN');
```

### AdminFamiliesPage

Family management:

```typescript
const familiesPage = new AdminFamiliesPage(page);
await familiesPage.createFamily({ name: 'Smith Family' });
await familiesPage.assignVolunteer('Smith Family', 'volunteer@example.com');
await familiesPage.viewFamilyDetails('Smith Family');
```

### AdminResourcesPage

Resource library management:

```typescript
const resourcesPage = new AdminResourcesPage(page);
await resourcesPage.createResource({
  title: 'End of Life Guide',
  type: 'GUIDE',
  visibility: 'PUBLIC',
  tags: ['palliative-care', 'family-support']
});
await resourcesPage.approveResource('End of Life Guide');
await resourcesPage.filterByType('GUIDE');
await resourcesPage.filterByTag('palliative-care');
```

## Volunteer Pages

### VolunteerDashboardPage

Volunteer overview:

```typescript
const dashboard = new VolunteerDashboardPage(page);
await dashboard.goto();
const familyCount = await dashboard.getFamilyCount();
const families = await dashboard.getFamilies();
await dashboard.clickCreateFamily();
```

### VolunteerFamiliesPage

Family management (scoped to volunteer's families):

```typescript
const familiesPage = new VolunteerFamiliesPage(page);
await familiesPage.createFamily({ name: 'Johnson Family' });
await familiesPage.addMember('Johnson Family', {
  firstName: 'Jane',
  lastName: 'Johnson',
  email: 'jane@example.com'
});
```

## Member Pages

### MemberDashboardPage

Member home screen:

```typescript
const dashboard = new MemberDashboardPage(page);
await dashboard.goto();
await dashboard.clickQuickAccessCard('Advance Directives');
const assignments = await dashboard.getTemplateAssignments();
const familyInfo = await dashboard.getFamilyInfo();
```

### MemberResourcesPage

Resource viewing and interaction:

```typescript
const resourcesPage = new MemberResourcesPage(page);
await resourcesPage.viewResource('End of Life Guide');
await resourcesPage.bookmarkResource('End of Life Guide');
await resourcesPage.rateResource('End of Life Guide', 5);
const isBookmarked = await resourcesPage.isResourceBookmarked('End of Life Guide');
```

## Shared Pages

### ChatPage

Real-time messaging:

```typescript
const chatPage = new ChatPage(page);
await chatPage.goto();
await chatPage.selectConversation('Dr. Smith');
await chatPage.sendMessage('Hello!');
await chatPage.addReaction('Hello!', '👍');
await chatPage.createConversation(['user1@example.com', 'user2@example.com']);
```

### ForumsPage

Community discussions:

```typescript
const forumsPage = new ForumsPage(page);
await forumsPage.createForum({
  title: 'Caregiving Tips',
  description: 'Share experiences',
  visibility: 'PUBLIC'
});
await forumsPage.joinForum('Caregiving Tips');
await forumsPage.createPost('Caregiving Tips', {
  title: 'My Experience',
  content: 'Here is what worked for me...'
});
await forumsPage.voteOnPost('My Experience', 'up');
```

### SettingsPage

User preferences:

```typescript
const settingsPage = new SettingsPage(page);
await settingsPage.updateProfile({
  firstName: 'John',
  lastName: 'Doe',
  phone: '555-1234'
});
await settingsPage.toggleNotification('email');
await settingsPage.toggleTheme();
await settingsPage.saveChanges();
```

## Best Practices

### 1. Wait for Elements
```typescript
// Good
await expect(this.element).toBeVisible();

// Avoid
await this.element.click(); // May fail if not loaded
```

### 2. Handle Loading States
```typescript
await this.waitForPageLoad();
await this.waitForLoadingComplete();
```

### 3. Verify Actions
```typescript
await page.createResource(data);
await page.expectSuccessToast(); // Verify success
```

### 4. Use Data Test IDs
```typescript
// Prefer data-testid attributes
this.element = page.locator('[data-testid="resource-card"]');

// Fallback to role/text
this.element = page.getByRole('button', { name: 'Create' });
```

### 5. Return Useful Data
```typescript
// Return structured data for assertions
async getResource(title: string): Promise<{ title: string; type: string } | null> {
  try {
    // ... fetch data
    return { title, type };
  } catch {
    return null;
  }
}
```

### 6. Handle Edge Cases
```typescript
// Check visibility with timeout
async hasElement(): Promise<boolean> {
  return this.element.isVisible({ timeout: 2000 }).catch(() => false);
}
```

## Testing Tips

### Arrange-Act-Assert Pattern
```typescript
test('user can create resource', async ({ page }) => {
  // Arrange
  const resourcesPage = new AdminResourcesPage(page);
  await resourcesPage.goto();

  // Act
  await resourcesPage.createResource({
    title: 'Test Resource',
    type: 'GUIDE',
    visibility: 'PUBLIC'
  });

  // Assert
  await resourcesPage.expectSuccessToast();
  const exists = await resourcesPage.hasResource('Test Resource');
  expect(exists).toBe(true);
});
```

### Fixtures for Page Objects
```typescript
// tests/fixtures.ts
import { test as base } from '@playwright/test';
import { AdminResourcesPage } from '@/e2e/pages';

export const test = base.extend<{ resourcesPage: AdminResourcesPage }>({
  resourcesPage: async ({ page }, use) => {
    await use(new AdminResourcesPage(page));
  },
});

// In test
test('resource operations', async ({ resourcesPage }) => {
  await resourcesPage.goto();
  // ...
});
```

### Cleanup
```typescript
test.afterEach(async ({ page }) => {
  const resourcesPage = new AdminResourcesPage(page);
  // Clean up test data
  if (await resourcesPage.hasResource('Test Resource')) {
    await resourcesPage.deleteResource('Test Resource');
  }
});
```

## Maintenance

### Adding New Pages

1. Create new file in appropriate directory
2. Extend `BasePage`
3. Define locators in constructor
4. Add methods following existing patterns
5. Export from `index.ts`

### Updating Locators

When UI changes require locator updates:

1. Prefer `data-testid` attributes for stability
2. Use semantic selectors (role, label) as fallback
3. Update across all affected page objects
4. Run tests to verify

### Documentation

- Add JSDoc comments to methods
- Include usage examples for complex operations
- Update README when adding new patterns
