"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  ShieldOff,
  Trash2,
  Video,
  FileText,
  Loader2,
  RefreshCw,
  Wand2,
} from "lucide-react";
import { ShareableDirectiveQRCard } from "@/components/share/shareable-directive-qr-card";

interface DirectiveSummary {
  id: string;
  token: string;
  createdAt: string;
  isRevoked: boolean;
  revokedAt: string | null;
  hasVideo: boolean;
  videoMimeType: string | null;
  scanCount: number;
  lastScannedAt: string | null;
}

interface AccessLog {
  id: string;
  scannedAt: string;
  userAgent: string | null;
  countryCode: string | null;
  wasNotified: boolean;
}

interface AdminDirectiveDetailClientProps {
  directive: DirectiveSummary;
  ownerFirstName: string | null;
  ownerLastName: string | null;
}

export function AdminDirectiveDetailClient({
  directive: initialDirective,
  ownerFirstName,
  ownerLastName,
}: AdminDirectiveDetailClientProps) {
  const router = useRouter();
  const [directive, setDirective] = useState(initialDirective);
  const [revoking, setRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const [logs, setLogs] = useState<AccessLog[] | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [retranscoding, setRetranscoding] = useState(false);
  const [retranscodeError, setRetranscodeError] = useState<string | null>(null);
  const [retranscodeSuccess, setRetranscodeSuccess] = useState(false);

  const needsRetranscode =
    directive.hasVideo &&
    !directive.isRevoked &&
    (directive.videoMimeType === "video/quicktime" ||
      directive.videoMimeType === "video/x-m4v");

  const handleRetranscode = useCallback(async () => {
    setRetranscoding(true);
    setRetranscodeError(null);
    setRetranscodeSuccess(false);
    try {
      const res = await fetch(
        `/api/shareable-directives/${directive.id}/retranscode`,
        { method: "POST" },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Retranscode failed");
      }
      const data = await res.json();
      setDirective((prev) => ({ ...prev, videoMimeType: data.videoMimeType }));
      setRetranscodeSuccess(true);
      router.refresh();
    } catch (err) {
      setRetranscodeError(
        err instanceof Error ? err.message : "Retranscode failed",
      );
    } finally {
      setRetranscoding(false);
    }
  }, [directive.id, router]);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    setLogsError(null);
    try {
      const res = await fetch(
        `/api/shareable-directives/${directive.id}/access-logs`,
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to load scan history");
      }
      const data = await res.json();
      setLogs(data.logs);
    } catch (err) {
      setLogsError(
        err instanceof Error ? err.message : "Failed to load scan history",
      );
    } finally {
      setLogsLoading(false);
    }
  }, [directive.id]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleRevoke = useCallback(async () => {
    if (
      !window.confirm(
        "Revoke this share link? Anyone with the QR or URL will no longer see the directive. This cannot be undone.",
      )
    ) {
      return;
    }

    setRevoking(true);
    setRevokeError(null);
    try {
      const res = await fetch(
        `/api/shareable-directives/${directive.id}/revoke`,
        { method: "POST", headers: { "Content-Type": "application/json" } },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to revoke");
      }
      setDirective((prev) => ({
        ...prev,
        isRevoked: true,
        revokedAt: new Date().toISOString(),
      }));
      router.refresh();
    } catch (err) {
      setRevokeError(err instanceof Error ? err.message : "Failed to revoke");
    } finally {
      setRevoking(false);
    }
  }, [directive.id, router]);

  return (
    <div className="space-y-6">
      {directive.isRevoked ? (
        <Alert>
          <ShieldOff className="h-4 w-4" />
          <AlertDescription>
            This share link was revoked
            {directive.revokedAt
              ? ` on ${new Date(directive.revokedAt).toLocaleDateString()}`
              : ""}
            . It no longer grants access to anyone who scans it.
          </AlertDescription>
        </Alert>
      ) : (
        <ShareableDirectiveQRCard
          token={directive.token}
          ownerFirstName={ownerFirstName}
          ownerLastName={ownerLastName}
        />
      )}

      {needsRetranscode && (
        <Card className="border-amber-500/40 bg-amber-50/40 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-amber-600" />
              Make video playable in Chrome &amp; Android
            </CardTitle>
            <CardDescription>
              This directive&apos;s video is QuickTime ({directive.videoMimeType}),
              which only plays in Safari. Convert to MP4 so the family can watch
              it on any phone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {retranscodeError && (
              <Alert variant="destructive" className="mb-3">
                <AlertDescription>{retranscodeError}</AlertDescription>
              </Alert>
            )}
            {retranscodeSuccess && (
              <Alert className="mb-3">
                <AlertDescription>
                  Video converted. Reload the share link to see it play.
                </AlertDescription>
              </Alert>
            )}
            <Button
              onClick={handleRetranscode}
              disabled={retranscoding}
              className="min-h-[44px]"
            >
              {retranscoding ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4 mr-2" />
              )}
              {retranscoding ? "Converting…" : "Convert to MP4"}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Takes about a minute. The original is replaced once the new
              version is ready.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Details</CardTitle>
          <CardDescription>Summary of this share.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground text-xs">Finalized</div>
            <div className="font-medium">
              {new Date(directive.createdAt).toLocaleDateString()}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Scans</div>
            <div className="font-medium">{directive.scanCount}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Last scanned</div>
            <div className="font-medium">
              {directive.lastScannedAt
                ? new Date(directive.lastScannedAt).toLocaleString()
                : "Never"}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Includes video</div>
            <div className="font-medium flex items-center gap-1.5">
              {directive.hasVideo ? (
                <>
                  <Video className="h-4 w-4" />
                  Yes
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  PDF only
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Scan history</CardTitle>
            <CardDescription>
              Every time this QR or link is opened.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={logsLoading}
            className="min-h-[44px]"
          >
            {logsLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2 sr-only sm:not-sr-only">Refresh</span>
          </Button>
        </CardHeader>
        <CardContent>
          {logsError && (
            <Alert variant="destructive" className="mb-3">
              <AlertDescription>{logsError}</AlertDescription>
            </Alert>
          )}
          {logsLoading && !logs ? (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : logs && logs.length === 0 ? (
            <div className="text-sm text-muted-foreground">No scans yet.</div>
          ) : logs ? (
            <ul className="divide-y">
              {logs.map((log) => (
                <li
                  key={log.id}
                  className="py-2 flex items-start justify-between gap-3 text-sm"
                >
                  <div className="min-w-0">
                    <div className="font-medium">
                      {new Date(log.scannedAt).toLocaleString()}
                    </div>
                    {log.userAgent && (
                      <div className="text-xs text-muted-foreground truncate">
                        {log.userAgent}
                      </div>
                    )}
                  </div>
                  {log.countryCode && (
                    <Badge variant="secondary" className="shrink-0">
                      {log.countryCode}
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>

      {!directive.isRevoked && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-lg text-destructive">
              Revoke this share link
            </CardTitle>
            <CardDescription>
              Permanently disables the QR code and URL. Use this if the family
              needs to invalidate the existing card (lost wallet, change of
              wishes). You can&apos;t undo this — finalize again to issue a new
              QR.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {revokeError && (
              <Alert variant="destructive" className="mb-3">
                <AlertDescription>{revokeError}</AlertDescription>
              </Alert>
            )}
            <Button
              variant="destructive"
              onClick={handleRevoke}
              disabled={revoking}
              className="min-h-[44px]"
            >
              {revoking ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Revoke share link
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
