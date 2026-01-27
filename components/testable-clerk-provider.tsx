'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { ReactNode } from 'react';

/**
 * ClerkProvider wrapper that always renders ClerkProvider.
 *
 * Test mode authentication is handled by the useAuth/useUser wrappers
 * in lib/auth/client-auth.ts, which check for test cookies and return
 * mock data when present. This ensures React hooks rules are followed
 * since ClerkProvider context is always available.
 */
export function TestableClerkProvider({ children }: { children: ReactNode }) {
  // Always render ClerkProvider to ensure hooks context is available
  // Test mode is handled by the auth wrapper hooks
  return <ClerkProvider>{children}</ClerkProvider>;
}
