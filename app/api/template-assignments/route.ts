import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server-auth";
import { z } from "zod";
import { UserRole } from "@/lib/auth/roles";
import { TemplateAssignmentRepository } from "@/lib/db/repositories/template-assignment.repository";
import { UserRepository } from "@/lib/db/repositories/user.repository";
import { ResourceRepository } from "@/lib/db/repositories/resource.repository";
import { NotificationRepository } from "@/lib/db/repositories/notification.repository";
import { NotificationType } from "@/lib/types";
import { prisma } from "@/lib/db/prisma";
import { initializeEmailService } from "@/lib/email";
import brandConfig from "@/brand.config";

const templateAssignmentRepository = new TemplateAssignmentRepository();
const userRepository = new UserRepository();
const resourceRepository = new ResourceRepository(prisma);
const notificationRepository = new NotificationRepository();

const assignSchema = z.object({
  resourceId: z.string().min(1, "Resource ID is required"),
  memberIds: z.array(z.string()).min(1, "At least one member must be selected"),
  notes: z.string().optional(),
});

/**
 * POST /api/template-assignments
 * Create template assignments for members
 */
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await userRepository.getUserByClerkId(clerkUserId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only ADMIN and VOLUNTEER can assign templates
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.VOLUNTEER) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = assignSchema.parse(body);

    // Get resource for notification
    const resource = await resourceRepository.findById(
      validatedData.resourceId,
      user.id,
      user.role
    );
    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    // Create assignments
    // Cast is needed because TypeScript narrows user.role to string literals after the check above
    const results = await templateAssignmentRepository.createAssignments(
      {
        resourceId: validatedData.resourceId,
        assigneeIds: validatedData.memberIds,
        assignedBy: user.id,
        notes: validatedData.notes,
      },
      user.role as UserRole
    );

    // Send notifications to successfully assigned members
    if (results.assigned > 0) {
      const assignerName =
        `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;

      // Get the member IDs that were successfully assigned
      const successfulAssignments = await templateAssignmentRepository.filter({
        resourceId: validatedData.resourceId,
        assignedBy: user.id,
      });

      const recentlyAssignedIds = successfulAssignments
        .filter((a) => {
          // Only include assignments created in the last minute (recent)
          const oneMinuteAgo = new Date(Date.now() - 60000);
          return a.assignedAt > oneMinuteAgo;
        })
        .map((a) => a.assigneeId);

      // Create in-app notifications + send email for each assigned member.
      // Direct email send bypasses the templated notification pipeline, which
      // silently drops sends for members without a NotificationPreferences row.
      const emailService = await initializeEmailService();
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL || `https://${brandConfig.domain}`;
      // Deep-link directly into the form so members land where they left off.
      // The form auto-saves, so the link works as both "start" and "resume".
      const resourceUrl = `${appUrl}/member/resources/${resource.id}/complete`;

      for (const memberId of recentlyAssignedIds) {
        try {
          await notificationRepository.createNotification({
            userId: memberId,
            type: NotificationType.CARE_UPDATE,
            title: "New form to complete",
            message: `${assignerName} shared "${resource.title}" with you.`,
            data: {
              resourceId: resource.id,
              resourceTitle: resource.title,
              assignedBy: user.id,
              assignedByName: assignerName,
              activityType: "template_assignment",
            },
            isActionable: true,
            actionUrl: `/member/resources/${resource.id}`,
          });
        } catch (notificationError) {
          console.error(
            `Failed to create notification for user ${memberId}:`,
            notificationError
          );
        }

        try {
          const member = await userRepository.getUserById(memberId);
          if (!member?.email) continue;

          const recipientName =
            `${member.firstName || ""} ${member.lastName || ""}`.trim() ||
            member.email;

          await emailService.sendEmail({
            to: member.email,
            subject: `${assignerName} shared "${resource.title}" with you`,
            html: buildAssignmentEmailHtml({
              recipientName,
              assignerName,
              resourceTitle: resource.title,
              resourceDescription: resource.description || undefined,
              resourceUrl,
            }),
            text: buildAssignmentEmailText({
              recipientName,
              assignerName,
              resourceTitle: resource.title,
              resourceDescription: resource.description || undefined,
              resourceUrl,
            }),
            tags: ["template_assignment"],
          });
        } catch (emailError) {
          console.error(
            `Failed to send assignment email to user ${memberId}:`,
            emailError
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Error creating template assignments:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create template assignments" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/template-assignments
 * Get template assignments with optional filters
 * - ?resourceId=xxx - Get all assignments for a resource (Admin/Volunteer)
 * - ?userId=xxx - Get assignments for a specific user
 * - ?status=pending|started|completed - Filter by status
 * - No params - Get current user's pending assignments
 */
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await userRepository.getUserByClerkId(clerkUserId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get("resourceId");
    const userId = searchParams.get("userId");
    const status = searchParams.get("status") as
      | "pending"
      | "started"
      | "completed"
      | "finalized"
      | null;
    const scope = searchParams.get("scope"); // "all" — admin-wide list

    // Admin-wide status filter: ?scope=all&status=completed returns every
    // assignment matching the status across all members. Powers the admin
    // Finalize dashboard. ADMIN only.
    if (scope === "all") {
      if (user.role !== UserRole.ADMIN) {
        return NextResponse.json(
          { error: "Insufficient permissions" },
          { status: 403 }
        );
      }

      const assignments = await templateAssignmentRepository.filter({
        ...(status && { status }),
      });
      return NextResponse.json({
        success: true,
        assignments,
      });
    }

    // If resourceId is provided, return assignments for that resource
    if (resourceId) {
      // Only Admin and Volunteer can view assignments for a resource
      if (user.role !== UserRole.ADMIN && user.role !== UserRole.VOLUNTEER) {
        return NextResponse.json(
          { error: "Insufficient permissions" },
          { status: 403 }
        );
      }

      const assignments =
        await templateAssignmentRepository.getAssignmentsForResource(resourceId);
      return NextResponse.json({
        success: true,
        assignments,
      });
    }

    // If userId is provided, check permissions and return that user's assignments
    if (userId) {
      // Users can only view their own assignments unless they're Admin/Volunteer
      if (
        userId !== user.id &&
        user.role !== UserRole.ADMIN &&
        user.role !== UserRole.VOLUNTEER
      ) {
        return NextResponse.json(
          { error: "Insufficient permissions" },
          { status: 403 }
        );
      }

      const assignments = await templateAssignmentRepository.getAssignmentsForUser(
        userId,
        status || undefined
      );
      return NextResponse.json({
        success: true,
        assignments,
      });
    }

    // Default: return current user's assignments
    const assignments = await templateAssignmentRepository.getAssignmentsForUser(
      user.id,
      status || undefined
    );

    return NextResponse.json({
      success: true,
      assignments,
    });
  } catch (error) {
    console.error("Error fetching template assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch template assignments" },
      { status: 500 }
    );
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface AssignmentEmailFields {
  recipientName: string;
  assignerName: string;
  resourceTitle: string;
  resourceDescription?: string;
  resourceUrl: string;
}

function buildAssignmentEmailHtml(f: AssignmentEmailFields): string {
  const safeRecipient = escapeHtml(f.recipientName);
  const safeAssigner = escapeHtml(f.assignerName);
  const safeTitle = escapeHtml(f.resourceTitle);
  const safeDescription = f.resourceDescription
    ? `<p style="margin:0 0 16px 0;color:#334155;">${escapeHtml(
        f.resourceDescription,
      )}</p>`
    : "";
  const safeUrl = escapeHtml(f.resourceUrl);
  const brandName = escapeHtml((brandConfig.name || "Living & Leaving"));

  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#0f172a;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;">
      <h1 style="margin:0 0 16px 0;font-size:20px;">Hi ${safeRecipient},</h1>
      <p style="margin:0 0 16px 0;line-height:1.55;">
        ${safeAssigner} shared <strong>${safeTitle}</strong> with you on ${brandName}.
      </p>
      ${safeDescription}
      <p style="margin:24px 0;">
        <a href="${safeUrl}" style="display:inline-block;padding:12px 20px;border-radius:8px;background:#6B21A8;color:#ffffff;text-decoration:none;font-weight:600;">Open the form &amp; pick up where you left off</a>
      </p>
      <p style="margin:0;color:#64748b;font-size:13px;line-height:1.5;">
        You can save your progress and return anytime — nothing has to be completed in one sitting.
      </p>
    </div>
    <p style="max-width:560px;margin:16px auto 0 auto;color:#94a3b8;font-size:12px;text-align:center;">
      Sent by ${brandName}.
    </p>
  </body>
</html>`;
}

function buildAssignmentEmailText(f: AssignmentEmailFields): string {
  const lines = [
    `Hi ${f.recipientName},`,
    "",
    `${f.assignerName} shared "${f.resourceTitle}" with you on ${(brandConfig.name || "Living & Leaving")}.`,
  ];
  if (f.resourceDescription) {
    lines.push("", f.resourceDescription);
  }
  lines.push(
    "",
    `Open the form and pick up where you left off: ${f.resourceUrl}`,
    "",
    "You can save your progress and return anytime — nothing has to be completed in one sitting.",
    "",
    `— ${(brandConfig.name || "Living & Leaving")}`,
  );
  return lines.join("\n");
}
