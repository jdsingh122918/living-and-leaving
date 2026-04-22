import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server-auth";
import { UserRole as AppUserRole } from "@/lib/auth/roles";
import { UserRepository } from "@/lib/db/repositories/user.repository";
import { shareableDirectiveRepository } from "@/lib/db/repositories/shareable-directive.repository";
import { prisma } from "@/lib/db/prisma";

const userRepository = new UserRepository();

export const runtime = "nodejs";

// POST /api/shareable-directives/[id]/revoke
// Owner or admin can revoke. Revocation is permanent for this directive —
// the token cannot be un-revoked. If the owner wants a new share link, they
// generate a new ShareableDirective from the template assignment.
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const actor = await userRepository.getUserByClerkId(userId);
    if (!actor) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const reason =
      typeof body?.reason === "string" && body.reason.trim().length > 0
        ? body.reason.trim().slice(0, 500)
        : undefined;

    const directive = await prisma.shareableDirective.findUnique({
      where: { id },
      select: { id: true, ownerId: true, isRevoked: true },
    });

    if (!directive) {
      return NextResponse.json(
        { error: "Directive not found" },
        { status: 404 },
      );
    }

    const isOwner = directive.ownerId === actor.id;
    const isAdmin = actor.role === AppUserRole.ADMIN;
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Only the owner or an admin can revoke" },
        { status: 403 },
      );
    }

    if (directive.isRevoked) {
      return NextResponse.json(
        { error: "Already revoked" },
        { status: 409 },
      );
    }

    const updated = await shareableDirectiveRepository.revoke(id, reason);

    return NextResponse.json({
      id: updated.id,
      isRevoked: updated.isRevoked,
      revokedAt: updated.revokedAt,
    });
  } catch (error) {
    console.error("❌ /api/shareable-directives/[id]/revoke error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
