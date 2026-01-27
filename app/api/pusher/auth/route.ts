import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server-auth";
import { pusherServer, parseChannelName } from "@/lib/pusher/server";
import { UserRepository } from "@/lib/db/repositories/user.repository";
import { ConversationRepository } from "@/lib/db/repositories/conversation.repository";

const userRepository = new UserRepository();
const conversationRepository = new ConversationRepository();

/**
 * POST /api/pusher/auth - Authenticate Pusher channel subscriptions
 *
 * This endpoint authorizes users for:
 * - presence-conversation-{id}: Chat presence channels (requires participation)
 * - private-user-{id}: User-specific channels (requires matching user ID)
 * - private-forum-{id}: Forum activity channels (future)
 * - private-post-{id}: Post activity channels (future)
 */
export async function POST(request: NextRequest) {
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

    // Parse the request body (Pusher sends form data)
    const formData = await request.formData();
    const socketId = formData.get("socket_id") as string;
    const channelName = formData.get("channel_name") as string;

    if (!socketId || !channelName) {
      return NextResponse.json(
        { error: "Missing socket_id or channel_name" },
        { status: 400 }
      );
    }

    // Parse the channel name to determine authorization requirements
    const { type, id } = parseChannelName(channelName);

    // Authorize based on channel type
    let authorized = false;
    let authReason = "";

    switch (type) {
      case "conversation": {
        // Check if user is a participant in the conversation
        authorized = await conversationRepository.isUserParticipant(id, user.id);
        authReason = authorized ? "participant" : "not_participant";
        break;
      }

      case "user": {
        // User can only subscribe to their own private channel
        authorized = id === user.id;
        authReason = authorized ? "own_channel" : "other_user_channel";
        break;
      }

      case "forum": {
        // For now, allow all authenticated users to subscribe to forum channels
        authorized = true;
        authReason = "authenticated";
        break;
      }

      case "post": {
        // For now, allow all authenticated users to subscribe to post channels
        authorized = true;
        authReason = "authenticated";
        break;
      }

      case "global": {
        // All authenticated users can subscribe to global presence channel
        authorized = true;
        authReason = "authenticated_global_presence";
        break;
      }

      default: {
        // Unknown channel type - deny access
        authorized = false;
        authReason = "unknown_channel_type";
      }
    }

    if (!authorized) {
      console.warn("🔒 Pusher auth denied:", {
        userId: user.id,
        channel: channelName,
        type,
        reason: authReason,
      });
      return NextResponse.json(
        { error: "Access denied to this channel" },
        { status: 403 }
      );
    }

    // Generate authorization response
    // For presence channels, include user info
    if (channelName.startsWith("presence-")) {
      const userName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
      const presenceData = {
        user_id: user.id,
        user_info: {
          name: userName,
          email: user.email,
        },
      };

      const authResponse = pusherServer.authorizeChannel(
        socketId,
        channelName,
        presenceData
      );

      console.log("🔓 Pusher auth granted (presence):", {
        userId: user.id,
        userName,
        channel: channelName,
        type,
      });

      return NextResponse.json(authResponse);
    } else {
      // For private channels, no user data needed
      const authResponse = pusherServer.authorizeChannel(socketId, channelName);

      console.log("🔓 Pusher auth granted (private):", {
        userId: user.id,
        channel: channelName,
        type,
      });

      return NextResponse.json(authResponse);
    }
  } catch (error) {
    console.error("❌ Pusher auth error:", error);
    return NextResponse.json(
      { error: "Authorization failed" },
      { status: 500 }
    );
  }
}
