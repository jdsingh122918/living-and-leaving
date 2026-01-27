import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server-auth";
import { ResourceStatus } from "@prisma/client";
import { ResourceRepository } from "@/lib/db/repositories/resource.repository";
import { UserRepository } from "@/lib/db/repositories/user.repository";
import { FamilyRepository } from "@/lib/db/repositories/family.repository";
import { prisma } from "@/lib/db/prisma";

const resourceRepository = new ResourceRepository(prisma);
const userRepository = new UserRepository();
const familyRepository = new FamilyRepository();

/**
 * Helper to validate MongoDB ObjectID format
 */
function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * GET /api/resources/[id]/full - Get complete resource with all related data
 *
 * This composite endpoint returns:
 * - Resource details
 * - Creator info
 * - Family info
 * - Category info
 * - User's rating for this resource
 * - Documents
 *
 * This reduces multiple API calls to a single request.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Validate ObjectID format
  if (!isValidObjectId(id)) {
    return NextResponse.json(
      { error: "Invalid resource ID format" },
      { status: 400 }
    );
  }

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

    console.log("📚 GET /api/resources/[id]/full - User:", {
      role: user.role,
      email: user.email,
      resourceId: id,
    });

    // First check if resource exists (without access control)
    const resourceExists = await prisma.resource.findUnique({
      where: { id },
      select: { id: true, isDeleted: true },
    });

    if (!resourceExists || resourceExists.isDeleted) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      );
    }

    // Fetch resource with all relations and access control
    const [resource, userRating] = await Promise.all([
      // Get resource with all relations
      resourceRepository.findById(id, user.id, user.role, {
        includeSubmitter: true,
        includeApprover: true,
        includeFamily: true,
        includeCategory: true,
        includeDocuments: true,
      }),
      // Get user's rating for this resource
      resourceRepository.getUserRating(id, user.id).catch(() => null),
    ]);

    if (!resource) {
      // Resource exists but user doesn't have access
      return NextResponse.json(
        { error: "You don't have permission to view this resource" },
        { status: 403 }
      );
    }

    // Fetch family details if familyId exists but wasn't populated
    const resourceData = resource as Record<string, unknown>;
    let family = resourceData.family as Record<string, unknown> | undefined;
    if (!family && resource.familyId) {
      const fetchedFamily = await familyRepository.getFamilyById(resource.familyId);
      family = fetchedFamily ? (fetchedFamily as unknown as Record<string, unknown>) : undefined;
    }

    // Get category from prisma if not populated (as a fallback)
    let category = resourceData.category as Record<string, unknown> | undefined;
    if (!category && resource.categoryId) {
      const fetchedCategory = await prisma.category.findUnique({
        where: { id: resource.categoryId },
        select: { id: true, name: true, description: true, color: true },
      });
      category = fetchedCategory ? (fetchedCategory as unknown as Record<string, unknown>) : undefined;
    }

    console.log("✅ Full resource retrieved:", {
      resourceId: resource.id,
      title: resource.title,
      hasFamily: !!family,
      hasCategory: !!category,
      hasUserRating: !!userRating,
    });

    // Format comprehensive response
    const formattedResource = {
      id: resource.id,
      title: resource.title,
      description: resource.description,
      body: resource.body,
      resourceType: resource.resourceType,
      visibility: resource.visibility,
      status: resource.status,

      // Family details (prevents extra API call)
      familyId: resource.familyId,
      family: family
        ? {
            id: family.id,
            name: family.name,
            description: family.description,
          }
        : null,

      // Category details (prevents extra API call)
      categoryId: resource.categoryId,
      category: category
        ? {
            id: category.id,
            name: category.name,
            description: category.description,
            color: category.color,
          }
        : null,

      // Tags
      tags: resource.tags,
      structuredTags: resourceData.structuredTags || [],

      // Content fields
      url: resource.url,
      attachments: resource.attachments,
      metadata: resource.externalMeta || {},
      externalMeta: resource.externalMeta || {},

      // Feature flags
      hasCuration: resource.hasCuration,
      hasRatings: resource.hasRatings,
      hasSharing: resource.hasSharing,
      isSystemGenerated: resource.isSystemGenerated,

      // Status flags
      isFeatured: resource.status === ResourceStatus.FEATURED,
      isApproved:
        resource.status === ResourceStatus.APPROVED ||
        resource.status === ResourceStatus.FEATURED,

      // Metrics
      viewCount: resource.viewCount,
      rating: resource.rating || 0,
      ratingCount: resource.ratingCount || 0,
      shareCount: resource.shareCount || 0,

      // Timestamps
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt,
      approvedAt: resource.approvedAt,

      // Creator details (prevents extra API call)
      creator: resourceData.submitter
        ? (() => {
            const submitter = resourceData.submitter as Record<string, unknown>;
            return {
              id: submitter.id,
              name: submitter.firstName
                ? `${submitter.firstName} ${submitter.lastName || ""}`.trim()
                : submitter.email,
              email: submitter.email,
              role: submitter.role,
            };
          })()
        : null,

      // Approver details
      approvedBy: resourceData.approver
        ? (() => {
            const approver = resourceData.approver as Record<string, unknown>;
            return {
              id: approver.id,
              name: approver.firstName
                ? `${approver.firstName} ${approver.lastName || ""}`.trim()
                : approver.email,
              email: approver.email,
              role: approver.role,
            };
          })()
        : null,

      // User's rating for this resource (prevents extra API call)
      userRating: userRating
        ? {
            rating: userRating.rating,
            review: userRating.review,
            createdAt: userRating.createdAt,
          }
        : null,

      // Documents
      documents: resourceData.documents
        ? (resourceData.documents as Array<Record<string, unknown>>).map((doc: Record<string, unknown>) => {
            const document = doc.document as Record<string, unknown> | undefined;
            return {
              id: document?.id || doc.id,
              title: document?.title || doc.title,
              fileName: document?.fileName || doc.fileName,
              originalFileName: document?.originalFileName || doc.originalFileName,
              fileSize: document?.fileSize || doc.fileSize,
              mimeType: document?.mimeType || doc.mimeType,
              type: document?.type || doc.type,
            };
          })
        : [],
    };

    return NextResponse.json({
      success: true,
      data: formattedResource,
    });
  } catch (error) {
    console.error("❌ Error fetching full resource:", error);

    if (error instanceof Error && error.message.includes("Access denied")) {
      return NextResponse.json(
        { error: "Access denied to this resource" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch resource" },
      { status: 500 }
    );
  }
}
