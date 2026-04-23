"use client";

import { useState } from "react";
import { toast } from "sonner";
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

const MAX_PDF_BYTES = 25 * 1024 * 1024; // mirrors lib/storage/blob.service.ts
const MAX_VIDEO_BYTES = 300 * 1024 * 1024;
const ACCEPTED_VIDEO_EXTENSIONS = ["mov", "mp4", "m4v"];

export interface FinalizeSuccessResult {
  token: string;
  shareUrl: string;
}

interface FinalizeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateAssignmentId: string;
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

export function FinalizeDialog({
  open,
  onOpenChange,
  templateAssignmentId,
  assigneeLabel,
  onSuccess,
}: FinalizeDialogProps) {
  const [pdf, setPdf] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setPdf(null);
    setVideo(null);
    setSubmitting(false);
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
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("templateAssignmentId", templateAssignmentId);
      formData.append("pdf", pdf);
      if (video) formData.append("video", video);

      const res = await fetch("/api/shareable-directives/finalize", {
        method: "POST",
        body: formData,
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 503 && json.code === "blob_not_configured") {
          toast.error(
            "Upload service is not yet configured. Please contact support.",
          );
        } else {
          toast.error(json.error || `Upload failed (HTTP ${res.status})`);
        }
        setSubmitting(false);
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
      setSubmitting(false);
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
                Uploading…
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
