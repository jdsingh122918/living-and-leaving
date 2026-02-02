import { auth } from '@/lib/auth/server-auth';
import { redirect, notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ResourceRepository } from '@/lib/db/repositories/resource.repository';
import { prisma } from '@/lib/db/prisma';
import { UserRole } from '@/lib/auth/roles';
import { FormCompletionClient } from '@/app/(dashboard)/member/resources/[id]/complete/form-completion-client';

const resourceRepository = new ResourceRepository(prisma);

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ memberId?: string }>;
}

export default async function AdminCompleteForMemberPage({ params, searchParams }: PageProps) {
  const { id: resourceId } = await params;
  const { memberId } = await searchParams;
  const { userId: clerkUserId, sessionClaims } = await auth();

  if (!clerkUserId) {
    redirect('/sign-in');
  }

  // Get admin user from database
  const dbUser = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
    select: { id: true, role: true },
  });

  if (!dbUser) {
    redirect('/sign-in');
  }

  const userRole = (sessionClaims?.metadata as { role?: UserRole })?.role || dbUser.role;

  // Must be ADMIN
  if (userRole !== UserRole.ADMIN) {
    redirect('/unauthorized');
  }

  // memberId is required
  if (!memberId || !/^[0-9a-fA-F]{24}$/.test(memberId)) {
    redirect(`/admin/resources/${resourceId}`);
  }

  // Fetch the member
  const member = await prisma.user.findUnique({
    where: { id: memberId },
    select: { id: true, firstName: true, lastName: true, email: true, role: true },
  });

  if (!member) {
    redirect(`/admin/resources/${resourceId}`);
  }

  // Fetch the resource
  const resource = await resourceRepository.findById(resourceId, dbUser.id, userRole as UserRole);

  if (!resource) {
    notFound();
  }

  // Verify it's a template with a form schema
  const externalMeta = resource.externalMeta as {
    systemGenerated?: boolean;
    formSchema?: { sections: Record<string, any> };
  } | null;

  if (!externalMeta?.formSchema) {
    redirect(`/admin/resources/${resourceId}`);
  }

  // Fetch the MEMBER's existing form response (not the admin's)
  const existingResponse = await resourceRepository.getFormResponse(resourceId, memberId);

  const proxyMemberName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email;

  return (
    <div className="space-y-6 pb-8">
      <Suspense fallback={<FormLoadingSkeleton />}>
        <FormCompletionClient
          resourceId={resourceId}
          resourceTitle={resource.title}
          resourceDescription={resource.description || ''}
          formSchema={externalMeta.formSchema}
          userId={dbUser.id}
          memberName={proxyMemberName}
          existingFormData={existingResponse?.formData as Record<string, any> | undefined}
          proxyMemberId={memberId}
          proxyMemberName={proxyMemberName}
        />
      </Suspense>
    </div>
  );
}

function FormLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-muted rounded w-1/3"></div>
      <div className="h-4 bg-muted rounded w-2/3"></div>
      <div className="space-y-4">
        <div className="h-48 bg-muted rounded"></div>
        <div className="h-48 bg-muted rounded"></div>
      </div>
    </div>
  );
}
