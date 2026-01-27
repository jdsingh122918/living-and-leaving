"use client";

/**
 * Client-side authentication wrapper with test mode bypass
 *
 * This module wraps Clerk's useAuth hook to support test mode bypass
 * for E2E testing without requiring real Clerk authentication.
 *
 * Security: Bypass is ONLY available when test cookies are present
 * and we're in a browser context (not production deployment).
 */

import {
  useAuth as useClerkAuth,
  useUser as useClerkUser,
} from "@clerk/nextjs";
import { useSyncExternalStore, useMemo } from "react";

// Test cookie names matching e2e/fixtures/auth.fixture.ts
const TEST_USER_ID_COOKIE = "__test_user_id";
const TEST_USER_ROLE_COOKIE = "__test_user_role";

// Cache for test mode state to prevent infinite re-renders
// useSyncExternalStore requires referential equality for its snapshot
let cachedTestMode: { isTestMode: boolean; userId?: string; role?: string } = {
  isTestMode: false,
};

/**
 * Check if test mode is active by looking for test cookies.
 * Returns a cached object to maintain referential equality.
 */
function getTestMode(): {
  isTestMode: boolean;
  userId?: string;
  role?: string;
} {
  if (typeof document === "undefined") {
    return { isTestMode: false };
  }

  const cookies = document.cookie.split("; ");
  let userId: string | undefined;
  let role: string | undefined;

  for (const cookie of cookies) {
    if (cookie.startsWith(`${TEST_USER_ID_COOKIE}=`)) {
      userId = cookie.substring(TEST_USER_ID_COOKIE.length + 1);
    }
    if (cookie.startsWith(`${TEST_USER_ROLE_COOKIE}=`)) {
      role = cookie.substring(TEST_USER_ROLE_COOKIE.length + 1);
    }
  }

  const isTestMode = !!(userId && role);

  // Only create new object if values changed
  if (
    cachedTestMode.isTestMode !== isTestMode ||
    cachedTestMode.userId !== userId ||
    cachedTestMode.role !== role
  ) {
    cachedTestMode = { isTestMode, userId, role };
  }

  return cachedTestMode;
}

// Subscribe to cookie changes (no-op since cookies don't change during session)
function subscribe() {
  return () => {};
}

// Server-side default - must be stable reference
const SERVER_DEFAULT: { isTestMode: boolean; userId?: string; role?: string } =
  { isTestMode: false };
function getServerSnapshot(): {
  isTestMode: boolean;
  userId?: string;
  role?: string;
} {
  return SERVER_DEFAULT;
}

/**
 * Wrapper for useAuth that supports test mode bypass.
 *
 * In test mode (when test cookies are present), returns mock auth state.
 * Otherwise falls back to real Clerk useAuth.
 */
export function useAuth() {
  const testMode = useSyncExternalStore(
    subscribe,
    getTestMode,
    getServerSnapshot,
  );

  // Always call the Clerk hook to follow rules of hooks
  // ClerkProvider is always present (TestableClerkProvider always renders it)
  const clerkAuth = useClerkAuth();

  // Memoize mock auth to prevent unnecessary re-renders
  const mockAuth = useMemo(
    () => ({
      isLoaded: true,
      isSignedIn: true,
      userId: testMode.userId,
      sessionId: `test-session-${testMode.userId}`,
      sessionClaims: {
        metadata: { role: testMode.role },
        sub: testMode.userId,
      },
      orgId: null,
      orgRole: null,
      orgSlug: null,
      actor: null,
      getToken: async () => `test-token-${testMode.userId}`,
      signOut: async () => {
        console.log("[useAuth] Mock signOut called");
      },
      has: () => true,
    }),
    [testMode.userId, testMode.role],
  );

  // In test mode, return mock auth state
  if (testMode.isTestMode) {
    return mockAuth;
  }

  // Return real Clerk auth
  return clerkAuth;
}

/**
 * Wrapper for useUser that supports test mode bypass.
 */
export function useUser() {
  const testMode = useSyncExternalStore(
    subscribe,
    getTestMode,
    getServerSnapshot,
  );

  // Always call the Clerk hook to follow rules of hooks
  const clerkUser = useClerkUser();

  // Map test user IDs to user data
  const testUsers: Record<
    string,
    { firstName: string; lastName: string; email: string }
  > = {
    test_admin_001: {
      firstName: "Test",
      lastName: "Admin",
      email: "admin@test.villages.local",
    },
    test_volunteer_001: {
      firstName: "Test",
      lastName: "Volunteer",
      email: "volunteer@test.villages.local",
    },
    test_member_001: {
      firstName: "Test",
      lastName: "Member",
      email: "member@test.villages.local",
    },
  };

  // Memoize mock user to prevent unnecessary re-renders
  const mockUser = useMemo(() => {
    const userData = testUsers[testMode.userId || ""] || {
      firstName: "Test",
      lastName: "User",
      email: "test@test.villages.local",
    };

    return {
      isLoaded: true,
      isSignedIn: true,
      user: {
        id: testMode.userId,
        firstName: userData.firstName,
        lastName: userData.lastName,
        fullName: `${userData.firstName} ${userData.lastName}`,
        emailAddresses: [{ emailAddress: userData.email }],
        primaryEmailAddress: { emailAddress: userData.email },
        imageUrl: null,
        publicMetadata: { role: testMode.role },
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testMode.userId, testMode.role]);

  // In test mode, return mock user
  if (testMode.isTestMode) {
    return mockUser;
  }

  // Return real Clerk user
  return clerkUser;
}
