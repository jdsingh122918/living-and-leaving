import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@/lib/auth/server-auth";
import { UserRole } from "@prisma/client";
import { UserRepository } from "@/lib/db/repositories/user.repository";
import brandConfig from "@/brand.config";

const userRepository = new UserRepository();

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/users/[id]/resend-invitation
//
// Issues a fresh Clerk invitation email to an existing DB user. Used when:
//   - The original invitation email never arrived
//   - The Clerk account was deleted and needs to be recreated
//   - A new device-link is needed for a user who can't sign in
//
// Note: this does NOT create a new DB row. The user.created webhook,
// once the invitee accepts, will rebind the existing DB row to the
// new clerkId via updateClerkIdByEmail (see #419).
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await userRepository.getUserByClerkId(clerkUserId);
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (currentUser.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Only admins can resend invitations" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const targetUser = await userRepository.getUserById(id);
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || `https://${brandConfig.domain}`;
    const client = await clerkClient();
    const invitation = await client.invitations.createInvitation({
      emailAddress: targetUser.email,
      publicMetadata: { role: targetUser.role },
      redirectUrl: `${appUrl}/sign-up`,
      notify: true,
      ignoreExisting: true,
    });

    console.log("✅ Resend invitation sent:", {
      invitationId: invitation.id,
      email: invitation.emailAddress,
      targetUserId: targetUser.id,
      issuedBy: currentUser.id,
    });

    return NextResponse.json({
      success: true,
      message: `Invitation re-sent to ${targetUser.email}.`,
      invitationId: invitation.id,
    });
  } catch (error) {
    console.error("❌ Error resending invitation:", error);
    const message =
      error instanceof Error ? error.message : "Failed to resend invitation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
