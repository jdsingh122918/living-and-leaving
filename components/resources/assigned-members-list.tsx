"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, FileText, User, Loader2 } from "lucide-react";

interface AssignmentAssignee {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  family?: { id: string; name: string } | null;
}

interface Assignment {
  id: string;
  status: "pending" | "started" | "completed" | string;
  assignedAt: string;
  completedAt: string | null;
  assignee: AssignmentAssignee;
}

interface AssignedMembersListProps {
  resourceId: string;
  userRole: string; // "ADMIN" | "VOLUNTEER"
}

function displayName(a: AssignmentAssignee): string {
  const name = `${a.firstName || ""} ${a.lastName || ""}`.trim();
  return name || a.email;
}

function statusLabel(status: string): string {
  if (status === "completed") return "Completed";
  if (status === "started") return "In Progress";
  if (status === "pending") return "Not Started";
  return status;
}

export function AssignedMembersList({
  resourceId,
  userRole,
}: AssignedMembersListProps) {
  const [assignments, setAssignments] = useState<Assignment[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/template-assignments?resourceId=${encodeURIComponent(resourceId)}`,
        );
        if (!res.ok) throw new Error(`Failed to load (${res.status})`);
        const data = await res.json();
        if (!cancelled) {
          setAssignments(data.assignments || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [resourceId]);

  const basePath = `/${userRole.toLowerCase()}/resources/${resourceId}/complete`;

  return (
    <Card className="p-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          Shared with
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading assignments...
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {!loading && !error && assignments && assignments.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No one has been shared this form yet. Click{" "}
            <span className="font-medium text-foreground">Share</span> or{" "}
            <span className="font-medium text-foreground">Fill Out for Member</span>{" "}
            above to get started.
          </p>
        )}

        {!loading && !error && assignments && assignments.length > 0 && (
          <ul className="divide-y">
            {assignments.map((a) => {
              const name = displayName(a.assignee);
              const label = statusLabel(a.status);
              const completed = a.status === "completed";
              const inProgress = a.status === "started";
              const href = `${basePath}?memberId=${a.assignee.id}`;

              return (
                <li
                  key={a.id}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{name}</span>
                      <Badge
                        variant={completed ? "default" : inProgress ? "secondary" : "outline"}
                        className="text-xs flex items-center gap-1"
                      >
                        {completed ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : inProgress ? (
                          <Clock className="h-3 w-3" />
                        ) : null}
                        {label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {a.assignee.email}
                      {a.assignee.family?.name ? ` • ${a.assignee.family.name}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={href}>
                      <Button variant={completed ? "outline" : "default"} size="sm" className="min-h-[40px]">
                        <FileText className="h-4 w-4 mr-2" />
                        {completed ? "View / Edit" : inProgress ? "Continue" : "Start"}
                      </Button>
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
