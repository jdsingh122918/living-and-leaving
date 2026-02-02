import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server-auth";
import { UserRepository } from "@/lib/db/repositories/user.repository";
import { ConversationRepository } from "@/lib/db/repositories/conversation.repository";
import { ResourceRepository } from "@/lib/db/repositories/resource.repository";
import { NotificationRepository } from "@/lib/db/repositories/notification.repository";
import { TemplateAssignmentRepository } from "@/lib/db/repositories/template-assignment.repository";
import { prisma } from "@/lib/db/prisma";

const userRepository = new UserRepository();
const conversationRepository = new ConversationRepository();
const resourceRepository = new ResourceRepository(prisma);
const notificationRepository = new NotificationRepository();
const templateAssignmentRepository = new TemplateAssignmentRepository();

/**
 * GET /api/dashboards/member - Get all member dashboard data in single request
 *
 * This composite endpoint replaces multiple API calls:
 * - User info with family
 * - Family members
 * - Conversations count
 * - Unread notifications count
 * - User's resources
 * - Template assignments
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await userRepository.getUserByClerkId(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("📊 GET /api/dashboards/member - User:", {
      role: user.role,
      email: user.email,
    });

    // Fetch all dashboard data in parallel
    const [
      familyMembersResult,
      conversationsResult,
      notificationsResult,
      resourcesResult,
      assignmentsResult,
    ] = await Promise.allSettled([
      // Get family members if user has a family
      user.familyId
        ? userRepository.getAllUsers({ familyId: user.familyId })
        : Promise.resolve([]),

      // Get conversations count
      conversationRepository.getConversationsForUser(user.id),

      // Get unread notifications count
      notificationRepository.getUnreadCount(user.id),

      // Get user's resources
      resourceRepository.filter(
        { createdBy: user.id, page: 1, limit: 5 },
        user.id,
        user.role
      ),

      // Get template assignments
      templateAssignmentRepository.getAssignmentsForUser(user.id),
    ]);

    // Process family members
    const familyMembers =
      familyMembersResult.status === "fulfilled"
        ? familyMembersResult.value.map((m) => ({
            id: m.id,
            firstName: m.firstName,
            lastName: m.lastName,
            email: m.email,
            role: m.role,
            familyRole: m.familyRole,
          }))
        : [];

    // Process template assignments
    const templateAssignments =
      assignmentsResult.status === "fulfilled"
        ? assignmentsResult.value.map((a) => ({
            id: a.id,
            status: a.status,
            resourceId: a.resourceId,
            resourceTitle: a.resource?.title || "Untitled Template",
            startedAt: a.startedAt,
            completedAt: a.completedAt,
            assignedAt: a.assignedAt,
          }))
        : [];

    const pendingTemplatesCount = templateAssignments.filter(
      (a) => a.status === "pending" || a.status === "started"
    ).length;

    // Build stats
    const stats = {
      conversations:
        conversationsResult.status === "fulfilled"
          ? conversationsResult.value.total
          : 0,
      unreadNotifications:
        notificationsResult.status === "fulfilled"
          ? notificationsResult.value
          : 0,
      content:
        resourcesResult.status === "fulfilled"
          ? resourcesResult.value.total
          : 0,
      pendingTemplates: pendingTemplatesCount,
    };

    // Process recent resources
    const recentResources =
      resourcesResult.status === "fulfilled"
        ? resourcesResult.value.resources.map((r: { id: string; title: string; resourceType: string; createdAt: Date }) => ({
            id: r.id,
            title: r.title,
            resourceType: r.resourceType,
            createdAt: r.createdAt,
          }))
        : [];

    console.log("✅ Member dashboard data retrieved:", {
      familyMembersCount: familyMembers.length,
      stats,
      recentResourcesCount: recentResources.length,
      templateAssignmentsCount: templateAssignments.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          name: user.firstName
            ? `${user.firstName} ${user.lastName || ""}`.trim()
            : user.email,
          role: user.role,
          familyRole: user.familyRole,
        },
        family: user.family
          ? {
              id: user.family.id,
              name: user.family.name,
              description: user.family.description,
            }
          : null,
        familyMembers,
        stats,
        recentResources,
        templateAssignments,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching member dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
