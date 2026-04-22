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
  QrCode,
  ShieldOff,
  Trash2,
  Video,
  FileText,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { ShareableDirectiveQRCard } from "@/components/share/shareable-directive-qr-card";

interface DirectiveSummary {
  id: string;
  token: string;
  createdAt: string;
  isRevoked: boolean;
  revokedAt: string | null;
  hasVideo: boolean;
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

interface MemberSharePageClientProps {
  ownerFirstName: string | null;
  ownerLastName: string | null;
  directives: DirectiveSummary[];
}

export function MemberSharePageClient({
  ownerFirstName,
  ownerLastName,
  directives: initialDirectives,
}: MemberSharePageClientProps) {
  const router = useRouter();
  const [directives, setDirectives] = useState(initialDirectives);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialDirectives.find((d) => !d.isRevoked)?.id ?? initialDirectives[0]?.id ?? null,
  );

  const selected = directives.find((d) => d.id === selectedId) ?? null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Share Links</h1>
        <p className="text-sm text-muted-foreground mt-1">
          One QR code per directive. Permanent by default, revocable at any time.
          Every scan is logged.
        </p>
      </div>

      {directives.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {directives.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {directives.map((d) => (
                <Button
                  key={d.id}
                  variant={d.id === selectedId ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedId(d.id)}
                  className="min-h-[44px]"
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  {new Date(d.createdAt).toLocaleDateString()}
                  {d.isRevoked && (
                    <Badge variant="secondary" className="ml-2">
                      Revoked
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          )}

          {selected && (
            <SelectedDirectivePanel
              directive={selected}
              ownerFirstName={ownerFirstName}
              ownerLastName={ownerLastName}
              onRevoked={(id) => {
                setDirectives((prev) =>
                  prev.map((d) =>
                    d.id === id
                      ? {
                          ...d,
                          isRevoked: true,
                          revokedAt: new Date().toISOString(),
                        }
                      : d,
                  ),
                );
                router.refresh();
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

function SelectedDirectivePanel({
  directive,
  ownerFirstName,
  ownerLastName,
  onRevoked,
}: {
  directive: DirectiveSummary;
  ownerFirstName: string | null;
  ownerLastName: string | null;
  onRevoked: (id: string) => void;
}) {
  const [revoking, setRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const [logs, setLogs] = useState<AccessLog[] | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);

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
        "Revoke this share link? Anyone with the QR or URL will no longer see your directive. This cannot be undone.",
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
      onRevoked(directive.id);
    } catch (err) {
      setRevokeError(
        err instanceof Error ? err.message : "Failed to revoke",
      );
    } finally {
      setRevoking(false);
    }
  }, [directive.id, onRevoked]);

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
            <div className="text-sm text-muted-foreground">
              No scans yet.
            </div>
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
              Permanently disables the QR code and URL. You can&apos;t undo
              this. If you want to share again, an admin will create a new
              directive for you.
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

function EmptyState() {
  return (
    <Card>
      <CardContent className="py-10 text-center">
        <QrCode className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
        <h2 className="font-semibold">No share links yet</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Once your healthcare directive is signed and an admin finalizes it
          with a video, you&apos;ll see your QR code here.
        </p>
      </CardContent>
    </Card>
  );
}
