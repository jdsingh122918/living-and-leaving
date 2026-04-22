"use client";

import { useState } from "react";
import {
  FileText,
  Download,
  ShieldCheck,
  Play,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import brandConfig from "@/brand.config";

interface SharePageClientProps {
  ownerName: string;
  pdfUrl: string;
  videoUrl: string | null;
  videoMimeType: string | null;
  createdAt: string;
}

export function SharePageClient({
  ownerName,
  pdfUrl,
  videoUrl,
  videoMimeType,
  createdAt,
}: SharePageClientProps) {
  const [videoPlaybackError, setVideoPlaybackError] = useState(false);
  const createdLabel = new Date(createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {brandConfig.logos?.light && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={brandConfig.logos.light}
                alt={brandConfig.name ?? "Logo"}
                className="h-8 w-auto"
              />
            )}
            <div className="text-sm font-semibold">
              {brandConfig.name ?? "Living & Leaving"}
            </div>
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Secure share</span>
          </div>
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {ownerName}&apos;s Healthcare Directive
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Finalized {createdLabel}. This record is shared via a QR link owned
            by {ownerName}. Every scan is logged.
          </p>
        </div>

        {videoUrl && !videoPlaybackError && (
          <div className="rounded-lg overflow-hidden bg-black">
            <video
              controls
              playsInline
              preload="metadata"
              className="w-full h-auto max-h-[60vh] bg-black"
              onError={() => setVideoPlaybackError(true)}
            >
              <source
                src={videoUrl}
                type={videoMimeType ?? "video/mp4"}
              />
              Your browser can&apos;t play this video. Use the download button below.
            </video>
          </div>
        )}

        {videoUrl && videoPlaybackError && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 text-amber-900 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">
                This video can&apos;t play in your current browser.
              </p>
              <p className="mt-1">
                Download it and open with any video player.
              </p>
              <a
                href={videoUrl}
                download
                className="inline-flex items-center gap-2 mt-3 underline underline-offset-2 font-medium"
              >
                <Download className="h-4 w-4" />
                Download video
              </a>
            </div>
          </div>
        )}

        {videoUrl && (
          <div className="flex flex-wrap gap-2">
            <a href={videoUrl} download>
              <Button variant="outline" size="sm" className="min-h-[44px]">
                <Download className="h-4 w-4 mr-2" />
                Download video
              </Button>
            </a>
          </div>
        )}

        <div className="rounded-lg border bg-card p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-primary/10 p-2">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold">Signed Healthcare Directive</h2>
              <p className="text-xs text-muted-foreground">
                The signed legal document.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="min-h-[44px]">
                <FileText className="h-4 w-4 mr-2" />
                View PDF
              </Button>
            </a>
            <a href={pdfUrl} download>
              <Button variant="outline" size="sm" className="min-h-[44px]">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </a>
          </div>
        </div>

        {!videoUrl && (
          <div className="rounded-lg border bg-muted/40 p-5 text-sm text-muted-foreground flex items-start gap-3">
            <Play className="h-4 w-4 mt-0.5 shrink-0" />
            <p>
              No accompanying video was included with this directive.
            </p>
          </div>
        )}

        <footer className="pt-6 border-t text-xs text-muted-foreground">
          <p>
            This link is permanent but revocable. If the owner revokes access
            at any time, this page will no longer load the directive.
          </p>
          <p className="mt-2">
            Powered by {brandConfig.name ?? "Living & Leaving"}.
          </p>
        </footer>
      </section>
    </main>
  );
}
