import { prisma } from "@/lib/db/prisma";
import { generateShareToken } from "@/lib/share/token";
import type { ShareableDirective, ShareAccessLog } from "@prisma/client";

export interface CreateShareableDirectiveInput {
  ownerId: string;
  templateAssignmentId: string;
  pdfBlobUrl: string;
  pdfBlobPathname: string;
  videoBlobUrl?: string | null;
  videoBlobPathname?: string | null;
  videoMimeType?: string | null;
  videoSizeBytes?: number | null;
  videoDurationSeconds?: number | null;
}

export interface RecordAccessInput {
  shareableDirectiveId: string;
  ipHash?: string | null;
  userAgent?: string | null;
  countryCode?: string | null;
}

export class ShareableDirectiveRepository {
  async createForAssignment(
    input: CreateShareableDirectiveInput,
  ): Promise<ShareableDirective> {
    // Collision-safe retry: vanishingly small at 130 bits but cheap to guard.
    for (let attempt = 0; attempt < 3; attempt++) {
      const token = generateShareToken();
      try {
        return await prisma.shareableDirective.create({
          data: {
            token,
            ownerId: input.ownerId,
            templateAssignmentId: input.templateAssignmentId,
            pdfBlobUrl: input.pdfBlobUrl,
            pdfBlobPathname: input.pdfBlobPathname,
            videoBlobUrl: input.videoBlobUrl ?? null,
            videoBlobPathname: input.videoBlobPathname ?? null,
            videoMimeType: input.videoMimeType ?? null,
            videoSizeBytes: input.videoSizeBytes ?? null,
            videoDurationSeconds: input.videoDurationSeconds ?? null,
          },
        });
      } catch (err: unknown) {
        // P2002 = unique constraint. Retry with new token.
        if (
          err &&
          typeof err === "object" &&
          "code" in err &&
          (err as { code?: string }).code === "P2002"
        ) {
          continue;
        }
        throw err;
      }
    }
    throw new Error("Failed to generate unique share token after 3 attempts");
  }

  async findByToken(token: string): Promise<ShareableDirective | null> {
    return prisma.shareableDirective.findUnique({
      where: { token },
    });
  }

  async findByTokenWithOwner(token: string) {
    return prisma.shareableDirective.findUnique({
      where: { token },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            proxyUserId: true,
          },
        },
      },
    });
  }

  async findByTemplateAssignment(
    templateAssignmentId: string,
  ): Promise<ShareableDirective | null> {
    return prisma.shareableDirective.findUnique({
      where: { templateAssignmentId },
    });
  }

  async findByOwner(ownerId: string): Promise<ShareableDirective[]> {
    return prisma.shareableDirective.findMany({
      where: { ownerId },
      orderBy: { createdAt: "desc" },
    });
  }

  async revoke(
    id: string,
    reason?: string,
  ): Promise<ShareableDirective> {
    return prisma.shareableDirective.update({
      where: { id },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: reason ?? null,
      },
    });
  }

  async recordAccess(input: RecordAccessInput): Promise<ShareAccessLog> {
    return prisma.shareAccessLog.create({
      data: {
        shareableDirectiveId: input.shareableDirectiveId,
        ipHash: input.ipHash ?? null,
        userAgent: input.userAgent ?? null,
        countryCode: input.countryCode ?? null,
      },
    });
  }

  async markNotified(logId: string, error?: string): Promise<void> {
    await prisma.shareAccessLog.update({
      where: { id: logId },
      data: {
        wasNotified: !error,
        notificationError: error ?? null,
      },
    });
  }

  async getAccessLogs(
    shareableDirectiveId: string,
    limit = 100,
  ): Promise<ShareAccessLog[]> {
    return prisma.shareAccessLog.findMany({
      where: { shareableDirectiveId },
      orderBy: { scannedAt: "desc" },
      take: limit,
    });
  }
}

export const shareableDirectiveRepository = new ShareableDirectiveRepository();
