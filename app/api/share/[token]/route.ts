import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { shareableDirectiveRepository } from "@/lib/db/repositories/shareable-directive.repository";
import { isValidShareTokenFormat } from "@/lib/share/token";

export const runtime = "nodejs";

// Public resolver — no auth. Returns artifact metadata for a valid,
// non-revoked share token. Records an audit entry on every access.
//
// 404: token not found
// 410: token found but revoked
// 200: { ownerName, pdfUrl, videoUrl?, videoMimeType?, scannedAt }
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await context.params;

    if (!isValidShareTokenFormat(token)) {
      return NextResponse.json(
        { error: "Invalid share link" },
        { status: 404 },
      );
    }

    const directive = await shareableDirectiveRepository.findByTokenWithOwner(
      token,
    );

    if (!directive) {
      return NextResponse.json(
        { error: "Invalid share link" },
        { status: 404 },
      );
    }

    if (directive.isRevoked) {
      return NextResponse.json(
        {
          error: "This share link has been revoked by the owner",
          revokedAt: directive.revokedAt,
        },
        { status: 410 },
      );
    }

    // Audit entry — non-blocking w.r.t. response body, but we await so that
    // callers can rely on "every 200 produced a log row".
    const ipHash = hashRequestIp(request);
    const userAgent = request.headers.get("user-agent") ?? null;
    const countryCode =
      request.headers.get("x-vercel-ip-country") ??
      request.headers.get("cf-ipcountry") ??
      null;

    await shareableDirectiveRepository.recordAccess({
      shareableDirectiveId: directive.id,
      ipHash,
      userAgent,
      countryCode,
    });

    // TODO: Fire notification to owner (+ proxy) on access. Wire up once
    // /api/share/[token] is called from the public landing page.

    const ownerName = buildOwnerName(directive.owner);

    return NextResponse.json({
      ownerName,
      pdfUrl: directive.pdfBlobUrl,
      videoUrl: directive.videoBlobUrl,
      videoMimeType: directive.videoMimeType,
      hasVideo: Boolean(directive.videoBlobUrl),
      scannedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ /api/share/[token] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

function hashRequestIp(request: NextRequest): string | null {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    null;
  if (!ip) return null;

  const salt = process.env.SHARE_IP_SALT || "living-and-leaving-share-v1";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

function buildOwnerName(owner: {
  firstName: string | null;
  lastName: string | null;
  email: string;
}): string {
  const full = [owner.firstName, owner.lastName].filter(Boolean).join(" ");
  return full || owner.email;
}
