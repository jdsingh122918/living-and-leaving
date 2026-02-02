import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server-auth";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/resources/[id]/start-template
 * Check if the current user has a template assignment for this resource.
 * For PUBLIC system templates, members can self-assign.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: resourceId } = await params;
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    // Check for existing assignment
    const assignment = await prisma.templateAssignment.findUnique({
      where: {
        resourceId_assigneeId: {
          resourceId,
          assigneeId: dbUser.id,
        },
      },
      select: {
        id: true,
        status: true,
        startedAt: true,
        completedAt: true,
        assignedAt: true,
      },
    });

    // If no assignment, check if this is a PUBLIC system template
    // that allows self-assignment
    if (!assignment) {
      const resource = await prisma.resource.findUnique({
        where: { id: resourceId },
        select: { visibility: true, isSystemGenerated: true },
      });

      const canSelfAssign =
        resource?.isSystemGenerated && resource?.visibility === "PUBLIC";

      return NextResponse.json({
        success: true,
        hasAssignment: false,
        assignment: null,
        canSelfAssign,
      });
    }

    return NextResponse.json({
      success: true,
      hasAssignment: true,
      assignment: {
        id: assignment.id,
        status: assignment.status,
        startedAt: assignment.startedAt,
        completedAt: assignment.completedAt,
        assignedAt: assignment.assignedAt,
      },
    });
  } catch (error) {
    console.error("Error checking template assignment:", error);
    return NextResponse.json(
      { error: "Failed to check template assignment" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/resources/[id]/start-template
 * Start working on a template. Creates an assignment if the resource
 * is a PUBLIC system template (self-assignment), or marks an existing
 * pending assignment as started.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: resourceId } = await params;
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    // Verify resource exists and is a system template
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      select: {
        id: true,
        title: true,
        visibility: true,
        isSystemGenerated: true,
        isDeleted: true,
        externalMeta: true,
      },
    });

    if (!resource || resource.isDeleted) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      );
    }

    const externalMeta = resource.externalMeta as {
      systemGenerated?: boolean;
      formSchema?: object;
    } | null;

    if (!externalMeta?.systemGenerated || !externalMeta?.formSchema) {
      return NextResponse.json(
        { error: "This resource is not a fillable template" },
        { status: 400 }
      );
    }

    // Upsert assignment: create if PUBLIC self-assign, or update if existing
    const canSelfAssign =
      resource.isSystemGenerated && resource.visibility === "PUBLIC";

    const existingAssignment = await prisma.templateAssignment.findUnique({
      where: {
        resourceId_assigneeId: {
          resourceId,
          assigneeId: dbUser.id,
        },
      },
    });

    if (!existingAssignment && !canSelfAssign) {
      return NextResponse.json(
        {
          error:
            "You don't have an assignment for this template. Please contact your care coordinator.",
        },
        { status: 403 }
      );
    }

    // Create or update assignment to "started"
    const assignment = await prisma.templateAssignment.upsert({
      where: {
        resourceId_assigneeId: {
          resourceId,
          assigneeId: dbUser.id,
        },
      },
      create: {
        resourceId,
        assigneeId: dbUser.id,
        assignedBy: dbUser.id, // self-assigned
        status: "started",
        startedAt: new Date(),
      },
      update: {
        status:
          existingAssignment?.status === "completed"
            ? "completed"
            : "started",
        startedAt: existingAssignment?.startedAt ?? new Date(),
      },
      select: {
        id: true,
        status: true,
        startedAt: true,
        completedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        assignmentId: assignment.id,
        status: assignment.status,
        startedAt: assignment.startedAt,
        completedAt: assignment.completedAt,
        resourceId,
        resourceTitle: resource.title,
      },
    });
  } catch (error) {
    console.error("Error starting template workflow:", error);
    return NextResponse.json(
      { error: "Failed to start template workflow" },
      { status: 500 }
    );
  }
}
