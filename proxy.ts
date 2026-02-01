import { NextRequest, NextResponse } from "next/server";
import { UserRole, canAccessRoute, getDefaultRoute } from "@/lib/auth/roles";

/**
 * NEXT.JS 16 COMPATIBILITY NOTE:
 *
 * This file uses Next.js 16 naming convention (proxy.ts) but still uses
 * Clerk's clerkMiddleware pattern. This is intentional as:
 *
 * 1. Clerk @clerk/nextjs 6.34.5 may not fully support proxy() export pattern yet
 * 2. clerkMiddleware provides stable authentication handling
 * 3. File naming is future-proof for when Clerk adds full proxy support
 *
 * INTEGRATION_TEST_MODE:
 * When enabled, Clerk imports are skipped entirely (via dynamic import) to
 * avoid publishable key validation errors with placeholder keys. Auth is
 * handled via test cookies (__test_user_id, __test_user_role).
 */

const isTestMode = process.env.INTEGRATION_TEST_MODE === "true";

// Public route patterns (used by test mode middleware)
const PUBLIC_ROUTE_PATTERNS = [
  /^\/$/,
  /^\/sign-in/,
  /^\/verify/,
  /^\/api\/webhooks\/clerk/,
  /^\/api\/debug\//,
  /^\/api\/health/,
  /^\/api\/auth\/test-login/,
];

function isPublicPath(path: string): boolean {
  return PUBLIC_ROUTE_PATTERNS.some((pattern) => pattern.test(path));
}

// =============================================================================
// Test Mode Middleware (no Clerk dependency)
// =============================================================================

async function testModeMiddleware(request: NextRequest): Promise<NextResponse> {
  const path = request.nextUrl.pathname;

  // Allow public routes
  if (isPublicPath(path)) {
    return NextResponse.next();
  }

  // Read test credentials from headers or cookies
  const userId =
    request.headers.get("X-Test-User-Id") ||
    request.cookies.get("__test_user_id")?.value;
  const userRole = (request.headers.get("X-Test-User-Role") ||
    request.cookies.get("__test_user_role")?.value) as UserRole | undefined;

  // Not authenticated
  if (!userId || !userRole) {
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Redirect to test login page (sign-in page requires ClerkProvider)
    return NextResponse.redirect(new URL("/api/auth/test-login", request.url));
  }

  // API routes just need authentication
  if (path.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Handle dashboard redirect
  if (path === "/dashboard") {
    const defaultRoute = getDefaultRoute(userRole);
    return NextResponse.redirect(new URL(defaultRoute, request.url));
  }

  // Role-based access control
  if (!canAccessRoute(userRole, path)) {
    const defaultRoute = getDefaultRoute(userRole);
    return NextResponse.redirect(new URL(defaultRoute, request.url));
  }

  return NextResponse.next();
}

// =============================================================================
// Clerk Middleware (lazy-loaded to avoid module-level key validation)
// =============================================================================

let _clerkHandler: ((req: NextRequest, event: any) => any) | null = null;

async function getClerkHandler() {
  if (_clerkHandler) return _clerkHandler;

  const { clerkMiddleware, createRouteMatcher } = await import(
    "@clerk/nextjs/server"
  );
  const { prisma } = await import("@/lib/db/prisma");

  const isPublicRoute = createRouteMatcher([
    "/",
    "/sign-in(.*)",
    "/verify(.*)",
    "/api/webhooks/clerk(.*)",
    "/api/debug/auth(.*)",
    "/api/debug/database(.*)",
    "/api/debug/sync-user(.*)",
    "/api/debug/reset-database(.*)",
    "/api/debug/webhook-test(.*)",
    "/api/health(.*)",
    "/api/auth/test-login(.*)",
  ]);

  const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
  const isVolunteerRoute = createRouteMatcher(["/volunteer(.*)"]);

  _clerkHandler = clerkMiddleware(async (auth, request) => {
    const path = request.nextUrl.pathname;

    const authResult = await auth();
    const userId = authResult.userId;
    const sessionClaims = authResult.sessionClaims;

    // Allow public routes
    if (isPublicRoute(request)) {
      return NextResponse.next();
    }

    // Handle API routes - return JSON 401 instead of redirecting
    if (path.startsWith("/api/")) {
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Auto-sync user to database if needed
      try {
        const dbUser = await prisma.user.findUnique({
          where: { clerkId: userId },
          select: { role: true, id: true, email: true },
        });

        if (!dbUser) {
          try {
            const clerkUser = await fetch(
              `https://api.clerk.com/v1/users/${userId}`,
              {
                headers: {
                  Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
                  "Content-Type": "application/json",
                },
              }
            ).then((res) => res.json());

            if (clerkUser && clerkUser.email_addresses?.[0]?.email_address) {
              const { UserRepository } = await import(
                "@/lib/db/repositories/user.repository"
              );
              const { UserRole } = await import("@/lib/auth/roles");
              const userRepository = new UserRepository();

              const role =
                clerkUser.public_metadata?.role ||
                clerkUser.private_metadata?.role ||
                clerkUser.unsafe_metadata?.role ||
                UserRole.MEMBER;

              await userRepository.createUser({
                clerkId: userId,
                email: clerkUser.email_addresses[0].email_address,
                firstName: clerkUser.first_name || undefined,
                lastName: clerkUser.last_name || undefined,
                role: role as UserRole,
                phoneNumber:
                  clerkUser.phone_numbers?.[0]?.phone_number || undefined,
              });
            }
          } catch (syncError) {
            console.error("API route auto-sync failed:", syncError);
          }
        }
      } catch (error) {
        console.error("API route database check failed:", error);
      }

      return NextResponse.next();
    }

    // Require authentication for protected routes
    if (!userId) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    // Extract role from session claims
    const userRole = (sessionClaims?.metadata as { role?: string })
      ?.role as UserRole;

    let finalUserRole = userRole;

    // Database fallback for missing role
    if (!userRole) {
      try {
        const dbUser = await prisma.user.findUnique({
          where: { clerkId: userId },
          select: { role: true, id: true, email: true },
        });

        if (dbUser?.role) {
          finalUserRole = dbUser.role as UserRole;
        } else {
          try {
            const clerkUser = await fetch(
              `https://api.clerk.com/v1/users/${userId}`,
              {
                headers: {
                  Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
                  "Content-Type": "application/json",
                },
              }
            ).then((res) => res.json());

            if (clerkUser && clerkUser.email_addresses?.[0]?.email_address) {
              const { UserRepository } = await import(
                "@/lib/db/repositories/user.repository"
              );
              const { UserRole } = await import("@/lib/auth/roles");
              const userRepository = new UserRepository();

              const role =
                clerkUser.public_metadata?.role ||
                clerkUser.private_metadata?.role ||
                clerkUser.unsafe_metadata?.role ||
                UserRole.MEMBER;

              const newUser = await userRepository.createUser({
                clerkId: userId,
                email: clerkUser.email_addresses[0].email_address,
                firstName: clerkUser.first_name || undefined,
                lastName: clerkUser.last_name || undefined,
                role: role as UserRole,
                phoneNumber:
                  clerkUser.phone_numbers?.[0]?.phone_number || undefined,
              });

              finalUserRole = newUser.role as UserRole;
            }
          } catch (syncError) {
            console.error("Auto-sync failed:", syncError);
          }
        }
      } catch (error) {
        console.error("Database fallback failed:", error);
      }

      // Default to member if no role found
      if (!finalUserRole) {
        if (path === "/dashboard") {
          return NextResponse.redirect(new URL("/member", request.url));
        }
        if (path.startsWith("/member")) {
          return NextResponse.next();
        }
        return NextResponse.redirect(new URL("/member", request.url));
      }
    }

    // Handle dashboard redirect
    if (path === "/dashboard") {
      const defaultRoute = getDefaultRoute(finalUserRole);
      return NextResponse.redirect(new URL(defaultRoute, request.url));
    }

    // Role-based access control
    if (!canAccessRoute(finalUserRole, path)) {
      const defaultRoute = getDefaultRoute(finalUserRole);
      return NextResponse.redirect(new URL(defaultRoute, request.url));
    }

    if (isAdminRoute(request) && finalUserRole !== UserRole.ADMIN) {
      const defaultRoute = getDefaultRoute(finalUserRole);
      return NextResponse.redirect(new URL(defaultRoute, request.url));
    }

    if (
      isVolunteerRoute(request) &&
      finalUserRole !== UserRole.VOLUNTEER &&
      finalUserRole !== UserRole.ADMIN
    ) {
      const defaultRoute = getDefaultRoute(finalUserRole);
      return NextResponse.redirect(new URL(defaultRoute, request.url));
    }

    return NextResponse.next();
  });

  return _clerkHandler;
}

// =============================================================================
// Middleware entry point
// =============================================================================

export default async function middleware(
  request: NextRequest,
  event: any
): Promise<NextResponse> {
  if (isTestMode) {
    return testModeMiddleware(request);
  }

  const handler = await getClerkHandler();
  return handler(request, event);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
