import { del, head } from "@vercel/blob";
import { randomUUID } from "crypto";

const ACCEPTED_VIDEO_MIME_TYPES = new Set([
  "video/quicktime", // .mov
  "video/mp4",
  "video/x-m4v",
]);

const ACCEPTED_VIDEO_EXTENSIONS = new Set(["mov", "mp4", "m4v"]);

const MAX_VIDEO_BYTES = 300 * 1024 * 1024; // 300 MB
const MAX_PDF_BYTES = 25 * 1024 * 1024;    // 25 MB — generous for signed HCDs

const PDF_PATH_PREFIX = "shareable";

export type ShareableUploadKind = "pdf" | "video";

function pickExtension(filename: string): string {
  const idx = filename.lastIndexOf(".");
  return idx >= 0 ? filename.slice(idx + 1).toLowerCase() : "";
}

export function isAcceptedVideoExtension(ext: string): boolean {
  return ACCEPTED_VIDEO_EXTENSIONS.has(ext.toLowerCase());
}

export function isAcceptedVideoMimeType(mimeType: string): boolean {
  return ACCEPTED_VIDEO_MIME_TYPES.has(mimeType);
}

/**
 * Server-controlled blob pathname. Both the upload-handler (when generating
 * presigned tokens) and the finalize route (when validating returned URLs)
 * must agree on this shape so a client cannot upload to an arbitrary path.
 */
export function buildShareablePathname(
  ownerUserId: string,
  kind: ShareableUploadKind,
  originalFilename: string,
): string {
  const ext = pickExtension(originalFilename);
  if (kind === "pdf") {
    if (ext && ext !== "pdf") {
      throw new Error(`Expected .pdf, got .${ext}`);
    }
    return `${PDF_PATH_PREFIX}/${ownerUserId}/${randomUUID()}.pdf`;
  }
  if (!isAcceptedVideoExtension(ext)) {
    throw new Error(
      `Unsupported video extension: .${ext}. Accepted: .mov, .mp4, .m4v`,
    );
  }
  return `${PDF_PATH_PREFIX}/${ownerUserId}/${randomUUID()}.${ext}`;
}

/**
 * Confirms a returned blob pathname matches the server-controlled shape for
 * the given assignee. Used by the finalize route to reject any URL the client
 * might have substituted.
 */
export function isPathnameOwnedBy(
  pathname: string,
  ownerUserId: string,
): boolean {
  return pathname.startsWith(`${PDF_PATH_PREFIX}/${ownerUserId}/`);
}

export async function deleteBlob(pathname: string): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not set");
  }
  await del(pathname);
}

export async function blobHead(pathname: string) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not set");
  }
  return head(pathname);
}

export const BlobConstants = {
  MAX_VIDEO_BYTES,
  MAX_PDF_BYTES,
  ACCEPTED_VIDEO_MIME_TYPES: Array.from(ACCEPTED_VIDEO_MIME_TYPES),
  ACCEPTED_VIDEO_EXTENSIONS: Array.from(ACCEPTED_VIDEO_EXTENSIONS),
  PDF_MIME_TYPE: "application/pdf",
} as const;
