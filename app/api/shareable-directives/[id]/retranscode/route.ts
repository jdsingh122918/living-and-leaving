import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server-auth";
import { UserRole as AppUserRole } from "@/lib/auth/roles";
import { UserRepository } from "@/lib/db/repositories/user.repository";
import { prisma } from "@/lib/db/prisma";
import { deleteBlob } from "@/lib/storage/blob.service";
import { transcodeVideoToMp4 } from "@/lib/storage/transcode.service";

const userRepository = new UserRepository();

export const runtime = "nodejs";
export const maxDuration = 60;

// POST /api/shareable-directives/[id]/retranscode
// Admin-only. Re-runs the H.264 MP4 transcode on a previously-finalized
// directive whose video is still .mov / .m4v. Useful for any directive
// finalized before video transcoding shipped.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: "Upload service is not configured", code: "blob_not_configured" },
        { status: 503 },
      );
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const actor = await userRepository.getUserByClerkId(userId);
    if (!actor || actor.role !== AppUserRole.ADMIN) {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const { id } = await params;
    const directive = await prisma.shareableDirective.findUnique({
      where: { id },
      select: {
        id: true,
        ownerId: true,
        videoBlobUrl: true,
        videoBlobPathname: true,
        videoMimeType: true,
        isRevoked: true,
      },
    });

    if (!directive) {
      return NextResponse.json({ error: "Directive not found" }, { status: 404 });
    }
    if (directive.isRevoked) {
      return NextResponse.json(
        { error: "Cannot retranscode a revoked directive" },
        { status: 409 },
      );
    }
    if (!directive.videoBlobUrl || !directive.videoBlobPathname) {
      return NextResponse.json(
        { error: "Directive has no video to retranscode" },
        { status: 409 },
      );
    }
    if (directive.videoMimeType === "video/mp4") {
      return NextResponse.json(
        {
          error: "Video is already MP4. Nothing to do.",
          code: "already_mp4",
        },
        { status: 409 },
      );
    }

    const transcoded = await transcodeVideoToMp4(
      directive.videoBlobUrl,
      directive.ownerId,
    );

    const oldPathname = directive.videoBlobPathname;
    await prisma.shareableDirective.update({
      where: { id: directive.id },
      data: {
        videoBlobUrl: transcoded.url,
        videoBlobPathname: transcoded.pathname,
        videoMimeType: transcoded.contentType,
        videoSizeBytes: transcoded.sizeBytes,
      },
    });
    await deleteBlob(oldPathname).catch((err) => {
      console.warn("Failed to delete old video blob after retranscode:", err);
    });

    return NextResponse.json({
      success: true,
      videoBlobUrl: transcoded.url,
      videoMimeType: transcoded.contentType,
      videoSizeBytes: transcoded.sizeBytes,
    });
  } catch (error) {
    console.error("❌ /api/shareable-directives/[id]/retranscode error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Retranscode failed" },
      { status: 500 },
    );
  }
}
