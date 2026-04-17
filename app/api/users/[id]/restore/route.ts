import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@/lib/auth/server-auth";
import { UserRole } from "@prisma/client";
import { UserRepository } from "@/lib/db/repositories/user.repository";

const userRepository = new UserRepository();

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// POST /api/users/[id]/restore — Restore a soft-deleted user.
export async function POST(_request: NextRequest, { params }: RouteParams) {
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
        { error: "Only administrators can restore users" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const targetUser = await userRepository.getUserById(id);
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!targetUser.deletedAt) {
      return NextResponse.json(
        { error: "User is not deleted" },
        { status: 400 },
      );
    }

    // Unban in Clerk so they can log in again.
    try {
      const client = await clerkClient();
      await client.users.unbanUser(targetUser.clerkId);
      console.log("✅ Clerk user unbanned:", targetUser.clerkId);
    } catch (clerkError) {
      console.error("⚠️ Failed to unban Clerk user:", clerkError);
      // Continue — admin can retry if Clerk state drifts.
    }

    const restored = await userRepository.restoreUser(id);

    return NextResponse.json({
      success: true,
      message: "User restored.",
      user: {
        id: restored.id,
        email: restored.email,
        firstName: restored.firstName,
        lastName: restored.lastName,
        role: restored.role,
      },
    });
  } catch (error) {
    console.error("❌ Error restoring user:", error);
    return NextResponse.json(
      { error: "Failed to restore user" },
      { status: 500 },
    );
  }
}
