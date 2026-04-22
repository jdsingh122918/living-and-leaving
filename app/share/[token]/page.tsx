import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { createHash } from "crypto";
import { shareableDirectiveRepository } from "@/lib/db/repositories/shareable-directive.repository";
import { isValidShareTokenFormat } from "@/lib/share/token";
import { SharePageClient } from "./share-page-client";
import { RevokedShareState } from "./revoked-share-state";
import brandConfig from "@/brand.config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // Never cache — every scan is a fresh audit entry

interface SharePageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: SharePageProps) {
  const { token } = await params;
  return {
    title: `Shared Directive — ${brandConfig.name ?? "Living & Leaving"}`,
    description: "A healthcare directive shared via QR code.",
    robots: { index: false, follow: false }, // Do not index share URLs
    // token not exposed in metadata
    other: { "x-share-token-length": String(token.length) },
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;

  if (!isValidShareTokenFormat(token)) {
    notFound();
  }

  const directive = await shareableDirectiveRepository.findByTokenWithOwner(
    token,
  );

  if (!directive) {
    notFound();
  }

  // Capture request context for the audit entry.
  const hdrs = await headers();
  const ipHeader = hdrs.get("x-forwarded-for");
  const ip = ipHeader ? ipHeader.split(",")[0].trim() : hdrs.get("x-real-ip");
  const userAgent = hdrs.get("user-agent");
  const countryCode =
    hdrs.get("x-vercel-ip-country") ?? hdrs.get("cf-ipcountry") ?? null;

  const ipHash = ip
    ? createHash("sha256")
        .update(`${process.env.SHARE_IP_SALT || "living-and-leaving-share-v1"}:${ip}`)
        .digest("hex")
    : null;

  if (directive.isRevoked) {
    // Log the attempt for the owner's audit trail, but with a flag so we know
    // it was a post-revocation hit rather than active use.
    await shareableDirectiveRepository
      .recordAccess({
        shareableDirectiveId: directive.id,
        ipHash,
        userAgent,
        countryCode,
      })
      .catch((err) => console.error("share log failed:", err));

    return <RevokedShareState revokedAt={directive.revokedAt} />;
  }

  await shareableDirectiveRepository
    .recordAccess({
      shareableDirectiveId: directive.id,
      ipHash,
      userAgent,
      countryCode,
    })
    .catch((err) => console.error("share log failed:", err));

  const ownerName = buildOwnerName(directive.owner);

  return (
    <SharePageClient
      ownerName={ownerName}
      pdfUrl={directive.pdfBlobUrl}
      videoUrl={directive.videoBlobUrl}
      videoMimeType={directive.videoMimeType}
      createdAt={directive.createdAt.toISOString()}
    />
  );
}

function buildOwnerName(owner: {
  firstName: string | null;
  lastName: string | null;
  email: string;
}): string {
  const full = [owner.firstName, owner.lastName].filter(Boolean).join(" ");
  return full || owner.email;
}
