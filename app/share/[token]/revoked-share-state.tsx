import { ShieldOff } from "lucide-react";
import brandConfig from "@/brand.config";

export function RevokedShareState({
  revokedAt,
}: {
  revokedAt: Date | null;
}) {
  const dateLabel = revokedAt
    ? new Date(revokedAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="max-w-md text-center space-y-4">
        <div className="mx-auto w-14 h-14 rounded-full bg-muted flex items-center justify-center">
          <ShieldOff className="h-7 w-7 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-semibold">This share link has been revoked</h1>
        <p className="text-sm text-muted-foreground">
          The owner has turned off access to this directive
          {dateLabel ? ` on ${dateLabel}` : ""}. If you need a current copy,
          please contact them directly.
        </p>
        <p className="text-xs text-muted-foreground pt-4">
          {brandConfig.name ?? "Living & Leaving"}
        </p>
      </div>
    </main>
  );
}
