import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server-auth";
import { UserRole } from "@prisma/client";
import { UserRepository } from "@/lib/db/repositories/user.repository";
import { FamilyRepository } from "@/lib/db/repositories/family.repository";
import { ForumRepository } from "@/lib/db/repositories/forum.repository";
import { DocumentRepository } from "@/lib/db/repositories/document.repository";
import { TemplateAssignmentRepository } from "@/lib/db/repositories/template-assignment.repository";

const userRepository = new UserRepository();
const familyRepository = new FamilyRepository();
const forumRepository = new ForumRepository();
const documentRepository = new DocumentRepository();
const templateAssignmentRepository = new TemplateAssignmentRepository();

/**
 * GET /api/dashboards/admin - Get all admin dashboard data in single request
 *
 * This composite endpoint replaces 5+ separate API calls:
 * - User statistics (total, admins, volunteers, members)
 * - Family statistics
 * - Forum statistics
 * - Document statistics
 * - Recent shared resources
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database and verify admin role
    const user = await userRepository.getUserByClerkId(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only admins can access this endpoint
    if (user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    console.log("📊 GET /api/dashboards/admin - User:", {
      role: user.role,
      email: user.email,
    });

    // Fetch all dashboard data in parallel
    const [
      userStatsResult,
      familyStatsResult,
      forumStatsResult,
      documentStatsResult,
      sharedResourcesResult,
    ] = await Promise.allSettled([
      userRepository.getUserStats(),
      familyRepository.getFamilyStats(),
      forumRepository.getForumStats(),
      documentRepository.getDocumentStats(),
      templateAssignmentRepository.getAssignmentsByAssigner(user.id, {
        limit: 5,
      }),
    ]);

    // Process results with fallbacks
    const userStats =
      userStatsResult.status === "fulfilled"
        ? userStatsResult.value
        : { total: 0, admins: 0, volunteers: 0, members: 0 };

    const familyStats =
      familyStatsResult.status === "fulfilled"
        ? familyStatsResult.value
        : { total: 0, totalMembers: 0, averageMembersPerFamily: 0 };

    const forumStats =
      forumStatsResult.status === "fulfilled"
        ? forumStatsResult.value
        : {
            totalForums: 0,
            activeForums: 0,
            totalPosts: 0,
            totalReplies: 0,
            postsThisMonth: 0,
            forumsWithRecentActivity: 0,
          };

    const documentStats =
      documentStatsResult.status === "fulfilled"
        ? documentStatsResult.value
        : { totalDocuments: 0, totalSize: 0, documentsByType: {} };

    const sharedResources =
      sharedResourcesResult.status === "fulfilled"
        ? sharedResourcesResult.value.map((a: { id: string; status: string; resourceId: string; assigneeId: string; resource?: { title?: string }; user?: { firstName?: string; lastName?: string; email: string }; assignedAt: Date }) => ({
            id: a.id,
            status: a.status,
            resourceId: a.resourceId,
            resourceTitle: a.resource?.title || "Untitled Resource",
            assigneeId: a.assigneeId,
            assigneeName: a.user
              ? `${a.user.firstName || ""} ${a.user.lastName || ""}`.trim() ||
                a.user.email
              : "Unknown",
            assignedAt: a.assignedAt,
          }))
        : [];

    console.log("✅ Admin dashboard data retrieved:", {
      userStats,
      familyStats: { total: familyStats.total },
      forumStats: { totalForums: forumStats.totalForums },
      documentStats: { total: documentStats.totalDocuments },
      sharedResourcesCount: sharedResources.length,
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
        },
        userStats: {
          total: userStats.total,
          admins: userStats.admins,
          volunteers: userStats.volunteers,
          members: userStats.members,
        },
        familyStats: {
          total: familyStats.total,
          totalMembers: familyStats.totalMembers,
          averageMembersPerFamily: familyStats.averageMembersPerFamily,
        },
        forumStats: {
          totalForums: forumStats.totalForums,
          activeForums: forumStats.activeForums,
          totalPosts: forumStats.totalPosts,
          totalReplies: forumStats.totalReplies,
          postsThisMonth: forumStats.postsThisMonth,
          forumsWithRecentActivity: forumStats.forumsWithRecentActivity,
        },
        documentStats: {
          total: documentStats.totalDocuments,
          totalSize: documentStats.totalSize,
          byType: documentStats.documentsByType,
        },
        recentSharedResources: sharedResources,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching admin dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
