import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server-auth";
import { UserRepository } from "@/lib/db/repositories/user.repository";
import { prisma } from "@/lib/db/prisma";
import { MemberSharePageClient } from "./member-share-page-client";

const userRepository = new UserRepository();

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function MemberSharePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const actor = await userRepository.getUserByClerkId(userId);
  if (!actor) redirect("/sign-in");

  const directives = await prisma.shareableDirective.findMany({
    where: { ownerId: actor.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { accessLogs: true } },
      accessLogs: {
        orderBy: { scannedAt: "desc" },
        take: 1,
        select: { scannedAt: true },
      },
    },
  });

  return (
    <MemberSharePageClient
      ownerFirstName={actor.firstName}
      ownerLastName={actor.lastName}
      directives={directives.map((d) => ({
        id: d.id,
        token: d.token,
        createdAt: d.createdAt.toISOString(),
        isRevoked: d.isRevoked,
        revokedAt: d.revokedAt?.toISOString() ?? null,
        hasVideo: Boolean(d.videoBlobUrl),
        scanCount: d._count.accessLogs,
        lastScannedAt: d.accessLogs[0]?.scannedAt.toISOString() ?? null,
      }))}
    />
  );
}
