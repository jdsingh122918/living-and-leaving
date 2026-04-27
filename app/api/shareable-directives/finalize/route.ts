import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server-auth";
import { UserRole as AppUserRole } from "@/lib/auth/roles";
import { UserRepository } from "@/lib/db/repositories/user.repository";
import { prisma } from "@/lib/db/prisma";
import { shareableDirectiveRepository } from "@/lib/db/repositories/shareable-directive.repository";
import {
  BlobConstants,
  deleteBlob,
  isAcceptedVideoExtension,
  isAcceptedVideoMimeType,
  isPathnameOwnedBy,
} from "@/lib/storage/blob.service";
import { transcodeVideoToMp4 } from "@/lib/storage/transcode.service";
import brandConfig from "@/brand.config";

const userRepository = new UserRepository();

export const runtime = "nodejs";
// Transcoding a 5-min video can run 30-50s on Vercel Pro's serverless CPU.
export const maxDuration = 60;

interface BlobRef {
  url: string;
  pathname: string;
  contentType: string;
  sizeBytes: number;
}

interface FinalizeRequest {
  templateAssignmentId: string;
  pdfBlob: BlobRef;
  videoBlob?: BlobRef | null;
}

function pathnameExtension(pathname: string): string {
  const idx = pathname.lastIndexOf(".");
  return idx >= 0 ? pathname.slice(idx + 1).toLowerCase() : "";
}

function isBlobRef(value: unknown): value is BlobRef {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.url === "string" &&
    typeof v.pathname === "string" &&
    typeof v.contentType === "string" &&
    typeof v.sizeBytes === "number" &&
    Number.isFinite(v.sizeBytes)
  );
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        {
          error:
            "Upload service is not yet configured. Please contact support.",
          code: "blob_not_configured",
        },
        { status: 503 },
      );
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const actor = await userRepository.getUserByClerkId(userId);
    if (!actor) {
      return NextResponse.json(
        { error: "Actor not found" },
        { status: 404 },
      );
    }

    let parsed: FinalizeRequest;
    try {
      const json = (await request.json()) as Partial<FinalizeRequest>;
      if (
        typeof json?.templateAssignmentId !== "string" ||
        !json.templateAssignmentId ||
        !isBlobRef(json.pdfBlob) ||
        (json.videoBlob != null && !isBlobRef(json.videoBlob))
      ) {
        return NextResponse.json(
          { error: "Invalid request body" },
          { status: 400 },
        );
      }
      parsed = json as FinalizeRequest;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON" },
        { status: 400 },
      );
    }

    const { templateAssignmentId, pdfBlob, videoBlob } = parsed;

    const assignment = await prisma.templateAssignment.findUnique({
      where: { id: templateAssignmentId },
      select: {
        id: true,
        assigneeId: true,
        status: true,
        shareableDirective: { select: { id: true } },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Template assignment not found" },
        { status: 404 },
      );
    }

    const isAssignee = assignment.assigneeId === actor.id;
    const isAdmin = actor.role === AppUserRole.ADMIN;
    if (!isAssignee && !isAdmin) {
      return NextResponse.json(
        { error: "Only the assignee or an admin can finalize" },
        { status: 403 },
      );
    }

    if (assignment.status !== "completed" && assignment.status !== "finalized") {
      return NextResponse.json(
        {
          error: "Assignment must be in 'completed' state before finalizing",
          currentStatus: assignment.status,
        },
        { status: 409 },
      );
    }

    if (assignment.shareableDirective) {
      return NextResponse.json(
        {
          error: "This assignment already has a ShareableDirective",
          directiveId: assignment.shareableDirective.id,
        },
        { status: 409 },
      );
    }

    // Validate the blobs the client just uploaded actually live in our
    // namespace. The upload-handler enforced this on token issue, but a
    // belt-and-suspenders check here also rejects forged blob URLs from a
    // separate Vercel Blob store.
    if (!isPathnameOwnedBy(pdfBlob.pathname, assignment.assigneeId)) {
      return NextResponse.json(
        { error: "PDF blob is not in the assignee namespace" },
        { status: 400 },
      );
    }
    if (pathnameExtension(pdfBlob.pathname) !== "pdf") {
      return NextResponse.json(
        { error: "PDF blob must have .pdf extension" },
        { status: 400 },
      );
    }
    if (pdfBlob.contentType !== BlobConstants.PDF_MIME_TYPE) {
      return NextResponse.json(
        { error: `PDF blob must be ${BlobConstants.PDF_MIME_TYPE}` },
        { status: 400 },
      );
    }
    if (pdfBlob.sizeBytes > BlobConstants.MAX_PDF_BYTES) {
      return NextResponse.json(
        { error: "PDF exceeds maximum size" },
        { status: 400 },
      );
    }

    if (videoBlob) {
      if (!isPathnameOwnedBy(videoBlob.pathname, assignment.assigneeId)) {
        return NextResponse.json(
          { error: "Video blob is not in the assignee namespace" },
          { status: 400 },
        );
      }
      if (!isAcceptedVideoExtension(pathnameExtension(videoBlob.pathname))) {
        return NextResponse.json(
          { error: "Video blob has unsupported extension" },
          { status: 400 },
        );
      }
      if (!isAcceptedVideoMimeType(videoBlob.contentType)) {
        return NextResponse.json(
          { error: "Video blob has unsupported MIME type" },
          { status: 400 },
        );
      }
      if (videoBlob.sizeBytes > BlobConstants.MAX_VIDEO_BYTES) {
        return NextResponse.json(
          { error: "Video exceeds maximum size" },
          { status: 400 },
        );
      }
    }

    let directive;
    try {
      directive = await shareableDirectiveRepository.createForAssignment({
        ownerId: assignment.assigneeId,
        templateAssignmentId: assignment.id,
        pdfBlobUrl: pdfBlob.url,
        pdfBlobPathname: pdfBlob.pathname,
        videoBlobUrl: videoBlob?.url ?? null,
        videoBlobPathname: videoBlob?.pathname ?? null,
        videoMimeType: videoBlob?.contentType ?? null,
        videoSizeBytes: videoBlob?.sizeBytes ?? null,
      });
    } catch (dbErr) {
      // Roll back the client-uploaded blobs so storage doesn't leak.
      await deleteBlob(pdfBlob.pathname).catch(() => undefined);
      if (videoBlob) {
        await deleteBlob(videoBlob.pathname).catch(() => undefined);
      }
      throw dbErr;
    }

    // QuickTime / M4V only play in Safari. Transcode to H.264 MP4 so the
    // share page works in Chrome and Android browsers. If transcode fails
    // (e.g. function timeout on a long video), the original .mov stays in
    // place — the Download button still works, the family just gets a
    // browser-compat warning instead of inline playback.
    let finalVideo = videoBlob
      ? {
          sizeBytes: videoBlob.sizeBytes,
          mimeType: videoBlob.contentType,
        }
      : null;
    if (
      videoBlob &&
      (videoBlob.contentType === "video/quicktime" ||
        videoBlob.contentType === "video/x-m4v")
    ) {
      try {
        const transcoded = await transcodeVideoToMp4(
          videoBlob.url,
          assignment.assigneeId,
        );
        await prisma.shareableDirective.update({
          where: { id: directive.id },
          data: {
            videoBlobUrl: transcoded.url,
            videoBlobPathname: transcoded.pathname,
            videoMimeType: transcoded.contentType,
            videoSizeBytes: transcoded.sizeBytes,
          },
        });
        await deleteBlob(videoBlob.pathname).catch(() => undefined);
        finalVideo = {
          sizeBytes: transcoded.sizeBytes,
          mimeType: transcoded.contentType,
        };
      } catch (transcodeErr) {
        console.error(
          "⚠️ Video transcode failed; keeping original .mov:",
          transcodeErr,
        );
      }
    }

    await prisma.templateAssignment.update({
      where: { id: assignment.id },
      data: {
        status: "finalized",
        finalizedAt: new Date(),
      },
    });

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || `https://${brandConfig.domain}`;
    const shareUrl = `${appUrl}/share/${directive.token}`;

    return NextResponse.json(
      {
        token: directive.token,
        shareUrl,
        qrPayload: shareUrl,
        pdf: { sizeBytes: pdfBlob.sizeBytes },
        video: finalVideo,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("❌ /api/shareable-directives/finalize error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
        limits: {
          maxPdfBytes: BlobConstants.MAX_PDF_BYTES,
          maxVideoBytes: BlobConstants.MAX_VIDEO_BYTES,
          acceptedVideoMimeTypes: BlobConstants.ACCEPTED_VIDEO_MIME_TYPES,
        },
      },
      { status: 500 },
    );
  }
}
