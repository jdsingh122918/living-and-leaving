/**
 * Seed Test Users Script
 *
 * Upserts 3 test users into MongoDB via Prisma so the app can run
 * in local dev mode without Clerk.
 *
 * Users created:
 *   - test_admin_001     (ADMIN)     admin@test.villages.local
 *   - test_volunteer_001 (VOLUNTEER) volunteer@test.villages.local
 *   - test_member_001    (MEMBER)    member@test.villages.local
 *
 * Run with: npx tsx scripts/seed-test-users.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── ANSI colours for console output ────────────────────────────────
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

// ── Test users (mirrors lib/auth/server-auth.ts TEST_USERS) ────────
const TEST_USERS = [
  {
    clerkId: 'test_admin_001',
    role: 'ADMIN' as const,
    email: 'admin@test.villages.local',
    firstName: 'Test',
    lastName: 'Admin',
  },
  {
    clerkId: 'test_volunteer_001',
    role: 'VOLUNTEER' as const,
    email: 'volunteer@test.villages.local',
    firstName: 'Test',
    lastName: 'Volunteer',
  },
  {
    clerkId: 'test_member_001',
    role: 'MEMBER' as const,
    email: 'member@test.villages.local',
    firstName: 'Test',
    lastName: 'Member',
  },
];

async function main() {
  console.log(`\n${BOLD}${CYAN}Seeding test users...${RESET}\n`);

  const results: { clerkId: string; email: string; role: string; action: string }[] = [];

  for (const user of TEST_USERS) {
    const existing = await prisma.user.findUnique({
      where: { clerkId: user.clerkId },
    });

    const upserted = await prisma.user.upsert({
      where: { clerkId: user.clerkId },
      create: {
        clerkId: user.clerkId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        emailVerified: true,
      },
      update: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        emailVerified: true,
      },
    });

    results.push({
      clerkId: upserted.clerkId,
      email: upserted.email,
      role: upserted.role,
      action: existing ? 'updated' : 'created',
    });
  }

  // ── Summary table ──────────────────────────────────────────────
  console.log(`${BOLD}  ClerkId                  Role        Email                              Status${RESET}`);
  console.log(`${DIM}  ${'─'.repeat(90)}${RESET}`);

  for (const r of results) {
    const statusColor = r.action === 'created' ? GREEN : YELLOW;
    const statusLabel = r.action === 'created' ? 'CREATED' : 'UPDATED';
    console.log(
      `  ${r.clerkId.padEnd(24)} ${r.role.padEnd(11)} ${r.email.padEnd(34)} ${statusColor}${statusLabel}${RESET}`
    );
  }

  const created = results.filter((r) => r.action === 'created').length;
  const updated = results.filter((r) => r.action === 'updated').length;

  console.log(
    `\n${GREEN}Done.${RESET} ${created} created, ${updated} updated out of ${results.length} test users.\n`
  );
}

main()
  .catch((e) => {
    console.error(`\n\x1b[31mFailed to seed test users:\x1b[0m`, e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
