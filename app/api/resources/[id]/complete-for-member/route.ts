import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server-auth";
import { UserRole } from "@prisma/client";
import { ResourceRepository } from "@/lib/db/repositories/resource.repository";
import { UserRepository } from "@/lib/db/repositories/user.repository";
import { prisma } from "@/lib/db/prisma";

const resourceRepository = new ResourceRepository(prisma);
const userRepository = new UserRepository();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: resourceId } = await params;

  // Validate ObjectID format
  if (!/^[0-9a-fA-F]{24}$/.test(resourceId)) {
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

    const user = await userRepository.getUserByClerkId(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only ADMIN and VOLUNTEER can complete forms on behalf of members
    if (user.role === UserRole.MEMBER) {
      return NextResponse.json(
        { error: "Members cannot complete forms on behalf of others" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { memberId, formData, isComplete } = body;

    if (!memberId || !formData) {
      return NextResponse.json(
        { error: "memberId and formData are required" },
        { status: 400 }
      );
    }

    // Validate memberId format
    if (!/^[0-9a-fA-F]{24}$/.test(memberId)) {
      return NextResponse.json(
        { error: "Invalid member ID format" },
        { status: 400 }
      );
    }

    // Verify the resource exists
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      select: { id: true, isDeleted: true },
    });

    if (!resource || resource.isDeleted) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    // Verify the member exists
    const member = await prisma.user.findUnique({
      where: { id: memberId },
      select: { id: true, familyId: true, role: true },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // VOLUNTEER: verify member belongs to an assigned family
    if (user.role === UserRole.VOLUNTEER) {
      if (!member.familyId) {
        return NextResponse.json(
          { error: "Member is not assigned to a family" },
          { status: 400 }
        );
      }

      const assignment = await prisma.volunteerFamilyAssignment.findFirst({
        where: {
          volunteerId: user.id,
          familyId: member.familyId,
          isActive: true,
        },
      });

      if (!assignment) {
        return NextResponse.json(
          { error: "You can only complete forms for members in your assigned families" },
          { status: 403 }
        );
      }
    }

    // Save form response on behalf of member
    const response = await resourceRepository.saveFormResponseOnBehalf(
      resourceId,
      memberId,
      user.id,
      formData,
      isComplete ?? false
    );

    // Create or update template assignment so the member can see the resource
    await prisma.templateAssignment.upsert({
      where: {
        resourceId_assigneeId: {
          resourceId,
          assigneeId: memberId,
        },
      },
      create: {
        resourceId,
        assigneeId: memberId,
        assignedBy: user.id,
        status: isComplete ? "completed" : "started",
        startedAt: new Date(),
        completedAt: isComplete ? new Date() : null,
      },
      update: {
        status: isComplete ? "completed" : "started",
        completedAt: isComplete ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: response,
      message: isComplete
        ? "Form completed on behalf of member"
        : "Form progress saved on behalf of member",
    });
  } catch (error) {
    console.error("Error completing form for member:", error);
    return NextResponse.json(
      { error: "Failed to complete form for member" },
      { status: 500 }
    );
  }
}
