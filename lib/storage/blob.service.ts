import { put, del, head } from "@vercel/blob";
import { randomUUID } from "crypto";

const ACCEPTED_VIDEO_MIME_TYPES = new Set([
  "video/quicktime", // .mov
  "video/mp4",
  "video/x-m4v",
]);

const ACCEPTED_VIDEO_EXTENSIONS = new Set(["mov", "mp4", "m4v"]);

const MAX_VIDEO_BYTES = 300 * 1024 * 1024; // 300 MB
const MAX_PDF_BYTES = 25 * 1024 * 1024;    // 25 MB — generous for signed HCDs

export interface UploadResult {
  url: string;
  pathname: string;
  contentType: string;
  sizeBytes: number;
}

function requireBlobToken(): void {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN is not set. Configure Vercel Blob in the project environment.",
    );
  }
}

function pickExtension(filename: string): string {
  const idx = filename.lastIndexOf(".");
  return idx >= 0 ? filename.slice(idx + 1).toLowerCase() : "";
}

export async function uploadSignedPdf(
  body: Buffer,
  ownerUserId: string,
  originalFilename: string,
): Promise<UploadResult> {
  requireBlobToken();

  if (body.byteLength > MAX_PDF_BYTES) {
    throw new Error(
      `PDF too large: ${body.byteLength} bytes (max ${MAX_PDF_BYTES})`,
    );
  }

  const ext = pickExtension(originalFilename) || "pdf";
  if (ext !== "pdf") {
    throw new Error(`Expected .pdf, got .${ext}`);
  }

  // Randomized pathname — never guessable from owner ID alone.
  const pathname = `shareable/${ownerUserId}/${randomUUID()}.pdf`;

  const { url, contentType } = await put(pathname, body, {
    access: "public",
    contentType: "application/pdf",
    addRandomSuffix: false,
    cacheControlMaxAge: 60, // Short cache — revocation should propagate quickly
  });

  return {
    url,
    pathname,
    contentType: contentType ?? "application/pdf",
    sizeBytes: body.byteLength,
  };
}

export async function uploadVideo(
  body: Buffer,
  ownerUserId: string,
  originalFilename: string,
  mimeType: string,
): Promise<UploadResult> {
  requireBlobToken();

  if (body.byteLength > MAX_VIDEO_BYTES) {
    throw new Error(
      `Video too large: ${body.byteLength} bytes (max ${MAX_VIDEO_BYTES})`,
    );
  }

  const ext = pickExtension(originalFilename);
  if (!ACCEPTED_VIDEO_EXTENSIONS.has(ext)) {
    throw new Error(
      `Unsupported video extension: .${ext}. Accepted: .mov, .mp4, .m4v`,
    );
  }

  if (!ACCEPTED_VIDEO_MIME_TYPES.has(mimeType)) {
    throw new Error(
      `Unsupported video MIME type: ${mimeType}. Accepted: video/quicktime, video/mp4, video/x-m4v`,
    );
  }

  const pathname = `shareable/${ownerUserId}/${randomUUID()}.${ext}`;

  const { url, contentType } = await put(pathname, body, {
    access: "public",
    contentType: mimeType,
    addRandomSuffix: false,
    cacheControlMaxAge: 60,
  });

  return {
    url,
    pathname,
    contentType: contentType ?? mimeType,
    sizeBytes: body.byteLength,
  };
}

export async function deleteBlob(pathname: string): Promise<void> {
  requireBlobToken();
  await del(pathname);
}

export async function blobHead(pathname: string) {
  requireBlobToken();
  return head(pathname);
}

export const BlobConstants = {
  MAX_VIDEO_BYTES,
  MAX_PDF_BYTES,
  ACCEPTED_VIDEO_MIME_TYPES: Array.from(ACCEPTED_VIDEO_MIME_TYPES),
  ACCEPTED_VIDEO_EXTENSIONS: Array.from(ACCEPTED_VIDEO_EXTENSIONS),
} as const;
