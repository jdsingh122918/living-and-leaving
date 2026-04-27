import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { auth } from "@/lib/auth/server-auth";
import { UserRole as AppUserRole } from "@/lib/auth/roles";
import { UserRepository } from "@/lib/db/repositories/user.repository";
import { prisma } from "@/lib/db/prisma";
import {
  BlobConstants,
  isAcceptedVideoExtension,
} from "@/lib/storage/blob.service";

const userRepository = new UserRepository();

export const runtime = "nodejs";

interface ClientPayload {
  templateAssignmentId: string;
  kind: "pdf" | "video";
}

function parseClientPayload(raw: string | null): ClientPayload {
  if (!raw) {
    throw new Error("clientPayload is required");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("clientPayload must be valid JSON");
  }
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as ClientPayload).templateAssignmentId !== "string" ||
    !((parsed as ClientPayload).kind === "pdf" || (parsed as ClientPayload).kind === "video")
  ) {
    throw new Error("clientPayload must be { templateAssignmentId, kind }");
  }
  return parsed as ClientPayload;
}

function pathnameExtension(pathname: string): string {
  const idx = pathname.lastIndexOf(".");
  return idx >= 0 ? pathname.slice(idx + 1).toLowerCase() : "";
}

export async function POST(request: NextRequest) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Upload service is not configured", code: "blob_not_configured" },
      { status: 503 },
    );
  }

  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayloadRaw) => {
        const { userId } = await auth();
        if (!userId) {
          throw new Error("Unauthorized");
        }
        const actor = await userRepository.getUserByClerkId(userId);
        if (!actor) {
          throw new Error("Actor not found");
        }

        const { templateAssignmentId, kind } = parseClientPayload(clientPayloadRaw);

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
          throw new Error("Template assignment not found");
        }

        const isAssignee = assignment.assigneeId === actor.id;
        const isAdmin = actor.role === AppUserRole.ADMIN;
        if (!isAssignee && !isAdmin) {
          throw new Error("Only the assignee or an admin can upload");
        }

        if (
          assignment.status !== "completed" &&
          assignment.status !== "finalized"
        ) {
          throw new Error(
            `Assignment must be 'completed' before upload (current: ${assignment.status})`,
          );
        }

        if (assignment.shareableDirective) {
          throw new Error("This assignment already has a finalized package");
        }

        // Server-controlled namespace: client may pick the random suffix but
        // never the assignee folder. Prevents cross-account uploads even if a
        // session token is exposed.
        const expectedPrefix = `shareable/${assignment.assigneeId}/`;
        if (!pathname.startsWith(expectedPrefix)) {
          throw new Error(
            `pathname must start with ${expectedPrefix}`,
          );
        }

        const ext = pathnameExtension(pathname);

        if (kind === "pdf") {
          if (ext !== "pdf") {
            throw new Error("PDF upload must use .pdf extension");
          }
          return {
            allowedContentTypes: [BlobConstants.PDF_MIME_TYPE],
            maximumSizeInBytes: BlobConstants.MAX_PDF_BYTES,
            addRandomSuffix: false,
            cacheControlMaxAge: 60,
            tokenPayload: JSON.stringify({
              templateAssignmentId: assignment.id,
              kind,
            }),
          };
        }

        if (!isAcceptedVideoExtension(ext)) {
          throw new Error(
            `Video upload must use one of: .${BlobConstants.ACCEPTED_VIDEO_EXTENSIONS.join(", .")}`,
          );
        }
        return {
          allowedContentTypes: BlobConstants.ACCEPTED_VIDEO_MIME_TYPES.slice(),
          maximumSizeInBytes: BlobConstants.MAX_VIDEO_BYTES,
          addRandomSuffix: false,
          cacheControlMaxAge: 60,
          tokenPayload: JSON.stringify({
            templateAssignmentId: assignment.id,
            kind,
          }),
        };
      },
      onUploadCompleted: async () => {
        // Persistence happens in /api/shareable-directives/finalize once the
        // client confirms both uploads. This callback is fire-and-forget for
        // any future audit hook.
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Upload handler failed";
    const status =
      message === "Unauthorized"
        ? 401
        : message.includes("Only the assignee")
          ? 403
          : message.includes("not found")
            ? 404
            : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
