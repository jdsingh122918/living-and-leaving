import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server-auth";
import { UserRole as AppUserRole } from "@/lib/auth/roles";
import { UserRepository } from "@/lib/db/repositories/user.repository";
import { prisma } from "@/lib/db/prisma";
import { shareableDirectiveRepository } from "@/lib/db/repositories/shareable-directive.repository";
import {
  uploadSignedPdf,
  uploadVideo,
  deleteBlob,
  BlobConstants,
} from "@/lib/storage/blob.service";
import brandConfig from "@/brand.config";

const userRepository = new UserRepository();

export const runtime = "nodejs";
export const maxDuration = 60;

// Accepts multipart/form-data:
//   templateAssignmentId: string
//   pdf: File (application/pdf)
//   video?: File (video/quicktime | video/mp4 | video/x-m4v)
//
// Returns: { token, qrUrl, shareUrl }
export async function POST(request: NextRequest) {
  try {
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

    const formData = await request.formData();
    const templateAssignmentId = formData.get("templateAssignmentId");
    const pdfFile = formData.get("pdf");
    const videoFile = formData.get("video");

    if (typeof templateAssignmentId !== "string" || !templateAssignmentId) {
      return NextResponse.json(
        { error: "templateAssignmentId is required" },
        { status: 400 },
      );
    }
    if (!(pdfFile instanceof File)) {
      return NextResponse.json(
        { error: "pdf file is required" },
        { status: 400 },
      );
    }

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

    // Authorization: assignee, admin, or a volunteer assigned to the
    // assignee's family (acting in a proxy capacity).
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
          error:
            "Assignment must be in 'completed' state before finalizing",
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

    const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());
    const pdfResult = await uploadSignedPdf(
      pdfBuffer,
      assignment.assigneeId,
      pdfFile.name || "signed.pdf",
    );

    let videoResult: Awaited<ReturnType<typeof uploadVideo>> | null = null;
    if (videoFile instanceof File && videoFile.size > 0) {
      try {
        const videoBuffer = Buffer.from(await videoFile.arrayBuffer());
        videoResult = await uploadVideo(
          videoBuffer,
          assignment.assigneeId,
          videoFile.name || "video",
          videoFile.type,
        );
      } catch (videoErr) {
        // Video upload failed — we've already uploaded the PDF. Clean up.
        await deleteBlob(pdfResult.pathname).catch(() => undefined);
        return NextResponse.json(
          {
            error:
              videoErr instanceof Error
                ? videoErr.message
                : "Video upload failed",
          },
          { status: 400 },
        );
      }
    }

    let directive;
    try {
      directive = await shareableDirectiveRepository.createForAssignment({
        ownerId: assignment.assigneeId,
        templateAssignmentId: assignment.id,
        pdfBlobUrl: pdfResult.url,
        pdfBlobPathname: pdfResult.pathname,
        videoBlobUrl: videoResult?.url,
        videoBlobPathname: videoResult?.pathname,
        videoMimeType: videoResult?.contentType,
        videoSizeBytes: videoResult?.sizeBytes,
      });
    } catch (dbErr) {
      // Roll back blob uploads so we don't leak orphaned files.
      await deleteBlob(pdfResult.pathname).catch(() => undefined);
      if (videoResult) {
        await deleteBlob(videoResult.pathname).catch(() => undefined);
      }
      throw dbErr;
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
        pdf: { sizeBytes: pdfResult.sizeBytes },
        video: videoResult
          ? {
              sizeBytes: videoResult.sizeBytes,
              mimeType: videoResult.contentType,
            }
          : null,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("❌ /api/shareable-directives/finalize error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Internal server error",
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
