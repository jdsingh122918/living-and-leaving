/**
 * Sync Clerk Users Script
 *
 * Detects and fixes sync issues between the local database and Clerk.
 * For each database user, checks if their Clerk account exists.
 * Orphaned users (DB record but no Clerk account) are re-created in Clerk
 * and their database record is updated with the new Clerk ID.
 *
 * Usage:
 *   npx tsx scripts/sync-clerk-users.ts              # Dry run (report only)
 *   npx tsx scripts/sync-clerk-users.ts --fix         # Fix orphaned users
 *   npx tsx scripts/sync-clerk-users.ts --fix --verbose
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClerkClient } from "@clerk/backend";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

const args = process.argv.slice(2);
const FIX_MODE = args.includes("--fix");
const VERBOSE = args.includes("--verbose");

interface SyncResult {
  total: number;
  synced: number;
  orphaned: number;
  fixed: number;
  failed: number;
  details: {
    email: string;
    dbId: string;
    oldClerkId: string;
    status: "synced" | "orphaned" | "fixed" | "failed";
    newClerkId?: string;
    error?: string;
  }[];
}

async function checkClerkUser(clerkId: string): Promise<boolean> {
  try {
    await clerk.users.getUser(clerkId);
    return true;
  } catch {
    return false;
  }
}

async function recreateClerkUser(user: {
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
}): Promise<{ id: string }> {
  // Check if email already exists in Clerk under a different ID
  const existing = await clerk.users.getUserList({
    emailAddress: [user.email],
  });

  if (existing.data.length > 0) {
    return { id: existing.data[0].id };
  }

  // Create new Clerk account
  return clerk.users.createUser({
    emailAddress: [user.email],
    firstName: user.firstName || undefined,
    lastName: user.lastName || undefined,
    publicMetadata: { role: user.role },
    skipPasswordChecks: true,
    skipPasswordRequirement: true,
  });
}

async function syncClerkUsers(): Promise<SyncResult> {
  const result: SyncResult = {
    total: 0,
    synced: 0,
    orphaned: 0,
    fixed: 0,
    failed: 0,
    details: [],
  };

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
  });

  result.total = users.length;
  console.log(`\nFound ${users.length} users in database.\n`);

  for (const user of users) {
    const name = user.firstName
      ? `${user.firstName} ${user.lastName || ""}`.trim()
      : user.email;

    if (VERBOSE) {
      process.stdout.write(`  Checking ${name} (${user.clerkId})... `);
    }

    const exists = await checkClerkUser(user.clerkId);

    if (exists) {
      result.synced++;
      result.details.push({
        email: user.email,
        dbId: user.id,
        oldClerkId: user.clerkId,
        status: "synced",
      });
      if (VERBOSE) console.log("✓ synced");
      continue;
    }

    // Orphaned user
    result.orphaned++;

    if (!FIX_MODE) {
      result.details.push({
        email: user.email,
        dbId: user.id,
        oldClerkId: user.clerkId,
        status: "orphaned",
      });
      if (VERBOSE) {
        console.log("✗ ORPHANED (no Clerk account)");
      } else {
        console.log(`  ✗ ${name} <${user.email}> — orphaned (Clerk ID: ${user.clerkId})`);
      }
      continue;
    }

    // Fix mode: re-create in Clerk and update DB
    try {
      if (VERBOSE) process.stdout.write("✗ orphaned → fixing... ");

      const clerkUser = await recreateClerkUser({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { clerkId: clerkUser.id },
      });

      result.fixed++;
      result.details.push({
        email: user.email,
        dbId: user.id,
        oldClerkId: user.clerkId,
        status: "fixed",
        newClerkId: clerkUser.id,
      });

      console.log(
        VERBOSE
          ? `✓ fixed (new Clerk ID: ${clerkUser.id})`
          : `  ✓ Fixed ${name} <${user.email}> → ${clerkUser.id}`
      );
    } catch (error) {
      result.failed++;
      const msg = error instanceof Error ? error.message : String(error);
      result.details.push({
        email: user.email,
        dbId: user.id,
        oldClerkId: user.clerkId,
        status: "failed",
        error: msg,
      });

      console.log(
        VERBOSE
          ? `✗ FAILED: ${msg}`
          : `  ✗ Failed ${name} <${user.email}>: ${msg}`
      );
    }
  }

  return result;
}

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  Clerk ↔ Database User Sync");
  console.log(`  Mode: ${FIX_MODE ? "FIX (will re-create missing Clerk accounts)" : "DRY RUN (report only)"}`);
  console.log("═══════════════════════════════════════════");

  if (!process.env.CLERK_SECRET_KEY) {
    console.error("\n✗ CLERK_SECRET_KEY not found in .env.local");
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error("\n✗ DATABASE_URL not found in .env.local");
    process.exit(1);
  }

  const result = await syncClerkUsers();

  console.log("\n───────────────────────────────────────────");
  console.log("  Summary");
  console.log("───────────────────────────────────────────");
  console.log(`  Total users:    ${result.total}`);
  console.log(`  Synced (OK):    ${result.synced}`);
  console.log(`  Orphaned:       ${result.orphaned}`);
  if (FIX_MODE) {
    console.log(`  Fixed:          ${result.fixed}`);
    console.log(`  Failed:         ${result.failed}`);
  }
  console.log("───────────────────────────────────────────");

  if (!FIX_MODE && result.orphaned > 0) {
    console.log(`\n  Run with --fix to re-create ${result.orphaned} orphaned Clerk account(s).`);
  }

  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\nSync failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
