"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  QrCode,
  Upload,
} from "lucide-react";
import { FinalizeDialog } from "@/components/share/finalize-dialog";

type AssignmentStatus = "pending" | "started" | "completed" | "finalized";

interface ApiAssignment {
  id: string;
  resourceId: string;
  assigneeId: string;
  assignedBy: string;
  assignedAt: string;
  status: AssignmentStatus;
  completedAt?: string;
  finalizedAt?: string;
  resource?: { id: string; title: string };
  assignee?: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  };
  shareableDirective?: { id: string; token: string; isRevoked: boolean };
}

function displayName(u?: ApiAssignment["assignee"]): string {
  if (!u) return "Unknown";
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return name || u.email || "Unknown";
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdvanceDirectivesAdminPage() {
  const [completed, setCompleted] = useState<ApiAssignment[]>([]);
  const [finalized, setFinalized] = useState<ApiAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogAssignment, setDialogAssignment] =
    useState<ApiAssignment | null>(null);

  const loadAssignments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [completedRes, finalizedRes] = await Promise.all([
        fetch("/api/template-assignments?scope=all&status=completed"),
        fetch("/api/template-assignments?scope=all&status=finalized"),
      ]);

      if (!completedRes.ok || !finalizedRes.ok) {
        const errJson = await (completedRes.ok ? finalizedRes : completedRes)
          .json()
          .catch(() => ({}));
        throw new Error(errJson.error || "Failed to load assignments");
      }

      const completedJson = await completedRes.json();
      const finalizedJson = await finalizedRes.json();
      setCompleted(completedJson.assignments || []);
      setFinalized(finalizedJson.assignments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAssignments();
  }, [loadAssignments]);

  const handleFinalizeSuccess = useCallback(() => {
    // Refresh so the just-finalized row moves from Completed → Finalized.
    void loadAssignments();
  }, [loadAssignments]);

  const counts = useMemo(
    () => ({
      completed: completed.length,
      finalized: finalized.length,
    }),
    [completed.length, finalized.length],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Advance Directives</h1>
        <p className="text-muted-foreground mt-2">
          Members who have completed a healthcare directive are waiting for you
          to package their signed PDF (and optional video wish) into a
          shareable QR code.
        </p>
      </div>

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">
                  Couldn&apos;t load assignments
                </p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => void loadAssignments()}
                >
                  Retry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="completed" className="space-y-4">
        <TabsList>
          <TabsTrigger value="completed">
            Ready to Finalize ({counts.completed})
          </TabsTrigger>
          <TabsTrigger value="finalized">
            Finalized ({counts.finalized})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Completed — awaiting finalization
              </CardTitle>
              <CardDescription>
                Members have submitted their directive and it&apos;s ready to be
                packaged with a signed PDF (and optional video).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : completed.length === 0 ? (
                <EmptyState
                  icon={<FileText className="h-8 w-8 text-muted-foreground" />}
                  title="Nothing to finalize yet"
                  body="When a member marks their directive complete, it will show up here."
                />
              ) : (
                <ul className="divide-y divide-border">
                  {completed.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-start justify-between gap-3 py-4 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">
                          {displayName(a.assignee)}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {a.resource?.title || "Unknown template"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Completed {formatDate(a.completedAt)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setDialogAssignment(a)}
                        className="min-h-[40px]"
                      >
                        <Upload className="h-4 w-4" />
                        Finalize &amp; Package
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finalized">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Finalized — QR codes live
              </CardTitle>
              <CardDescription>
                Packaged directives with an active share link.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : finalized.length === 0 ? (
                <EmptyState
                  icon={<QrCode className="h-8 w-8 text-muted-foreground" />}
                  title="None finalized yet"
                  body="Packaged directives with active QR codes will appear here."
                />
              ) : (
                <ul className="divide-y divide-border">
                  {finalized.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-start justify-between gap-3 py-4 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">
                          {displayName(a.assignee)}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {a.resource?.title || "Unknown template"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-muted-foreground">
                            Finalized {formatDate(a.finalizedAt)}
                          </p>
                          {a.shareableDirective?.isRevoked && (
                            <Badge variant="secondary" className="h-5 text-xs">
                              Revoked
                            </Badge>
                          )}
                        </div>
                      </div>
                      {a.shareableDirective?.token && (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="min-h-[40px]"
                        >
                          <Link
                            href={`/share/${a.shareableDirective.token}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                            View share
                          </Link>
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {dialogAssignment && (
        <FinalizeDialog
          open={!!dialogAssignment}
          onOpenChange={(open) => {
            if (!open) setDialogAssignment(null);
          }}
          templateAssignmentId={dialogAssignment.id}
          assigneeLabel={displayName(dialogAssignment.assignee)}
          onSuccess={handleFinalizeSuccess}
        />
      )}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-md border border-dashed border-border p-8 text-center">
      <div className="flex justify-center mb-3">{icon}</div>
      <p className="font-medium text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground mt-1">{body}</p>
    </div>
  );
}
