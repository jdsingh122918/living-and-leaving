import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server-auth";
import { UserRole } from "@prisma/client";
import { UserRepository } from "@/lib/db/repositories/user.repository";

const userRepository = new UserRepository();

// GET /api/users/deleted — List soft-deleted users with grace-window metadata.
// Admin-only.
export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await userRepository.getUserByClerkId(userId);
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (currentUser.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Only administrators can view deleted users" },
        { status: 403 },
      );
    }

    const deleted = await userRepository.getSoftDeletedUsers();

    const now = Date.now();
    const formatted = deleted.map((u) => {
      const purgeAt = u.scheduledPermanentDeletionAt
        ? new Date(u.scheduledPermanentDeletionAt).getTime()
        : null;
      const daysUntilPurge =
        purgeAt !== null ? Math.max(0, Math.ceil((purgeAt - now) / 86_400_000)) : null;

      return {
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        familyId: u.familyId,
        family: u.family
          ? { id: u.family.id, name: u.family.name }
          : null,
        deletedAt: u.deletedAt,
        deletionReason: u.deletionReason,
        scheduledPermanentDeletionAt: u.scheduledPermanentDeletionAt,
        daysUntilPurge,
      };
    });

    return NextResponse.json({
      users: formatted,
      total: formatted.length,
    });
  } catch (error) {
    console.error("❌ Error listing deleted users:", error);
    return NextResponse.json(
      { error: "Failed to list deleted users" },
      { status: 500 },
    );
  }
}
