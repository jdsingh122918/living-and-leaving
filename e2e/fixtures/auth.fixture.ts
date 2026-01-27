/**
 * Authentication fixtures for E2E tests
 *
 * Supports two modes:
 * - Mock mode (default): Sets test cookies to bypass Clerk authentication
 * - Real Clerk mode: Uses @clerk/testing for actual Clerk authentication
 *
 * Toggle with E2E_USE_REAL_CLERK environment variable:
 * - E2E_USE_REAL_CLERK=false (default): Mock mode, fast, no Clerk dependency
 * - E2E_USE_REAL_CLERK=true: Real Clerk mode, requires test accounts
 */

import { test as base, expect } from '@playwright/test';
import { setupClerkTestingToken, clerk } from '@clerk/testing/playwright';

// Check if we should use real Clerk authentication
const USE_REAL_CLERK = process.env.E2E_USE_REAL_CLERK === 'true';

// Test user credentials - clerkId matches e2e/utils/seed-test-data.ts
export const TEST_USERS = {
  admin: {
    clerkId: 'test_admin_001',
    username: process.env.E2E_ADMIN_USERNAME || 'test-admin',
    password: process.env.E2E_ADMIN_PASSWORD || 'test-password-123',
    role: 'ADMIN',
    expectedRoute: '/admin',
  },
  volunteer: {
    clerkId: 'test_volunteer_001',
    username: process.env.E2E_VOLUNTEER_USERNAME || 'test-volunteer',
    password: process.env.E2E_VOLUNTEER_PASSWORD || 'test-password-123',
    role: 'VOLUNTEER',
    expectedRoute: '/volunteer',
  },
  member: {
    clerkId: 'test_member_001',
    username: process.env.E2E_MEMBER_USERNAME || 'test-member',
    password: process.env.E2E_MEMBER_PASSWORD || 'test-password-123',
    role: 'MEMBER',
    expectedRoute: '/member',
  },
};

export type UserRole = keyof typeof TEST_USERS;

// Extended test type with auth fixtures
type AuthFixtures = {
  loginAsAdmin: () => Promise<void>;
  loginAsVolunteer: () => Promise<void>;
  loginAsMember: () => Promise<void>;
  loginAs: (role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
};

/**
 * Mock login - sets test cookies and request headers to bypass Clerk authentication
 * Fast and doesn't require external Clerk service
 */
async function mockLogin(
  page: any,
  user: (typeof TEST_USERS)[keyof typeof TEST_USERS],
) {
  // Set test cookies that the server will recognize (for SSR pages)
  await page.context().addCookies([
    {
      name: '__test_user_id',
      value: user.clerkId,
      domain: 'localhost',
      path: '/',
    },
    {
      name: '__test_user_role',
      value: user.role,
      domain: 'localhost',
      path: '/',
    },
  ]);

  // Pre-set cookie consent to prevent cookie banner from appearing during tests
  // This must be before page.goto() as addInitScript runs before any page script
  await page.context().addInitScript(() => {
    localStorage.setItem('firefly_cookie_consent', JSON.stringify({
      accepted: true,
      timestamp: Date.now()
    }));
  });

  // Intercept all API requests to add auth headers
  // This is necessary because cookies may not be accessible in API route handlers
  await page.route('**/api/**', async (route: any) => {
    const headers = {
      ...route.request().headers(),
      'X-Test-User-Id': user.clerkId,
      'X-Test-User-Role': user.role,
    };
    await route.continue({ headers });
  });

  // Navigate directly to the expected route
  await page.goto(user.expectedRoute);
  await page.waitForLoadState('domcontentloaded');

  // Wait for dashboard content instead of URL change (more deterministic)
  // SSE connections prevent networkidle, and mock mode doesn't trigger navigation events
  // Waiting for actual page content is more reliable
  // Use partial text matching with getByText for flexibility
  const welcomeText = page.getByText('Welcome back', { exact: false });
  const dashboardHeading = page.getByRole('heading', { name: /dashboard/i });
  const pageTitle = page.locator('[data-testid="page-title"]');

  await welcomeText.or(dashboardHeading).or(pageTitle).first()
    .waitFor({ state: 'visible', timeout: 10000 });
}

/**
 * Real Clerk login - uses @clerk/testing for actual authentication
 * Slower but tests real auth flow
 */
async function realClerkLogin(
  page: any,
  user: (typeof TEST_USERS)[keyof typeof TEST_USERS],
) {
  // Setup Clerk testing token to bypass bot detection
  await setupClerkTestingToken({ page });

  // Navigate to sign-in
  await page.goto('/sign-in');

  // Use Clerk's sign-in helper
  await clerk.signIn({
    page,
    signInParams: {
      strategy: 'password',
      identifier: user.username,
      password: user.password,
    },
  });

  // Wait for redirect to expected route
  await page.waitForURL(new RegExp(user.expectedRoute), { timeout: 15000 });
}

/**
 * Extended Playwright test with authentication fixtures
 */
export const test = base.extend<AuthFixtures>({
  // Login as admin
  loginAsAdmin: async ({ page }, use) => {
    const login = async () => {
      if (USE_REAL_CLERK) {
        await realClerkLogin(page, TEST_USERS.admin);
      } else {
        await mockLogin(page, TEST_USERS.admin);
      }
    };
    await use(login);
  },

  // Login as volunteer
  loginAsVolunteer: async ({ page }, use) => {
    const login = async () => {
      if (USE_REAL_CLERK) {
        await realClerkLogin(page, TEST_USERS.volunteer);
      } else {
        await mockLogin(page, TEST_USERS.volunteer);
      }
    };
    await use(login);
  },

  // Login as member
  loginAsMember: async ({ page }, use) => {
    const login = async () => {
      if (USE_REAL_CLERK) {
        await realClerkLogin(page, TEST_USERS.member);
      } else {
        await mockLogin(page, TEST_USERS.member);
      }
    };
    await use(login);
  },

  // Generic login function
  loginAs: async ({ page }, use) => {
    const login = async (role: UserRole) => {
      const user = TEST_USERS[role];

      if (USE_REAL_CLERK) {
        await realClerkLogin(page, user);
      } else {
        await mockLogin(page, user);
      }
    };
    await use(login);
  },

  // Logout function
  logout: async ({ page }, use) => {
    const logout = async () => {
      if (USE_REAL_CLERK) {
        await clerk.signOut({ page });
        await page.waitForURL('/sign-in', { timeout: 10000 });
      } else {
        // Clear route interceptors for API requests
        await page.unrouteAll({ behavior: 'ignoreErrors' });
        // Clear test cookies
        await page.context().clearCookies();
        await page.goto('/sign-in');
      }
    };
    await use(logout);
  },
});

export { expect } from '@playwright/test';
