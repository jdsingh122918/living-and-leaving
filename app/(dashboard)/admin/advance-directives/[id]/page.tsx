import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/server-auth";
import { prisma } from "@/lib/db/prisma";
import { UserRole } from "@/lib/auth/roles";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { AdminDirectiveDetailClient } from "./admin-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminAdvanceDirectiveDetailPage({
  params,
}: PageProps) {
  const { id: assignmentId } = await params;
  const { userId: clerkUserId, sessionClaims } = await auth();

  if (!clerkUserId) {
    redirect("/sign-in");
  }

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
    select: { id: true, role: true },
  });
  if (!dbUser) {
    redirect("/sign-in");
  }

  const userRole = (sessionClaims?.metadata as { role?: UserRole })?.role || dbUser.role;
  if (userRole !== UserRole.ADMIN) {
    redirect("/unauthorized");
  }

  const assignment = await prisma.templateAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      resource: { select: { id: true, title: true } },
      assignee: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      shareableDirective: {
        include: {
          _count: { select: { accessLogs: true } },
          accessLogs: {
            orderBy: { scannedAt: "desc" },
            take: 1,
            select: { scannedAt: true },
          },
        },
      },
    },
  });

  if (!assignment) {
    notFound();
  }

  const directive = assignment.shareableDirective;
  const assigneeName =
    `${assignment.assignee.firstName ?? ""} ${assignment.assignee.lastName ?? ""}`.trim() ||
    assignment.assignee.email;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <Link href="/admin/advance-directives">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Advance Directives
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{assigneeName}</h1>
        <p className="text-sm text-muted-foreground">
          {assignment.resource?.title ?? "Healthcare Directive"}
          {" · "}
          {assignment.assignee.email}
        </p>
      </div>

      {!directive ? (
        <NotYetFinalized />
      ) : (
        <AdminDirectiveDetailClient
          directive={{
            id: directive.id,
            token: directive.token,
            createdAt: directive.createdAt.toISOString(),
            isRevoked: directive.isRevoked,
            revokedAt: directive.revokedAt?.toISOString() ?? null,
            hasVideo: Boolean(directive.videoBlobUrl),
            scanCount: directive._count.accessLogs,
            lastScannedAt:
              directive.accessLogs[0]?.scannedAt.toISOString() ?? null,
          }}
          ownerFirstName={assignment.assignee.firstName}
          ownerLastName={assignment.assignee.lastName}
        />
      )}
    </div>
  );
}

function NotYetFinalized() {
  return (
    <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
      This directive hasn&apos;t been finalized yet. Return to the Advance
      Directives dashboard and click &ldquo;Finalize &amp; Package.&rdquo;
    </div>
  );
}
