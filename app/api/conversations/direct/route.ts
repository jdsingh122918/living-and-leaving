import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server-auth";
import { z } from "zod";
import { ConversationRepository } from "@/lib/db/repositories/conversation.repository";
import { UserRepository } from "@/lib/db/repositories/user.repository";

const conversationRepository = new ConversationRepository();
const userRepository = new UserRepository();

const directConversationSchema = z.object({
  targetUserId: z.string().min(1, "Target user ID is required"),
});

// POST /api/conversations/direct - Find or create direct conversation with a user
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user from database
    const user = await userRepository.getUserByClerkId(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = directConversationSchema.parse(body);

    // Verify target user exists
    const targetUser = await userRepository.getUserById(validatedData.targetUserId);
    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    // Don't allow creating conversation with yourself
    if (user.id === validatedData.targetUserId) {
      return NextResponse.json(
        { error: "Cannot create conversation with yourself" },
        { status: 400 }
      );
    }

    console.log("💬 Finding or creating direct conversation:", {
      currentUserId: user.id,
      targetUserId: validatedData.targetUserId,
    });

    // Find or create the direct conversation
    const conversation = await conversationRepository.createDirectConversation(
      user.id,
      validatedData.targetUserId
    );

    console.log("💬 Direct conversation result:", {
      conversationId: conversation.id,
      participantCount: conversation.participants?.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        conversation,
        conversationId: conversation.id,
      },
    });
  } catch (error) {
    console.error("❌ POST /api/conversations/direct error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid input data",
          details: error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to find or create conversation" },
      { status: 500 }
    );
  }
}
