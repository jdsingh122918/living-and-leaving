"use client";

import { useState } from "react";
import { toast } from "sonner";
import { upload } from "@vercel/blob/client";
import { Loader2, Upload, FileText, Video as VideoIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

const MAX_PDF_BYTES = 25 * 1024 * 1024; // mirrors lib/storage/blob.service.ts
const MAX_VIDEO_BYTES = 300 * 1024 * 1024;
const ACCEPTED_VIDEO_EXTENSIONS = ["mov", "mp4", "m4v"];
const VIDEO_MIME_BY_EXT: Record<string, string> = {
  mov: "video/quicktime",
  mp4: "video/mp4",
  m4v: "video/x-m4v",
};

const UPLOAD_HANDLER_URL = "/api/shareable-directives/finalize/upload-handler";
const FINALIZE_URL = "/api/shareable-directives/finalize";

export interface FinalizeSuccessResult {
  token: string;
  shareUrl: string;
}

interface FinalizeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateAssignmentId: string;
  /** Owner of the directive being finalized — required for blob path scoping. */
  assigneeId: string;
  /** Name of the person whose HCD is being finalized — shown in the dialog header. */
  assigneeLabel?: string;
  /** Called after a successful finalize. Receives the new share token + URL. */
  onSuccess?: (result: FinalizeSuccessResult) => void;
}

function formatMB(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getExt(filename: string): string {
  const idx = filename.lastIndexOf(".");
  return idx >= 0 ? filename.slice(idx + 1).toLowerCase() : "";
}

function buildPathname(assigneeId: string, ext: string): string {
  return `shareable/${assigneeId}/${crypto.randomUUID()}.${ext}`;
}

type Stage =
  | { kind: "idle" }
  | { kind: "uploading-pdf"; percentage: number }
  | { kind: "uploading-video"; percentage: number }
  | { kind: "finalizing" };

export function FinalizeDialog({
  open,
  onOpenChange,
  templateAssignmentId,
  assigneeId,
  assigneeLabel,
  onSuccess,
}: FinalizeDialogProps) {
  const [pdf, setPdf] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [stage, setStage] = useState<Stage>({ kind: "idle" });

  const submitting = stage.kind !== "idle";

  function reset() {
    setPdf(null);
    setVideo(null);
    setStage({ kind: "idle" });
  }

  function handlePdfPick(file: File | null) {
    if (!file) {
      setPdf(null);
      return;
    }
    if (getExt(file.name) !== "pdf") {
      toast.error("Please select a PDF file.");
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      toast.error(
        `PDF is too large (${formatMB(file.size)}). Max ${formatMB(MAX_PDF_BYTES)}.`,
      );
      return;
    }
    setPdf(file);
  }

  function handleVideoPick(file: File | null) {
    if (!file) {
      setVideo(null);
      return;
    }
    const ext = getExt(file.name);
    if (!ACCEPTED_VIDEO_EXTENSIONS.includes(ext)) {
      toast.error(`Video must be one of: .${ACCEPTED_VIDEO_EXTENSIONS.join(", .")}`);
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      toast.error(
        `Video is too large (${formatMB(file.size)}). Max ${formatMB(MAX_VIDEO_BYTES)}.`,
      );
      return;
    }
    setVideo(file);
  }

  async function handleSubmit() {
    if (!pdf) {
      toast.error("A signed PDF is required.");
      return;
    }

    try {
      // 1) Upload PDF directly to Vercel Blob
      setStage({ kind: "uploading-pdf", percentage: 0 });
      const pdfPathname = buildPathname(assigneeId, "pdf");
      const pdfResult = await upload(pdfPathname, pdf, {
        access: "public",
        handleUploadUrl: UPLOAD_HANDLER_URL,
        contentType: "application/pdf",
        clientPayload: JSON.stringify({ templateAssignmentId, kind: "pdf" }),
        onUploadProgress: ({ percentage }) => {
          setStage({ kind: "uploading-pdf", percentage });
        },
      });

      // 2) Upload video if provided
      let videoPayload: {
        url: string;
        pathname: string;
        contentType: string;
        sizeBytes: number;
      } | null = null;
      if (video) {
        setStage({ kind: "uploading-video", percentage: 0 });
        const ext = getExt(video.name);
        const contentType = VIDEO_MIME_BY_EXT[ext] || video.type;
        const videoPathname = buildPathname(assigneeId, ext);
        const videoResult = await upload(videoPathname, video, {
          access: "public",
          handleUploadUrl: UPLOAD_HANDLER_URL,
          contentType,
          multipart: true,
          clientPayload: JSON.stringify({ templateAssignmentId, kind: "video" }),
          onUploadProgress: ({ percentage }) => {
            setStage({ kind: "uploading-video", percentage });
          },
        });
        videoPayload = {
          url: videoResult.url,
          pathname: videoResult.pathname,
          contentType,
          sizeBytes: video.size,
        };
      }

      // 3) Tell finalize endpoint about the uploaded blobs
      setStage({ kind: "finalizing" });
      const res = await fetch(FINALIZE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateAssignmentId,
          pdfBlob: {
            url: pdfResult.url,
            pathname: pdfResult.pathname,
            contentType: "application/pdf",
            sizeBytes: pdf.size,
          },
          videoBlob: videoPayload,
        }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 503 && json.code === "blob_not_configured") {
          toast.error(
            "Upload service is not yet configured. Please contact support.",
          );
        } else {
          toast.error(json.error || `Finalize failed (HTTP ${res.status})`);
        }
        setStage({ kind: "idle" });
        return;
      }

      toast.success("Finalized. Share link is ready.");
      const result: FinalizeSuccessResult = {
        token: json.token,
        shareUrl: json.shareUrl,
      };
      reset();
      onOpenChange(false);
      onSuccess?.(result);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Upload failed. Please try again.",
      );
      setStage({ kind: "idle" });
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (submitting) return; // Prevent close mid-upload
        if (!nextOpen) reset();
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Finalize &amp; Package</DialogTitle>
          <DialogDescription>
            {assigneeLabel
              ? `Upload the signed healthcare directive for ${assigneeLabel} (and an optional video wish). Once packaged, a shareable QR code becomes available.`
              : "Upload the signed healthcare directive (and an optional video wish). Once packaged, a shareable QR code becomes available."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="finalize-pdf" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Signed PDF <span className="text-destructive">*</span>
            </Label>
            <Input
              id="finalize-pdf"
              type="file"
              accept="application/pdf,.pdf"
              disabled={submitting}
              onChange={(e) => handlePdfPick(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">
              Max {formatMB(MAX_PDF_BYTES)}.
              {pdf && ` Selected: ${pdf.name} (${formatMB(pdf.size)}).`}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="finalize-video" className="flex items-center gap-2">
              <VideoIcon className="h-4 w-4" />
              Video wish <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="finalize-video"
              type="file"
              accept="video/quicktime,video/mp4,video/x-m4v,.mov,.mp4,.m4v"
              disabled={submitting}
              onChange={(e) => handleVideoPick(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">
              .mov, .mp4, or .m4v. Max {formatMB(MAX_VIDEO_BYTES)}, up to 5 minutes.
              {video && ` Selected: ${video.name} (${formatMB(video.size)}).`}
            </p>
          </div>

          {stage.kind === "uploading-pdf" && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Uploading PDF… {Math.round(stage.percentage)}%
              </p>
              <Progress value={stage.percentage} />
            </div>
          )}
          {stage.kind === "uploading-video" && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Uploading video… {Math.round(stage.percentage)}%
              </p>
              <Progress value={stage.percentage} />
            </div>
          )}
          {stage.kind === "finalizing" && (
            <p className="text-sm text-muted-foreground">
              Finalizing package…
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!pdf || submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {stage.kind === "finalizing" ? "Finalizing…" : "Uploading…"}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Finalize
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
