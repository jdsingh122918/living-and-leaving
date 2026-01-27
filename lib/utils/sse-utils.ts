// Pusher-based real-time messaging utilities
// Replaces in-memory SSE broadcasting with Pusher for serverless compatibility

import { pusherServer, getConversationChannel } from "@/lib/pusher/server";

// Enable debug logging via environment variable
const DEBUG_PUSHER = process.env.DEBUG_PUSHER === "true";

/**
 * Broadcast a message to all users in a conversation via Pusher
 */
export async function broadcastToConversation(
  conversationId: string,
  message: { type: string; data: unknown }
): Promise<void> {
  const channel = getConversationChannel(conversationId);
  const startTime = Date.now();

  try {
    await pusherServer.trigger(channel, message.type, message.data);

    const duration = Date.now() - startTime;
    console.log("📡 Pusher broadcast:", {
      channel,
      event: message.type,
      duration: `${duration}ms`,
    });

    if (DEBUG_PUSHER) {
      console.log("📡 Pusher broadcast payload:", JSON.stringify(message.data).substring(0, 200));
    }
  } catch (error) {
    console.error("❌ Pusher broadcast failed:", {
      channel,
      event: message.type,
      error: error instanceof Error ? error.message : error,
    });
  }
}

/**
 * Broadcast typing status to all users in a conversation
 * Note: This is a fallback - clients should use client-side events for lower latency
 */
export async function broadcastTypingStatus(
  conversationId: string,
  userId: string,
  isTyping: boolean,
  userName?: string
): Promise<void> {
  const channel = getConversationChannel(conversationId);

  try {
    await pusherServer.trigger(channel, "typing_update", {
      conversationId,
      userId,
      userName,
      isTyping,
      timestamp: new Date().toISOString(),
    });

    if (DEBUG_PUSHER) {
      console.log("⌨️ Pusher typing broadcast:", { channel, userId, isTyping });
    }
  } catch (error) {
    console.error("❌ Pusher typing broadcast failed:", {
      channel,
      error: error instanceof Error ? error.message : error,
    });
  }
}

/**
 * Get list of user IDs connected to a conversation (single API call)
 */
export async function getConnectedUserIds(
  conversationId: string
): Promise<string[]> {
  const channel = getConversationChannel(conversationId);
  const startTime = Date.now();

  try {
    const response = await pusherServer.get({
      path: `/channels/${channel}/users`,
    });

    const duration = Date.now() - startTime;

    if (response.status === 200) {
      const body = await response.json();
      const users = body.users || [];
      const userIds = users.map((u: { id: string }) => u.id);

      console.log("👥 Pusher presence query:", {
        channel,
        connectedUsers: userIds.length,
        duration: `${duration}ms`,
      });

      return userIds;
    }

    console.warn("⚠️ Pusher presence query returned non-200:", {
      channel,
      status: response.status,
      duration: `${duration}ms`,
    });

    return [];
  } catch (error) {
    console.error("❌ Pusher presence query failed:", {
      channel,
      error: error instanceof Error ? error.message : error,
    });
    return [];
  }
}

// Note: Presence updates (user joined/left) are handled automatically by Pusher presence channels
// No manual broadcasting needed - clients receive pusher:member_added and pusher:member_removed events
