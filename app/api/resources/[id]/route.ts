import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server-auth";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { ResourceRepository } from "@/lib/db/repositories/resource.repository";
import { UserRepository } from "@/lib/db/repositories/user.repository";
import { prisma } from "@/lib/db/prisma";

const resourceRepository = new ResourceRepository(prisma);
const userRepository = new UserRepository();

// Validation schema for updating a resource
const updateResourceSchema = z.object({
  title: z
    .string()
    .min(1, "Resource title is required")
    .max(200, "Resource title must be less than 200 characters")
    .optional(),
  description: z.string().max(2000, "Resource description must be less than 2,000 characters").nullable().optional(),
  body: z.string().max(50000, "Resource content must be less than 50,000 characters").nullable().optional(),
  resourceType: z.enum(["DOCUMENT", "LINK", "VIDEO", "AUDIO", "IMAGE", "TOOL", "CONTACT", "SERVICE"]).optional(),
  visibility: z.enum(["PRIVATE", "FAMILY", "PUBLIC"]).optional(),
  familyId: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  url: z.string().url().nullable().optional(),
  attachments: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  targetAudience: z.array(z.string()).optional(),
});

// GET /api/resources/[id] - Get resource by ID with access control
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database to check role
    const user = await userRepository.getUserByClerkId(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const includeDocuments = searchParams.get("includeDocuments") === "true";

    console.log("📚 GET /api/resources/[id] - User:", {
      role: user.role,
      email: user.email,
      resourceId: id,
    });

    // Get resource with access control and relations
    const resource = await resourceRepository.findById(id, user.id, user.role, {
      includeCreator: true,
      includeFamily: true,
      includeCategory: true,
      includeDocuments,
    });

    if (!resource) {
      return NextResponse.json(
        { error: "Resource not found or access denied" },
        { status: 404 }
      );
    }

    console.log("✅ Resource retrieved:", {
      resourceId: resource.id,
      title: resource.title,
      type: resource.resourceType,
      visibility: resource.visibility,
    });

    // Format response
    const formattedResource = {
      id: resource.id,
      title: resource.title,
      description: resource.description,
      body: resource.body,
      resourceType: resource.resourceType,
      visibility: resource.visibility,
      familyId: resource.familyId,
      family: (resource as any).family || null,
      categoryId: resource.categoryId,
      category: (resource as any).category || null,
      tags: resource.tags,
      url: resource.url,
      attachments: resource.attachments,
      metadata: resource.externalMeta || {},
      externalMeta: resource.externalMeta || {},
      isSystemGenerated: resource.isSystemGenerated,
      isDeleted: resource.isDeleted,
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt,
      creator: (resource as any).creator ? {
        id: (resource as any).creator.id,
        name: (resource as any).creator.firstName
          ? `${(resource as any).creator.firstName} ${(resource as any).creator.lastName || ""}`.trim()
          : (resource as any).creator.email,
        email: (resource as any).creator.email,
      } : null,
      documents: (resource as any).documents ? (resource as any).documents.map((doc: any) => {
        const document = doc.document || doc;
        return {
          id: document.id || doc.id,
          title: document.title || doc.title,
          fileName: document.fileName || doc.fileName,
          originalFileName: document.originalFileName || doc.originalFileName,
          fileSize: document.fileSize || doc.fileSize,
          mimeType: document.mimeType || doc.mimeType,
          type: document.type || doc.type,
        };
      }) : [],
    };

    return NextResponse.json({
      success: true,
      data: formattedResource,
    });
  } catch (error) {
    console.error("❌ Error fetching resource:", error);

    // Handle access denied errors specifically
    if (error instanceof Error && error.message.includes("Access denied")) {
      return NextResponse.json(
        { error: "Access denied to this resource" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch resource" },
      { status: 500 },
    );
  }
}

// PUT /api/resources/[id] - Update resource
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database to check role
    const user = await userRepository.getUserByClerkId(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();

    const validatedData = updateResourceSchema.parse(body);

    console.log("📚 Updating resource:", {
      resourceId: id,
      fields: Object.keys(validatedData),
      updatedBy: user.email,
    });

    // Convert null values to undefined for repository compatibility
    const cleanedData = Object.fromEntries(
      Object.entries(validatedData).map(([key, value]) => [key, value === null ? undefined : value])
    );

    // Update resource with access control
    const updatedResource = await resourceRepository.update(id, cleanedData, user.id, user.role);

    console.log("✅ Resource updated successfully:", {
      resourceId: updatedResource.id,
      title: updatedResource.title,
      changes: Object.keys(validatedData),
    });

    return NextResponse.json({
      success: true,
      resource: {
        id: updatedResource.id,
        title: updatedResource.title,
        description: updatedResource.description,
        body: updatedResource.body,
        resourceType: updatedResource.resourceType,
        visibility: updatedResource.visibility,
        familyId: updatedResource.familyId,
        family: (updatedResource as any).family || null,
        categoryId: updatedResource.categoryId,
        category: null,
        tags: updatedResource.tags,
        url: updatedResource.url,
        attachments: updatedResource.attachments,
        metadata: updatedResource.externalMeta || {},
        externalMeta: updatedResource.externalMeta || {},
        isSystemGenerated: updatedResource.isSystemGenerated,
        isDeleted: updatedResource.isDeleted,
        createdAt: updatedResource.createdAt,
        updatedAt: updatedResource.updatedAt,
        creator: (updatedResource as any).creator ? {
          id: (updatedResource as any).creator.id,
          name: (updatedResource as any).creator.firstName
            ? `${(updatedResource as any).creator.firstName} ${(updatedResource as any).creator.lastName || ""}`.trim()
            : (updatedResource as any).creator.email,
          email: (updatedResource as any).creator.email,
        } : null,
      },
    });
  } catch (error) {
    console.error("❌ Error updating resource:", error);

    if (error instanceof z.ZodError) {
      console.error("❌ Resource validation error:", {
        resourceId: id,
        errors: error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });

      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 },
      );
    }

    // Handle specific repository errors
    if (error instanceof Error) {
      if (error.message.includes("Resource not found")) {
        return NextResponse.json(
          { error: "Resource not found" },
          { status: 404 },
        );
      }
      if (error.message.includes("Access denied")) {
        return NextResponse.json(
          { error: "Access denied to edit this resource" },
          { status: 403 },
        );
      }
      if (error.message.includes("Category not found")) {
        return NextResponse.json(
          { error: "Category not found or not active" },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to update resource" },
      { status: 500 },
    );
  }
}

// DELETE /api/resources/[id] - Soft delete resource
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database to check role
    const user = await userRepository.getUserByClerkId(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("📚 Deleting resource:", {
      resourceId: id,
      deletedBy: user.email,
    });

    // Delete resource with access control (only creator or admin can delete)
    await resourceRepository.delete(id, user.id, user.role);

    console.log("✅ Resource deleted successfully:", {
      resourceId: id,
    });

    return NextResponse.json({
      success: true,
      message: "Resource deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting resource:", error);

    // Handle specific repository errors
    if (error instanceof Error) {
      if (error.message.includes("Resource not found")) {
        return NextResponse.json(
          { error: "Resource not found" },
          { status: 404 },
        );
      }
      if (error.message.includes("Only the resource creator")) {
        return NextResponse.json(
          { error: "Only the resource creator can delete this resource" },
          { status: 403 },
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to delete resource" },
      { status: 500 },
    );
  }
}

