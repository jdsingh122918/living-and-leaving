"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, RotateCcw, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DeletedUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  family: { id: string; name: string } | null;
  deletedAt: string;
  deletionReason: string | null;
  scheduledPermanentDeletionAt: string | null;
  daysUntilPurge: number | null;
}

function displayName(u: DeletedUser): string {
  const name = `${u.firstName || ""} ${u.lastName || ""}`.trim();
  return name || u.email;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function DeletedUsersPage() {
  const [users, setUsers] = useState<DeletedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/users/deleted");
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const restore = async (user: DeletedUser) => {
    setRestoringId(user.id);
    try {
      const res = await fetch(`/api/users/${user.id}/restore`, {
        method: "POST",
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body?.error || "Failed to restore");
      }
      toast.success(`${displayName(user)} restored.`);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to restore");
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" asChild className="min-h-[44px]">
          <Link href="/admin/users">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Deleted Users</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Deleted users can be restored within 30 days. After that, their
          accounts are permanently removed and their content is transferred to
          a system placeholder.
        </p>
      </div>

      <Card className="border-2 shadow-sm">
        <CardHeader>
          <CardTitle>Recently Removed</CardTitle>
          <CardDescription>
            {loading
              ? "Loading..."
              : `${users.length} ${users.length === 1 ? "user" : "users"} deleted`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-destructive">{error}</p>}

          {!loading && !error && users.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No deleted users.
            </p>
          )}

          {!loading && !error && users.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Family</TableHead>
                  <TableHead>Deleted</TableHead>
                  <TableHead>Purge In</TableHead>
                  <TableHead className="w-[160px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{displayName(u)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {u.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{u.role}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {u.family?.name || "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(u.deletedAt)}
                    </TableCell>
                    <TableCell>
                      {u.daysUntilPurge === null ? (
                        <span className="text-sm text-muted-foreground">—</span>
                      ) : u.daysUntilPurge <= 3 ? (
                        <Badge variant="destructive" className="text-xs flex items-center gap-1">
                          <Trash2 className="h-3 w-3" />
                          {u.daysUntilPurge} {u.daysUntilPurge === 1 ? "day" : "days"}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          {u.daysUntilPurge} days
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => restore(u)}
                        disabled={restoringId === u.id}
                        className="min-h-[40px]"
                      >
                        {restoringId === u.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <RotateCcw className="h-4 w-4 mr-2" />
                        )}
                        Restore
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
