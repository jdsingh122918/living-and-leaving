/**
 * Server-side authentication wrapper with test mode bypass
 *
 * This module wraps Clerk's auth functions to support test mode bypass
 * for E2E testing without requiring real Clerk authentication.
 *
 * Security: Bypass is ONLY available when:
 * - NODE_ENV !== 'production'
 * - INTEGRATION_TEST_MODE === 'true'
 * - Valid test credentials are present in headers/cookies
 */

import {
  auth as clerkAuth,
  currentUser as clerkCurrentUser,
  clerkClient as realClerkClient,
} from "@clerk/nextjs/server";
import { headers, cookies } from "next/headers";

// Test user configuration matching e2e/utils/seed-test-data.ts
export const TEST_USERS = {
  test_admin_001: {
    clerkId: "test_admin_001",
    role: "ADMIN",
    email: "admin@test.villages.local",
    firstName: "Test",
    lastName: "Admin",
  },
  test_volunteer_001: {
    clerkId: "test_volunteer_001",
    role: "VOLUNTEER",
    email: "volunteer@test.villages.local",
    firstName: "Test",
    lastName: "Volunteer",
  },
  test_member_001: {
    clerkId: "test_member_001",
    role: "MEMBER",
    email: "member@test.villages.local",
    firstName: "Test",
    lastName: "Member",
  },
} as const;

/**
 * Check if test mode bypass is enabled
 * CRITICAL: This must NEVER return true in production
 */
export function isTestModeEnabled(): boolean {
  // Double-check production safety
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  return process.env.INTEGRATION_TEST_MODE === "true";
}

/**
 * Get test user credentials from request headers
 */
async function getTestUserFromHeaders(): Promise<{
  userId: string;
  userRole: string;
} | null> {
  if (!isTestModeEnabled()) return null;

  const headersList = await headers();
  const userId = headersList.get("X-Test-User-Id");
  const userRole = headersList.get("X-Test-User-Role");

  if (userId && userRole) {
    return { userId, userRole };
  }

  return null;
}

/**
 * Get test user credentials from cookies
 */
async function getTestUserFromCookies(): Promise<{
  userId: string;
  userRole: string;
} | null> {
  if (!isTestModeEnabled()) return null;

  const cookieStore = await cookies();
  const userId = cookieStore.get("__test_user_id")?.value;
  const userRole = cookieStore.get("__test_user_role")?.value;

  if (userId && userRole) {
    return { userId, userRole };
  }

  return null;
}

/**
 * Wrapped auth() function that supports test mode bypass
 *
 * In test mode with valid credentials, returns mock session data.
 * Otherwise falls back to real Clerk auth.
 */
export async function auth() {
  // Check for test mode bypass
  if (isTestModeEnabled()) {
    // Try headers first, then cookies
    const testUser =
      (await getTestUserFromHeaders()) || (await getTestUserFromCookies());

    if (testUser) {
      console.log("🧪 Server Auth: Using test bypass", {
        userId: testUser.userId,
        role: testUser.userRole,
      });

      return {
        userId: testUser.userId,
        sessionClaims: {
          metadata: { role: testUser.userRole },
          sub: testUser.userId,
        },
      };
    }
  }

  // Fall back to real Clerk auth
  return clerkAuth();
}

/**
 * Wrapped currentUser() function that supports test mode bypass
 *
 * In test mode with valid credentials, returns mock user data.
 * Otherwise falls back to real Clerk currentUser.
 */
export async function currentUser() {
  // Check for test mode bypass
  if (isTestModeEnabled()) {
    const testUser =
      (await getTestUserFromHeaders()) || (await getTestUserFromCookies());

    if (testUser) {
      const userConfig = TEST_USERS[testUser.userId as keyof typeof TEST_USERS];

      if (userConfig) {
        console.log("🧪 Server CurrentUser: Using test bypass", {
          userId: testUser.userId,
        });

        return {
          id: userConfig.clerkId,
          firstName: userConfig.firstName,
          lastName: userConfig.lastName,
          fullName: `${userConfig.firstName} ${userConfig.lastName}`,
          emailAddresses: [{ emailAddress: userConfig.email }],
          primaryEmailAddress: { emailAddress: userConfig.email },
          imageUrl: null,
          primaryEmailAddressId: "test-email-id",
          publicMetadata: { role: userConfig.role },
        };
      }
    }
  }

  // Fall back to real Clerk currentUser
  return clerkCurrentUser();
}

/**
 * Mock Clerk client for test mode
 * Provides no-op implementations of Clerk user management operations
 */
const mockClerkClient = {
  users: {
    createUser: async (data: {
      emailAddress: string[];
      firstName?: string;
      lastName?: string;
      publicMetadata?: Record<string, unknown>;
      skipPasswordChecks?: boolean;
      skipPasswordRequirement?: boolean;
    }) => ({
      id: `test_user_${Date.now()}`,
      emailAddresses: [{ emailAddress: data.emailAddress[0] }],
      firstName: data.firstName,
      lastName: data.lastName,
      publicMetadata: data.publicMetadata,
    }),
    getUserList: async () => ({ data: [] }),
    updateUserMetadata: async () => ({}),
    deleteUser: async () => ({}),
  },
};

/**
 * Wrapped clerkClient() function that supports test mode bypass
 *
 * In test mode, returns a mock client that doesn't make real API calls.
 * Otherwise falls back to real Clerk client.
 */
export async function clerkClient() {
  if (isTestModeEnabled()) {
    console.log("🧪 ClerkClient: Using mock client for test mode");
    return mockClerkClient;
  }
  return realClerkClient();
}

/**
 * Synchronous auth extraction from request (for compatibility with older patterns)
 *
 * In test mode, extracts test user credentials from request headers.
 * Otherwise falls back to Clerk's auth().
 *
 * Note: This is a compatibility wrapper. New code should use the async auth() function.
 */
export function getAuth(request: Request): { userId: string | null } {
  // Check for test mode bypass using request headers
  if (isTestModeEnabled()) {
    const userId = request.headers.get("X-Test-User-Id");
    if (userId) {
      console.log("🧪 getAuth: Using test bypass", { userId });
      return { userId };
    }
  }

  // For non-test mode, return null - caller should use async auth() instead
  // This maintains backwards compatibility while encouraging migration
  console.warn(
    "⚠️ getAuth: Synchronous auth not available in production. Use async auth() instead.",
  );
  return { userId: null };
}
