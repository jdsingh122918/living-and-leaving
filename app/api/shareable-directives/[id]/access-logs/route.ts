import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server-auth";
import { UserRole as AppUserRole } from "@/lib/auth/roles";
import { UserRepository } from "@/lib/db/repositories/user.repository";
import { shareableDirectiveRepository } from "@/lib/db/repositories/shareable-directive.repository";
import { prisma } from "@/lib/db/prisma";

const userRepository = new UserRepository();

export const runtime = "nodejs";

// GET /api/shareable-directives/[id]/access-logs?limit=100
// Owner (or their designated proxy, or an admin) can view the full scan audit.
export async function GET(
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
    const directive = await prisma.shareableDirective.findUnique({
      where: { id },
      select: { id: true, ownerId: true, owner: { select: { proxyUserId: true } } },
    });

    if (!directive) {
      return NextResponse.json(
        { error: "Directive not found" },
        { status: 404 },
      );
    }

    const isOwner = directive.ownerId === actor.id;
    const isProxy = directive.owner.proxyUserId === actor.id;
    const isAdmin = actor.role === AppUserRole.ADMIN;
    if (!isOwner && !isProxy && !isAdmin) {
      return NextResponse.json(
        { error: "Not authorized to view these logs" },
        { status: 403 },
      );
    }

    const limitParam = request.nextUrl.searchParams.get("limit");
    const limit = limitParam
      ? Math.max(1, Math.min(500, Number.parseInt(limitParam, 10) || 100))
      : 100;

    const logs = await shareableDirectiveRepository.getAccessLogs(id, limit);

    return NextResponse.json({
      logs: logs.map((l) => ({
        id: l.id,
        scannedAt: l.scannedAt,
        userAgent: l.userAgent,
        countryCode: l.countryCode,
        wasNotified: l.wasNotified,
      })),
    });
  } catch (error) {
    console.error("❌ /api/shareable-directives/[id]/access-logs error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
