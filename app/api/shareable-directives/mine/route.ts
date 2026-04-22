import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server-auth";
import { UserRepository } from "@/lib/db/repositories/user.repository";
import { prisma } from "@/lib/db/prisma";

const userRepository = new UserRepository();

export const runtime = "nodejs";

// GET /api/shareable-directives/mine
// Returns all ShareableDirectives owned by the authenticated user, with
// denormalized scan-count + last-scan timestamp for quick display.
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const actor = await userRepository.getUserByClerkId(userId);
    if (!actor) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const directives = await prisma.shareableDirective.findMany({
      where: { ownerId: actor.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { accessLogs: true } },
        accessLogs: {
          orderBy: { scannedAt: "desc" },
          take: 1,
          select: { scannedAt: true },
        },
      },
    });

    return NextResponse.json({
      directives: directives.map((d) => ({
        id: d.id,
        token: d.token,
        createdAt: d.createdAt,
        isRevoked: d.isRevoked,
        revokedAt: d.revokedAt,
        hasVideo: Boolean(d.videoBlobUrl),
        videoMimeType: d.videoMimeType,
        scanCount: d._count.accessLogs,
        lastScannedAt: d.accessLogs[0]?.scannedAt ?? null,
      })),
    });
  } catch (error) {
    console.error("❌ /api/shareable-directives/mine error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
