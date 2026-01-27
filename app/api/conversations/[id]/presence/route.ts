import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server-auth";
import { ConversationRepository } from "@/lib/db/repositories/conversation.repository";
import { UserRepository } from "@/lib/db/repositories/user.repository";
import { getConnectedUserIds } from "@/lib/utils/sse-utils";

const conversationRepository = new ConversationRepository();
const userRepository = new UserRepository();

/**
 * GET /api/conversations/[id]/presence - Get list of online users in a conversation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await userRepository.getUserByClerkId(clerkUserId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id: conversationId } = await params;

    // Check if user is participant in this conversation
    const isParticipant = await conversationRepository.isUserParticipant(
      conversationId,
      user.id
    );

    if (!isParticipant) {
      return NextResponse.json(
        { error: "Access denied: You are not a participant in this conversation" },
        { status: 403 }
      );
    }

    // Get list of connected user IDs from Pusher (single API call)
    const onlineUserIds = await getConnectedUserIds(conversationId);

    // Fetch user details with single batch query (optimized)
    const userMap = await userRepository.getUsersByIds(onlineUserIds);
    const validOnlineUsers = onlineUserIds
      .map(userId => {
        const onlineUser = userMap.get(userId);
        if (onlineUser) {
          return {
            id: onlineUser.id,
            firstName: onlineUser.firstName,
            lastName: onlineUser.lastName,
            email: onlineUser.email,
          };
        }
        return null;
      })
      .filter(Boolean);

    return NextResponse.json({
      conversationId,
      onlineUserIds,
      onlineUsers: validOnlineUsers,
      count: validOnlineUsers.length,
    });
  } catch (error) {
    console.error("❌ Error fetching presence:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
