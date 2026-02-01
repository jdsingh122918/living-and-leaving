'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { ReactNode } from 'react';

/**
 * When NEXT_PUBLIC_INTEGRATION_TEST_MODE is set, this env var is baked in
 * at build/bundle time and never changes between renders, so the conditional
 * rendering below is safe (same branch every render).
 */
const isTestMode = process.env.NEXT_PUBLIC_INTEGRATION_TEST_MODE === 'true';

/**
 * ClerkProvider wrapper that skips Clerk entirely in test mode.
 *
 * In test mode (NEXT_PUBLIC_INTEGRATION_TEST_MODE=true), ClerkProvider is
 * not rendered because its publishable key validation would fail with
 * placeholder keys. Authentication is handled by the useAuth/useUser
 * wrappers in lib/auth/client-auth.ts via test cookies.
 *
 * In normal mode, ClerkProvider is always rendered so hooks context
 * is available.
 */
export function TestableClerkProvider({ children }: { children: ReactNode }) {
  if (isTestMode) {
    return <>{children}</>;
  }
  return <ClerkProvider>{children}</ClerkProvider>;
}
